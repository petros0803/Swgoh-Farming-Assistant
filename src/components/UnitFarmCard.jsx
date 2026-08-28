import { createPortal } from 'react-dom';
import styled, { css } from 'styled-components';
import {
  currencyIcon,
  isRareAppearance,
  storeCurrency
} from '../data/alternateFarmingSources';
import { PREVIEW_GUTTER, PREVIEW_WIDTH } from '../hooks/useFarmPreview';
import { sourceDetail } from '../utils/farmingEstimates';
import { targetLabel } from '../utils/farmLabels';
import ProgressTrack from './ui/ProgressTrack';

function goalName(guide, event) {
  return guide?.farmByEvent.get(event)?.reward.name ?? event;
}

/**
 * The unit's remaining sources, which spend a different resource than the track
 * being read. Keeps a shipment visible on the node card that a player is
 * looking at instead of only in that store's own section.
 */
function otherSources(unit, trackSources) {
  return unit.acquisition.sources.filter((source) => !trackSources.includes(source));
}

function OfferPill({ source, offer, kind }) {
  const currency = offer.currency ?? storeCurrency(source);
  const icon = currencyIcon(offer.currency ?? source);
  const item = offer.itemType ?? (kind === 'ship' ? 'blueprints' : 'shards');
  const pill = (
    <PurchasePill title={[source.label, currency].filter(Boolean).join(' · ')}>
      <OfferQuantity>{offer.quantity ? `${offer.quantity} ${item}` : 'Offer'}</OfferQuantity>
      <OfferPrice>
        {icon && <CurrencyIcon src={icon} alt={currency ?? ''} />}
        <strong>{offer.cost ?? '?'}</strong>
      </OfferPrice>
      {isRareAppearance(offer) && (
        <>
          <RareMarker aria-label="Rare appearance">◆ Rare</RareMarker>
          <PriorityMarker aria-label="Priority purchase">★ Priority</PriorityMarker>
        </>
      )}
    </PurchasePill>
  );

  return source.url ? (
    <PurchaseLink href={source.url} target="_blank" rel="noreferrer">
      {pill}
    </PurchaseLink>
  ) : pill;
}

/**
 * Every shipment price for a unit shares one wrapping row, so a card with three
 * single-offer stores reads as compactly as one store selling three bundles.
 * Each pill still links to its own store, and its icon names the currency.
 */
function StoreOffers({ sources, kind }) {
  const pills = sources.flatMap((source) =>
    (source.offers?.length > 0 ? source.offers : [source]).map((offer, index) => ({
      key: `${source.label}-${offer.currency ?? 'currency'}-${offer.quantity ?? 0}-${offer.cost ?? 0}-${index}`,
      source,
      offer
    }))
  );

  return (
    <PurchaseOffers>
      {pills.map(({ key, source, offer }) => (
        <OfferPill key={key} source={source} offer={offer} kind={kind} />
      ))}
    </PurchaseOffers>
  );
}

function NodeSource({ source }) {
  return source.url ? (
    <a href={source.url} target="_blank" rel="noreferrer">
      {sourceDetail(source)}
    </a>
  ) : sourceDetail(source);
}

/** Nodes and events stay one bullet each; shipments collapse into a single row. */
function SourceRows({ sources, kind, empty }) {
  const nodes = sources.filter((source) => source.type !== 'store');
  const stores = sources.filter((source) => source.type === 'store');

  return (
    <>
      {nodes.map((source, index) => (
        <li key={`${source.type}-${source.label}-${index}`}>
          <NodeSource source={source} />
        </li>
      ))}
      {stores.length > 0 && (
        <OfferRow>
          <StoreOffers sources={stores} kind={kind} />
        </OfferRow>
      )}
      {sources.length === 0 && empty && <li>{empty}</li>}
    </>
  );
}

function priorityReason(unit) {
  if (unit.progress.isComplete) return 'Already ready';
  if (unit.acquisition.remainingShards === 0) {
    return `Already at ${unit.progress.currentStars}★ — gear and relic materials only`;
  }
  if (unit.bountyHunterFleet) {
    return 'Bounty Hunter fleet — the Executor core, and no token grants a ship';
  }
  if (unit.kind === 'ship' && unit.criticalFor.length > 0) {
    return 'Fleet bottleneck — ship shards have no token shortcut';
  }
  if (unit.criticalFor.length > 0) {
    return `Critical-path bottleneck for ${unit.criticalFor.length} planned unlock${
      unit.criticalFor.length === 1 ? '' : 's'
    }`;
  }
  if (unit.lane === 'token') {
    return 'Stops at 6★ Relic 5, so a Lightspeed Token can still cover it';
  }
  if (unit.acquisition.ease === 'Rare rotation') return 'Rare shipment rotation — buy whenever it appears';
  if (unit.neededFor.length > 1) return `Shared by ${unit.neededFor.length} unlocks`;
  if (unit.acquisition.estimatedDays) {
    return `${unit.acquisition.ease} shard farm — start ${unit.kind === 'ship' ? 'the ship' : 'it'} early`;
  }
  if (unit.acquisition.sources.some((source) => source.type === 'store')) {
    return 'Currency-limited shipment farm';
  }
  if (unit.progress.inRoster) return `${unit.progress.progressPct}% toward target`;
  return 'Required for the next unlock';
}

