import { useMemo, useState } from 'react';
import styled from 'styled-components';
import { assaultBattles } from '../data/assaultBattles';
import { assaultBattleTeams } from '../data/assaultBattleTeams';
import {
  assaultBattleStats,
  filterAssaultBattles,
  formatRewardQuantity,
  hardRequirementLabels,
  refreshRows,
  rewardIcon,
  rewardRuleLabel,
  rewardTileLabel,
  squadRequirement,
  tierRequirementRows
} from '../utils/assaultBattles';

const BASE = import.meta.env.BASE_URL;
const STATS = assaultBattleStats(assaultBattles, assaultBattleTeams);

export default function AssaultBattlesPage() {
  const [query, setQuery] = useState('');
  const [selectedId, setSelectedId] = useState('all');
  const [expandedIds, setExpandedIds] = useState(() => new Set([assaultBattles[0].id]));
  const visibleEvents = useMemo(
    () => filterAssaultBattles(assaultBattles, query, selectedId),
    [query, selectedId]
  );

  function selectEvent(value) {
    setSelectedId(value);
    if (value !== 'all') setExpandedIds(new Set([value]));
  }

  function toggleEvent(id) {
    setExpandedIds((current) => {
      const next = new Set(current);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  return (
    <Page>
      <Hero>
        <Eyebrow>ASSAULT BATTLES GUIDE</Eyebrow>
        <h2>Requirements, rewards, and teams for every tier</h2>
        <p>
          Explore all nine recurring Assault Battles, compare hard entry gates with
          recommended investment, and choose a proven squad for each event.
        </p>
        <Stats aria-label="Assault Battle catalog summary">
          <Stat><strong>{STATS.events}</strong><span>events</span></Stat>
          <Stat><strong>{STATS.tiers}</strong><span>tiers</span></Stat>
          <Stat><strong>{STATS.teams}</strong><span>team guides</span></Stat>
        </Stats>
      </Hero>

      <EvidenceNote>
        <strong>How to read this guide:</strong> entry requirements, reward previews and
        refresh costs come from current game data. Gear, relic and mod benchmarks are
        the in-game recommendations, not entry gates. Pool drop rules follow the SWGOH
        Wiki event pages, and teams are community advice.
      </EvidenceNote>

      <Controls>
        <Field>
          <label htmlFor="assault-event">Event</label>
          <select
            id="assault-event"
            value={selectedId}
            onChange={(event) => selectEvent(event.target.value)}
          >
            <option value="all">All Assault Battles</option>
            {assaultBattles.map((event) => (
              <option key={event.id} value={event.id}>{event.name}</option>
            ))}
          </select>
        </Field>
        <Field $grow>
          <label htmlFor="assault-search">Search events or factions</label>
          <input
            id="assault-search"
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Try “Jedi”, “Trooper”, or “Peridea”…"
          />
        </Field>
        <ControlActions>
          <ActionButton
            type="button"
            onClick={() => setExpandedIds(new Set(visibleEvents.map((event) => event.id)))}
          >
            Expand results
          </ActionButton>
          <ActionButton type="button" onClick={() => setExpandedIds(new Set())}>
            Collapse all
          </ActionButton>
        </ControlActions>
      </Controls>

      <ResultCount aria-live="polite">
        Showing {visibleEvents.length} of {assaultBattles.length} events
      </ResultCount>

      {visibleEvents.length > 0 ? (
        <EventList>
          {visibleEvents.map((event) => (
            <EventSection
              key={event.id}
              event={event}
              expanded={expandedIds.has(event.id)}
              onToggle={() => toggleEvent(event.id)}
            />
          ))}
        </EventList>
      ) : (
        <EmptyState>
          <strong>No Assault Battles match that search.</strong>
          <span>Try an event name, eligible faction, or required character.</span>
        </EmptyState>
      )}
    </Page>
  );
}

function EventSection({ event, expanded, onToggle }) {
  const squad = squadRequirement(event.tiers[0].gate);
  const teams = assaultBattleTeams[event.id] ?? [];
  const finalTier = event.tiers.at(-1);

  return (
    <EventCard>
      <EventToggle type="button" onClick={onToggle} aria-expanded={expanded}>
        <EventTitle>
          <EventIcon aria-hidden="true">{event.format === 'modern' ? '✦' : '⚔'}</EventIcon>
          <div>
            <h3>{event.name}</h3>
            <p>{event.summary}</p>
          </div>
        </EventTitle>
        <EventMeta>
          <MetaBadge>{event.tiers.length} tiers</MetaBadge>
          <MetaBadge>{event.format === 'classic' ? 'Classic format' : 'Fixed-team format'}</MetaBadge>
          <Chevron $expanded={expanded} aria-hidden="true">⌄</Chevron>
        </EventMeta>
      </EventToggle>

      <EventSummaryRow>
        <SummaryItem>
          <span>{squad.label === 'Units' ? 'Required squad' : 'Eligible factions'}</span>
          <strong>{squad.names.join(' · ')}</strong>
        </SummaryItem>
        <SummaryItem>
          <span>Top tier</span>
          <strong>
            {finalTier.name} — {hardRequirementLabels(finalTier.gate)
              .filter((label) => /★|Relic|Level|Gear/.test(label))
              .join(' · ') || 'no extra gate'}
          </strong>
        </SummaryItem>
      </EventSummaryRow>

      {expanded && (
        <EventBody>
          <Block>
            <BlockHeader>
              <div>
                <Kicker>COMMUNITY PICKS</Kicker>
                <h4>Top teams</h4>
              </div>
              <small>Ranked by reliability and practical investment.</small>
            </BlockHeader>
            <TeamGrid>
              {teams.map((team, index) => (
                <TeamCard key={team.name} team={team} rank={index + 1} />
              ))}
            </TeamGrid>
          </Block>

          <Block>
            <BlockHeader>
              <div>
                <Kicker>ALL DIFFICULTIES</Kicker>
                <h4>Tiers</h4>
              </div>
              <small>Scroll sideways to compare every tier.</small>
            </BlockHeader>
            <TierRail>
              {event.tiers.map((tier, index) => (
                <TierColumn
                  key={tier.id}
                  tier={tier}
                  previousTierName={index > 0 ? event.tiers[index - 1].name : null}
                />
              ))}
            </TierRail>
          </Block>

          <Sources>
            <strong>Event data sources</strong>
            <div>
              {event.sources.map((source) => (
                <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
                  {source.label} ↗
                </a>
              ))}
            </div>
          </Sources>
        </EventBody>
      )}
    </EventCard>
  );
}

function TierColumn({ tier, previousTierName }) {
  const requirements = tierRequirementRows(tier, previousTierName);
  const { guaranteed, groups } = tier.rewards;
  const refresh = refreshRows(tier.refresh);

  return (
    <Tier>
      <TierName>{tier.name}</TierName>

      <SpecGrid>
        <Spec>
          <SpecLabel>Requirements</SpecLabel>
          <SpecRows>
            {requirements.map((row) => (
              <SpecRow key={row.label}>
                <dt>{row.label}</dt>
                <dd>{row.value}</dd>
              </SpecRow>
            ))}
          </SpecRows>
        </Spec>
        <Spec>
          <SpecLabel>Recommended</SpecLabel>
          <SpecList>
            {tier.recommended.map((item) => <li key={item}>{item}</li>)}
          </SpecList>
        </Spec>
      </SpecGrid>

      <TierBlock>
        <SpecLabel>Rewards</SpecLabel>
        {tier.firstTimeRewards.length > 0 && (
          <RewardBlock caption="First clear only" rewards={tier.firstTimeRewards} highlight />
        )}
        {guaranteed.length > 0 && (
          <RewardBlock caption="Guaranteed every run" rewards={guaranteed} />
        )}
        {groups.map((group) => (
          <RewardBlock
            key={group.group}
            caption={group.label}
            rule={rewardRuleLabel(group)}
            rewards={group.rewards}
          />
        ))}
        {guaranteed.length === 0 && groups.length === 0 && (
          <MutedText>No reward preview published.</MutedText>
        )}
        {!tier.rewardRulesSourced && (
          <PoolNote>
            Pool sizes the event page does not state follow the usual
            one-per-pool pattern.
          </PoolNote>
        )}
      </TierBlock>

      <TierBlock>
        <SpecLabel>Refresh</SpecLabel>
        <MutedText>
          {tier.refresh.attempts} attempt{tier.refresh.attempts === 1 ? '' : 's'} per day
        </MutedText>
        {refresh.length > 0 ? (
          <SpecRows>
            {refresh.map((row) => (
              <SpecRow key={row.label}>
                <dt>{row.label}</dt>
                <dd>
                  <Cost>
                    {row.cost}
                    {row.icon
                      ? <img src={`${BASE}${row.icon}`} alt={row.currency} loading="lazy" />
                      : <span>{row.currency.toLowerCase()}</span>}
                  </Cost>
                </dd>
              </SpecRow>
            ))}
          </SpecRows>
        ) : (
          <MutedText>Cannot be refreshed with crystals.</MutedText>
        )}
      </TierBlock>
    </Tier>
  );
}

function RewardBlock({ caption, rule, rewards, highlight }) {
  return (
    <RewardSection $highlight={highlight}>
      <RewardCaption>{caption}</RewardCaption>
      {rule && <RewardRule>{rule}</RewardRule>}
      <RewardGrid>
        {rewards.map((reward, index) => (
          <RewardTile
            key={`${reward.id}-${index}`}
            title={`${reward.name}: ${formatRewardQuantity(reward)}`}
            aria-label={`${reward.name}: ${formatRewardQuantity(reward)}`}
          >
            <Art
              icon={reward.icon}
              name={reward.name}
              fallback={rewardTileLabel(reward) || rewardIcon(reward.kind)}
            />
            <RewardQuantity>{formatRewardQuantity(reward)}</RewardQuantity>
          </RewardTile>
        ))}
      </RewardGrid>
    </RewardSection>
  );
}

/** Local artwork when the project ships it, otherwise a readable caption. */
function Art({ icon, name, fallback }) {
  if (icon) {
    return (
      <ArtFrame>
        <img src={`${BASE}${icon}`} alt="" loading="lazy" />
      </ArtFrame>
    );
  }
  return (
    <ArtFrame aria-hidden="true" title={name}>
      <ArtFallback>{fallback}</ArtFallback>
    </ArtFrame>
  );
}

function TeamCard({ team, rank }) {
  return (
    <Team>
      <TeamTop>
        <Rank aria-label={`Rank ${rank}`}>#{rank}</Rank>
        <TeamLabel $category={team.category}>{team.category}</TeamLabel>
      </TeamTop>
      <h5>{team.name}</h5>
      <TierFit>{team.tierFit}</TierFit>
      <PortraitRow aria-label={`${team.name} squad`}>
        {team.units.map((unit) => (
          <UnitPortrait key={unit.id}>
            <img
              src={`${BASE}assets/characters/${encodeURIComponent(unit.name.replace(/[’']/g, ''))}.png`}
              alt=""
              loading="lazy"
              onError={(event) => { event.currentTarget.style.visibility = 'hidden'; }}
            />
            <small>{unit.name}</small>
          </UnitPortrait>
        ))}
      </PortraitRow>
      <Strategy>{team.strategy}</Strategy>
      {team.caveat && <Caveat>{team.caveat}</Caveat>}
      <TeamSources>
        {team.sources.map((source) => (
          <a key={source.url} href={source.url} target="_blank" rel="noreferrer">
            {source.label} ↗
          </a>
        ))}
      </TeamSources>
    </Team>
  );
}

const Page = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[12]};
`;

const Hero = styled.section`
  padding: ${({ theme }) => theme.space[16]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background:
    radial-gradient(circle at 86% 20%, ${({ theme }) => theme.colors.glowGold}, transparent 32%),
    linear-gradient(145deg, ${({ theme }) => theme.colors.raised}, ${({ theme }) => theme.colors.card});
  box-shadow: ${({ theme }) => theme.shadows.card};

  h2 {
    margin-top: ${({ theme }) => theme.space[4]};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: clamp(1.7rem, 4vw, 2.8rem);
    line-height: ${({ theme }) => theme.lineHeights.snug};
  }

  > p {
    max-width: 760px;
    margin-top: ${({ theme }) => theme.space[7]};
    color: ${({ theme }) => theme.colors.body};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
  }

  ${({ theme }) => theme.media.phone} {
    padding: ${({ theme }) => theme.space[10]};
  }
`;

const Eyebrow = styled.div`
  color: ${({ theme }) => theme.colors.gold};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.md};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
`;

const Stats = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[12]};
  margin-top: ${({ theme }) => theme.space[12]};
`;

const Stat = styled.div`
  display: flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[4]};

  strong {
    color: ${({ theme }) => theme.colors.gold};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }

  span { color: ${({ theme }) => theme.colors.muted}; }
`;

const EvidenceNote = styled.aside`
  padding: ${({ theme }) => theme.space[9]} ${({ theme }) => theme.space[10]};
  border: 1px solid ${({ theme }) => theme.colors.recommendedBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.recommendedBg};
  color: ${({ theme }) => theme.colors.body};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};

  strong { color: ${({ theme }) => theme.colors.recommendedText}; }
`;

const Controls = styled.section`
  display: flex;
  align-items: flex-end;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[8]};
  padding: ${({ theme }) => theme.space[9]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.sunken};
`;

const Field = styled.div`
  display: grid;
  flex: ${({ $grow }) => $grow ? '1 1 280px' : '0 1 260px'};
  gap: ${({ theme }) => theme.space[4]};

  label {
    color: ${({ theme }) => theme.colors.muted};
    font-size: ${({ theme }) => theme.fontSizes.md};
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
  }

  input,
  select {
    width: 100%;
    min-height: ${({ theme }) => theme.sizes.tap};
    padding: ${({ theme }) => `${theme.space[5]} ${theme.space[7]}`};
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: ${({ theme }) => theme.radii.sm};
    outline: none;
    background: ${({ theme }) => theme.colors.card};
    color: ${({ theme }) => theme.colors.text};
    font: inherit;

    &:focus {
      border-color: ${({ theme }) => theme.colors.blue};
      box-shadow: 0 0 0 3px ${({ theme }) => theme.colors.focus};
    }
  }
`;

const ControlActions = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[5]};
`;

const ActionButton = styled.button`
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: 0 ${({ theme }) => theme.space[9]};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.raised};
  color: ${({ theme }) => theme.colors.body};
  cursor: pointer;

  &:hover {
    border-color: ${({ theme }) => theme.colors.blue};
    color: ${({ theme }) => theme.colors.text};
  }

  &:focus-visible { outline: 3px solid ${({ theme }) => theme.colors.focus}; }