/** Events and journeys hand a unit over instead of dropping shards for it. */
function unlockEvents(unit) {
  return unit.acquisition.sources
    .filter((source) => source.type === 'event' || source.type === 'journey')
    .map((source) => source.label);
}

/**
 * The farming explanation for one unit: where it drops, what a shipment costs,
 * how long it takes and which goals want it. The farming queue, the dependency
 * map and the roadmap's unit grid all share it, so every view answers "how do I
 * farm this" identically.
 *
 * `sources` narrows the bulleted list to the track being read; the rest of the
 * unit's sources move to "Also from". Previews pass none, so they list them all
 * together.
 */
export function UnitFarmCard({ unit, guide, sources = unit.acquisition.sources, note }) {
  const extras = otherSources(unit, sources);
  const events = unlockEvents(unit);
  // An unselected faction-pool alternative has no goal of its own to lead with.
  const goals = unit.goalEvent
    ? [unit.goalEvent, ...unit.neededFor.filter((event) => event !== unit.goalEvent)]
    : unit.alternativeFor;

  return (
    <>
      <Portrait src={unit.icon} alt="" loading="lazy" />
      <QueueBody>
        <QueueTitle>
          <strong>{unit.name}</strong>
          <Target>{targetLabel(unit)}</Target>
        </QueueTitle>
        {note && <EventNote>{note}</EventNote>}
        {events.length > 0 && (
          <FromEvent>
            Unlocks from {unit.unlockEvent ? 'the ' : ''}
            <strong>{events.join(' · ')}</strong>
            {unit.unlockEvent ? ' event, not a shard farm' : ''}
          </FromEvent>
        )}
        <Reason>{priorityReason(unit)}</Reason>
        <FarmFacts>
          {unit.bountyHunterFleet && <FleetFact>Bounty Hunter fleet</FleetFact>}
          {unit.criticalFor.length > 0 && <CriticalFact>Critical path</CriticalFact>}
          {unit.acquisition.sources.some(isRareAppearance) && (
            <CriticalFact>Rare shipment — buy on sight</CriticalFact>
          )}
          <Fact>{unit.acquisition.ease}</Fact>
          <Fact>{unit.acquisition.etaLabel}</Fact>
          {unit.acquisition.remainingShards > 0 && (
            <Fact>≤ {unit.acquisition.remainingShards} shards left</Fact>
          )}
        </FarmFacts>
        <SourceList>
          <SourceRows
            sources={sources}
            kind={unit.kind}
            empty="No repeatable node or curated shipment source found."
          />
        </SourceList>
        {extras.length > 0 && (
          <AlsoFrom>
            <span>Also from</span>
            <ul>
              <SourceRows sources={extras} kind={unit.kind} />
            </ul>
          </AlsoFrom>
        )}
        {goals.length > 0 && (
          <FarmLinks>
            <span>
              {unit.goalEvent ? 'Next goal' : 'Alternative for'}: {goalName(guide, goals[0])}
            </span>
            {goals.slice(1).map((event) => (
              <span key={event}>{goalName(guide, event)}</span>
            ))}
          </FarmLinks>
        )}
        <ProgressTrack value={unit.progress.progressPct} />
      </QueueBody>
      <Status $done={unit.progress.isComplete}>
        {unit.progress.isComplete ? 'Ready' : `${unit.progress.progressPct}%`}
      </Status>
    </>
  );
}

export function FarmPreview({ preview, guide }) {
  if (!preview) return null;

  // Portalled to the body: a hovered card lifts itself with a transform, which
  // would otherwise become the containing block for these fixed coordinates.
  return createPortal(
    <HoverCard
      role="tooltip"
      $flip={preview.flip}
      style={{ left: `${preview.left}px`, top: `${preview.top}px` }}
    >
      <PreviewCard $done={preview.unit.progress.isComplete}>
        <UnitFarmCard unit={preview.unit} guide={guide} note={preview.note} />
      </PreviewCard>
    </HoverCard>,
    document.body
  );
}

/** Render with `as="li"` inside a list. */
export const FarmCardShell = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[6]};
  padding: ${({ theme }) => theme.space[6]};
  border: 1px solid ${({ theme, $done }) =>
    $done ? theme.colors.successBorder : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme, $done }) =>
    $done ? theme.colors.successSoft : theme.colors.raised};
`;

const HoverCard = styled.div`
  position: fixed;
  z-index: 30;
  width: ${PREVIEW_WIDTH}px;
  max-width: calc(100vw - ${PREVIEW_GUTTER * 2}px);
  // A ready card tints its background instead of filling it, so the floating
  // preview needs an opaque layer beneath or the page shows through the text.
  background: ${({ theme }) => theme.colors.card};
  border-radius: ${({ theme }) => theme.radii.md};
  box-shadow: ${({ theme }) => theme.shadows.card};
  // Never steal the hover from the anchor that opened it.
  pointer-events: none;
  ${({ $flip }) => $flip && css`transform: translateY(-100%);`}
`;

const PreviewCard = styled(FarmCardShell)`
  border-color: ${({ theme }) => theme.colors.gold};
`;

const EventNote = styled.p`
  margin-top: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.colors.purple};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const FromEvent = styled.p`
  margin-top: ${({ theme }) => theme.space[2]};
  color: ${({ theme }) => theme.colors.gold};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

export const Portrait = styled.img`
  width: ${({ theme }) => theme.sizes.portrait};
  height: ${({ theme }) => theme.sizes.portrait};
  flex: 0 0 ${({ theme }) => theme.sizes.portrait};
  border-radius: ${({ theme }) => theme.radii.round};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  background: ${({ theme }) => theme.colors.sunken};
  object-fit: cover;
`;

export const QueueBody = styled.div`
  min-width: 0;
  flex: 1;
`;

export const QueueTitle = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[4]};
  align-items: center;
  justify-content: space-between;

  strong {
    color: ${({ theme }) => theme.colors.text};
    overflow-wrap: anywhere;
  }
`;

export const Target = styled.span`
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[4]}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  color: ${({ theme }) => theme.colors.purple};
  background: ${({ theme }) => theme.colors.relicBg};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;
`;

export const Reason = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  margin: ${({ theme }) => `${theme.space[2]} 0 ${theme.space[3]}`};
`;

export const Status = styled.span`
  color: ${({ theme, $done }) => ($done ? theme.colors.green : theme.colors.gold)};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;
`;

const FarmFacts = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  margin-bottom: ${({ theme }) => theme.space[3]};
`;

const Fact = styled.span`
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[3]}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  color: ${({ theme }) => theme.colors.body};
  background: ${({ theme }) => theme.colors.sunken};
  border: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const FleetFact = styled(Fact)`
  color: ${({ theme }) => theme.colors.blue};
  background: ${({ theme }) => theme.colors.infoSoft};
  border-color: ${({ theme }) => theme.colors.sharedBorder};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const CriticalFact = styled(Fact)`
  color: ${({ theme }) => theme.colors.gold};
  background: ${({ theme }) => theme.colors.warningSoft};
  border-color: ${({ theme }) => theme.colors.gold};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const SourceList = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space[1]};
  margin: 0 0 ${({ theme }) => theme.space[4]};
  padding-left: ${({ theme }) => theme.space[7]};
  color: ${({ theme }) => theme.colors.body};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};

  li::marker {
    color: ${({ theme }) => theme.colors.blue};
  }

  a {
    color: ${({ theme }) => theme.colors.blue};
  }
`;

const PurchaseLink = styled.a`
  display: inline-flex;
  color: inherit;
  text-decoration: none;

  &:hover {
    text-decoration: none;
  }
`;

const OfferRow = styled.li`
  padding-top: ${({ theme }) => theme.space[1]};
`;

const PurchaseOffers = styled.span`
  display: inline-flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
`;

const PurchasePill = styled.span`
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[2]};
  min-height: 28px;
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[3]}`};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.pill};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.sunken};
`;

const OfferQuantity = styled.span`
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const OfferPrice = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[1]};
  color: ${({ theme }) => theme.colors.gold};
`;

const CurrencyIcon = styled.img`
  width: 22px;
  height: 22px;
  object-fit: contain;
`;

const RareMarker = styled.span`
  color: ${({ theme }) => theme.colors.gold};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const PriorityMarker = styled.span`
  color: ${({ theme }) => theme.colors.green};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const AlsoFrom = styled.div`
  margin: ${({ theme }) => `0 0 ${theme.space[4]}`};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};

  > span {
    color: ${({ theme }) => theme.colors.muted};
    text-transform: uppercase;
    letter-spacing: ${({ theme }) => theme.letterSpacing.label};
    font-weight: ${({ theme }) => theme.fontWeights.bold};
  }

  ul {
    display: grid;
    gap: ${({ theme }) => theme.space[1]};
    margin: ${({ theme }) => theme.space[1]} 0 0;
    padding-left: ${({ theme }) => theme.space[7]};
    color: ${({ theme }) => theme.colors.muted};
  }

  li::marker {
    color: ${({ theme }) => theme.colors.purple};
  }

  a {
    color: ${({ theme }) => theme.colors.blue};
  }
`;

const FarmLinks = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[2]};
  flex-wrap: wrap;
  margin-bottom: ${({ theme }) => theme.space[4]};

  span {
    color: ${({ theme }) => theme.colors.blue};
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }

  span + span::before {
    content: '•';
    color: ${({ theme }) => theme.colors.dim};
    margin-right: ${({ theme }) => theme.space[2]};
  }
`;