`;

const ResultCount = styled.p`
  margin-top: ${({ theme }) => `-${theme.space[7]}`};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const EventList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[10]};
`;

const EventCard = styled.article`
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.card};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const EventToggle = styled.button`
  display: flex;
  width: 100%;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[10]};
  padding: ${({ theme }) => theme.space[11]} ${({ theme }) => theme.space[12]};
  border: 0;
  background: transparent;
  color: inherit;
  text-align: left;
  cursor: pointer;

  &:hover { background: ${({ theme }) => theme.colors.hover}; }
  &:focus-visible { outline: 3px solid ${({ theme }) => theme.colors.focus}; outline-offset: -3px; }

  ${({ theme }) => theme.media.phone} {
    align-items: flex-start;
    flex-direction: column;
    gap: ${({ theme }) => theme.space[7]};
    padding: ${({ theme }) => theme.space[9]};
  }
`;

const EventTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[9]};
  min-width: 0;

  h3 {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes['2xl']};
  }

  p {
    margin-top: ${({ theme }) => theme.space[3]};
    color: ${({ theme }) => theme.colors.muted};
    line-height: ${({ theme }) => theme.lineHeights.body};
  }
`;

const EventIcon = styled.span`
  display: grid;
  flex: 0 0 52px;
  width: 52px;
  height: 52px;
  place-items: center;
  border: 1px solid ${({ theme }) => theme.colors.recommendedBorder};
  border-radius: ${({ theme }) => theme.radii.round};
  background: ${({ theme }) => theme.colors.recommendedBg};
  color: ${({ theme }) => theme.colors.gold};
  font-size: ${({ theme }) => theme.fontSizes.xl};
`;

const EventMeta = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[5]};
`;

const MetaBadge = styled.span`
  padding: ${({ theme }) => `${theme.space[4]} ${theme.space[7]}`};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme }) => theme.colors.sunken};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.md};
  white-space: nowrap;
`;

const Chevron = styled.span`
  display: inline-block;
  color: ${({ theme }) => theme.colors.gold};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  transform: rotate(${({ $expanded }) => $expanded ? '180deg' : '0'});
  transition: transform 0.2s;
`;

/** Sits outside the toggle, so it keeps clear of the header's hover band. */
const EventSummaryRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(min(100%, 280px), 1fr));
  gap: ${({ theme }) => theme.space[10]};
  padding: ${({ theme }) => theme.space[9]} ${({ theme }) => theme.space[12]}
    ${({ theme }) => theme.space[12]};

  ${({ theme }) => theme.media.phone} {
    padding: ${({ theme }) => theme.space[8]} ${({ theme }) => theme.space[9]}
      ${({ theme }) => theme.space[10]};
  }
`;

const SummaryItem = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[4]};
  min-width: 0;

  span {
    color: ${({ theme }) => theme.colors.muted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    letter-spacing: ${({ theme }) => theme.letterSpacing.label};
    text-transform: uppercase;
  }

  strong {
    color: ${({ theme }) => theme.colors.body};
    font-weight: ${({ theme }) => theme.fontWeights.medium};
    line-height: ${({ theme }) => theme.lineHeights.body};
  }
`;

const EventBody = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[14]};
  padding: ${({ theme }) => theme.space[12]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  background: ${({ theme }) => theme.colors.sunken};

  ${({ theme }) => theme.media.phone} {
    gap: ${({ theme }) => theme.space[11]};
    padding: ${({ theme }) => theme.space[9]};
  }
`;

const Block = styled.section`
  display: grid;
  gap: ${({ theme }) => theme.space[9]};
  min-width: 0;
`;

const BlockHeader = styled.div`
  display: flex;
  align-items: end;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[8]};

  h4 {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.xl};
  }

  small { color: ${({ theme }) => theme.colors.muted}; }

  ${({ theme }) => theme.media.phone} {
    align-items: flex-start;
    flex-direction: column;
    gap: ${({ theme }) => theme.space[4]};
  }
`;

const Kicker = styled.div`
  margin-bottom: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.colors.blue};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
`;

const TeamGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[10]};

  ${({ theme }) => theme.media.phone} {
    grid-template-columns: minmax(0, 1fr);
  }
`;

/**
 * Seven shared rows keep every part of the card level with its neighbour.
 * Spacing stays on the children, so the subgrid itself adds no row gap.
 */
const Team = styled.article`
  display: grid;
  grid-row: span 7;
  grid-template-rows: subgrid;
  row-gap: 0;
  min-width: 0;
  padding: ${({ theme }) => theme.space[11]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.card};

  h5 {
    margin-top: ${({ theme }) => theme.space[7]};
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.lg};
  }
`;

const TeamTop = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[5]};
`;

const Rank = styled.span`
  color: ${({ theme }) => theme.colors.dim};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const TeamLabel = styled.span`
  padding: ${({ theme }) => `${theme.space[3]} ${theme.space[6]}`};
  border: 1px solid ${({ theme, $category }) =>
    $category === 'Strongest' ? theme.colors.relicBorder : theme.colors.sharedBorder};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $category }) =>
    $category === 'Strongest' ? theme.colors.relicBg : theme.colors.sharedBg};
  color: ${({ theme, $category }) =>
    $category === 'Strongest' ? theme.colors.purple : theme.colors.blue};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.label};
  text-transform: uppercase;
  white-space: nowrap;
`;

const TierFit = styled.p`
  margin-top: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.colors.green};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;

const PortraitRow = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(58px, 1fr));
  gap: ${({ theme }) => theme.space[7]};
  margin: ${({ theme }) => theme.space[10]} 0;
`;

const UnitPortrait = styled.div`
  min-width: 0;
  text-align: center;

  img {
    width: 56px;
    height: 56px;
    border: 1px solid ${({ theme }) => theme.colors.borderStrong};
    border-radius: ${({ theme }) => theme.radii.round};
    background: ${({ theme }) => theme.colors.raised};
    object-fit: cover;
  }

  small {
    display: block;
    margin-top: ${({ theme }) => theme.space[4]};
    color: ${({ theme }) => theme.colors.muted};
    font-size: ${({ theme }) => theme.fontSizes.xs};
    line-height: ${({ theme }) => theme.lineHeights.snug};
  }
`;

const Strategy = styled.p`
  color: ${({ theme }) => theme.colors.body};
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

const Caveat = styled.p`
  grid-row: 6;
  align-self: start;
  margin-top: ${({ theme }) => theme.space[7]};
  padding: ${({ theme }) => theme.space[7]};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.warningSoft};
  color: ${({ theme }) => theme.colors.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

/** Pinned so cards without a caveat keep their links on the shared last row. */
const TeamSources = styled.div`
  display: flex;
  grid-row: 7;
  align-content: start;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[7]};
  padding-top: ${({ theme }) => theme.space[10]};

  a {
    color: ${({ theme }) => theme.colors.blue};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    text-decoration: none;
    &:hover { text-decoration: underline; }
  }
`;

/** Four shared rows so name, specs, rewards and refresh line up across tiers. */
const TierRail = styled.div`
  display: grid;
  grid-auto-columns: 320px;
  grid-auto-flow: column;
  grid-template-rows: repeat(4, auto);
  column-gap: ${({ theme }) => theme.space[8]};
  row-gap: ${({ theme }) => theme.space[9]};
  overflow-x: auto;
  padding-bottom: ${({ theme }) => theme.space[7]};
  scroll-snap-type: x proximity;

  ${({ theme }) => theme.media.phone} {
    grid-auto-columns: 84vw;
  }
`;

const Tier = styled.article`
  display: grid;
  grid-row: 1 / -1;
  grid-template-rows: subgrid;
  row-gap: ${({ theme }) => theme.space[9]};
  min-width: 0;
  padding: ${({ theme }) => theme.space[9]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.card};
  scroll-snap-align: start;
`;

const TierName = styled.h5`
  padding-bottom: ${({ theme }) => theme.space[6]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.green};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
  text-transform: uppercase;
`;

const SpecGrid = styled.div`
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 0.85fr);
  gap: ${({ theme }) => theme.space[8]};
`;

const Spec = styled.div`
  min-width: 0;
`;

const SpecLabel = styled.div`
  margin-bottom: ${({ theme }) => theme.space[5]};
  color: ${({ theme }) => theme.colors.blue};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.label};
  text-transform: uppercase;
`;

const SpecRows = styled.dl`
  display: grid;
  gap: ${({ theme }) => theme.space[4]};
`;

const SpecRow = styled.div`
  display: grid;
  grid-template-columns: auto minmax(0, 1fr);
  gap: ${({ theme }) => theme.space[4]};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.body};

  dt { color: ${({ theme }) => theme.colors.muted}; }
  dd { color: ${({ theme }) => theme.colors.body}; overflow-wrap: anywhere; }
`;

const Cost = styled.span`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};

  img {
    width: 18px;
    height: 18px;
    object-fit: contain;
  }
`;

const SpecList = styled.ul`
  display: grid;
  gap: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.colors.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.body};
  list-style: none;
`;

const TierBlock = styled.div`
  display: grid;
  align-content: start;
  gap: ${({ theme }) => theme.space[7]};
  padding-top: ${({ theme }) => theme.space[7]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const RewardSection = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[5]};
  padding: ${({ theme }) => theme.space[6]};
  border: 1px solid ${({ theme, $highlight }) =>
    $highlight ? theme.colors.recommendedBorder : 'transparent'};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme, $highlight }) =>
    $highlight ? theme.colors.recommendedBg : theme.colors.sunken};
`;

const RewardCaption = styled.div`
  color: ${({ theme }) => theme.colors.body};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const RewardRule = styled.div`
  margin-top: ${({ theme }) => `-${theme.space[3]}`};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const RewardGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(52px, 1fr));
  gap: ${({ theme }) => theme.space[5]};
`;

const RewardTile = styled.div`
  display: grid;
  justify-items: center;
  gap: ${({ theme }) => theme.space[2]};
  cursor: help;
`;

const ArtFrame = styled.span`
  display: grid;
  width: 44px;
  height: 44px;
  place-items: center;
  overflow: hidden;
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.sm};
  background: ${({ theme }) => theme.colors.raised};

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const ArtFallback = styled.span`
  padding: 0 2px;
  color: ${({ theme }) => theme.colors.gold};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  line-height: ${({ theme }) => theme.lineHeights.tight};
  text-align: center;
  overflow-wrap: anywhere;
`;

const RewardQuantity = styled.span`
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-variant-numeric: tabular-nums;
`;

const PoolNote = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.body};
`;

const MutedText = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Sources = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[8]};
  padding-top: ${({ theme }) => theme.space[9]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.md};

  div { display: flex; flex-wrap: wrap; gap: ${({ theme }) => theme.space[8]}; }
  a { color: ${({ theme }) => theme.colors.blue}; text-decoration: none; }
  a:hover { text-decoration: underline; }
`;

const EmptyState = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[4]};
  padding: ${({ theme }) => theme.space[17]} ${({ theme }) => theme.space[12]};
  border: 1px dashed ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.lg};
  color: ${({ theme }) => theme.colors.muted};
  text-align: center;

  strong { color: ${({ theme }) => theme.colors.text}; }
`;
