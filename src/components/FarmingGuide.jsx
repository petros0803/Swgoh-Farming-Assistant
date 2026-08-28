import { useState } from 'react';
import styled, { css } from 'styled-components';
import { GEAR_LEVEL_FOR_RELICS } from '../data/gameRules';
import { useFarmPreview } from '../hooks/useFarmPreview';
import { requirementLabel, targetLabel } from '../utils/farmLabels';
import ProgressTrack from './ui/ProgressTrack';
import {
  FarmCardShell,
  FarmPreview,
  Portrait,
  QueueBody,
  QueueTitle,
  Reason,
  Status,
  Target,
  UnitFarmCard
} from './UnitFarmCard';

/**
 * What is left on a unit whose stars are already done: the relic gap, plus the
 * gear level when it still blocks relics from being applied at all.
 */
function relicGates(unit) {
  const { currentRelic, currentGear } = unit.progress;
  const targetRelic = unit.target?.targetR ?? 0;

  if (targetRelic === 0) {
    return [{ key: 'gear', label: `Gear ${currentGear}`, note: 'no relic required', met: true }];
  }

  const remaining = Math.max(0, targetRelic - currentRelic);
  const gates = [{
    key: 'relic',
    label: `Relic ${currentRelic} / ${targetRelic}`,
    note: remaining > 0 ? `${remaining} level${remaining === 1 ? '' : 's'} to go` : 'met',
    met: remaining === 0
  }];

  if (currentGear < GEAR_LEVEL_FOR_RELICS) {
    gates.push({
      key: 'gear',
      label: `Gear ${currentGear} / ${GEAR_LEVEL_FOR_RELICS}`,
      note: 'relics unlock at G13',
      met: false
    });
  }

  return gates;
}

export default function FarmingGuide({ guide }) {
  const [view, setView] = useState('queue');
  const [showCompletedUnits, setShowCompletedUnits] = useState(false);
  const [showAllQueue, setShowAllQueue] = useState(false);
  const [focusedId, setFocusedId] = useState(null);
  const [mapQuery, setMapQuery] = useState('');
  const [hideCompletedFarms, setHideCompletedFarms] = useState(true);
  const [hideCompletedUnits, setHideCompletedUnits] = useState(false);
  const { preview, show: showPreview, hide: hidePreview } = useFarmPreview();

  const farmingTracks = guide.farmingTracks
    .map((track) => ({
      ...track,
      entries: track.entries
        .filter(({ unit }) => showCompletedUnits || !unit.progress.isComplete)
        .map((entry, index) => ({ ...entry, position: index + 1 }))
    }))
    .filter((track) => track.entries.length > 0);
  const hasCollapsedTracks = farmingTracks.some((track) => track.entries.length > 4);
  const gearWork = guide.gearWork;
  const unlocks = guide.eventUnlocks.filter(
    (unit) => showCompletedUnits || !unit.progress.isComplete
  );
  const focusedUnit = focusedId ? guide.unitById.get(focusedId) : null;
  const normalizedQuery = mapQuery.trim().toLowerCase();

  // Positions stay tied to the full farming order so hiding events never
  // renumbers the steps that remain.
  const mapFarms = guide.farms
    .map((farm, index) => ({ farm, position: index + 1 }))
    .filter(({ farm }) => !hideCompletedFarms || !farm.isComplete);

  // Counts the pills the toggle actually removes. The same unit can be done for
  // one event and still open for another, so this counts per event.
  const completedUnitCount = guide.farms.reduce(
    (total, farm) => total + farm.units.filter((unit) => unit.progress.isComplete).length,
    0
  );

  /** The map is per event, so the note spells out that event's own gate. */
  function previewNode(mapUnit, farm, element) {
    showPreview(
      guide.unitById.get(mapUnit.id),
      element,
      `${farm.reward.name} needs ${requirementLabel(mapUnit)}${
        mapUnit.selected ? '' : ' · optional faction-pool alternative'
      }`
    );
  }

  function selectView(next) {
    hidePreview();
    setView(next);
  }

  function farmIsConnected(farm) {
    if (!focusedUnit) return true;
    return (
      focusedUnit.neededFor.includes(farm.event) ||
      focusedUnit.alternativeFor.includes(farm.event) ||
      farm.reward.id === focusedUnit.id
    );
  }

  return (
    <Guide aria-labelledby="farming-guide-title">
      <GuideHeader>
        <div>
          <Eyebrow>ROSTER-AWARE FAST PATH</Eyebrow>
          <h2 id="farming-guide-title">Recommended Farming Guide</h2>
          <Intro>
            A practical daily plan based on your roster, unlock dependencies, current farming
            locations, shard speed and requirement reuse.
          </Intro>
        </div>
        <Completion>
          <strong>{guide.completedCount} / {guide.totalCount}</strong>
          <span>unique requirements ready</span>
        </Completion>
      </GuideHeader>

      <Method>
        <strong>Fastest route:</strong> run the first open target in every track at the same time.
        Fleet, Light/Dark Side and Cantina energy regenerate separately, and each store currency is
        independent. Within a track, finish the earlier roadmap goal first; buy rare rotating shards
        whenever they appear. A Lightspeed Token shortcut is treated as optional, never assumed.
        <br />
        <strong>Estimate assumptions:</strong> 33% shard drop chance, five attempts per hard/fleet
        node, 120 natural plus 45 bonus Cantina energy daily, and no paid refreshes. “Up to” dates
        are conservative because the roster API cannot see shards banked toward your next star.
        Gear and relic material time is not included.
      </Method>

      <Tabs role="tablist" aria-label="Farming guide views">
        <Tab
          type="button"
          role="tab"
          aria-selected={view === 'queue'}
          onClick={() => selectView('queue')}
        >
          1. Farming order
        </Tab>
        <Tab
          type="button"
          role="tab"
          aria-selected={view === 'map'}
          onClick={() => selectView('map')}
        >
          2. Interactive dependency map
        </Tab>
      </Tabs>

      {view === 'queue' ? (
        <Panel role="tabpanel">
          <PanelHeader>
            <div>
              <h3>Do these in parallel</h3>
              <p>
                Start priority 1 in every section today. Also sim lower listed hard nodes when spare
                energy allows; the number is the spend and refresh order within that resource only.
                Units already at the required stars are listed separately, since no node can help
                them.
              </p>
            </div>
            <ToggleButton
              type="button"
              aria-pressed={!showCompletedUnits}
              $active={!showCompletedUnits}
              onClick={() => setShowCompletedUnits((current) => !current)}
            >
              {showCompletedUnits ? 'Hide completed units' : 'Show completed units'}
            </ToggleButton>
          </PanelHeader>

          {farmingTracks.map((track) => (
            <QueueGroup key={track.id}>
              <GroupHeader>
                <GroupTitle>{track.label}</GroupTitle>
                <GroupHint>{track.hint}</GroupHint>
              </GroupHeader>
              <Queue>
                {(showAllQueue ? track.entries : track.entries.slice(0, 4))
                  .map(({ unit, sources, position }) => (
                  <FarmCardShell as="li" key={unit.id} $done={unit.progress.isComplete}>
                    <Rank aria-label={`Priority ${position} in ${track.label}`}>{position}</Rank>
                    <UnitFarmCard unit={unit} guide={guide} sources={sources} />
                  </FarmCardShell>
                ))}
              </Queue>
            </QueueGroup>
          ))}

          {hasCollapsedTracks && (
            <ShowMore type="button" onClick={() => setShowAllQueue((current) => !current)}>
              {showAllQueue ? 'Show top priorities only' : 'Show every priority in each track'}
            </ShowMore>
          )}

          {gearWork.length > 0 && (
            <Unlocks>
              <GroupHeader>
                <GroupTitle>Stars already done — gear and relics only</GroupTitle>
                <GroupHint>
                  You own these at the required rarity, so stop spending energy on their shard nodes
                </GroupHint>
              </GroupHeader>
              <UnlockList>
                {gearWork.map((unit) => (
                  <li key={unit.id}>
                    <Portrait src={unit.icon} alt="" loading="lazy" />
                    <QueueBody>
                      <QueueTitle>
                        <strong>{unit.name}</strong>
                        <Target>{targetLabel(unit)}</Target>
                      </QueueTitle>
                      <Reason>
                        {unit.progress.currentStars}★ owned · needs{' '}
                        {guide.farmByEvent.get(unit.goalEvent)?.reward.name ?? unit.goalEvent}
                      </Reason>
                      <Gates>
                        {relicGates(unit).map((gate) => (
                          <Gate key={gate.key} $met={gate.met}>
                            <strong>{gate.label}</strong>
                            <span>{gate.note}</span>
                          </Gate>
                        ))}
                      </Gates>
                      <ProgressTrack value={unit.progress.progressPct} />
                    </QueueBody>
                    <Status $done={false}>{unit.progress.statusText}</Status>
                  </li>
                ))}
              </UnlockList>
            </Unlocks>
          )}

          {unlocks.length > 0 && (
            <Unlocks>
              <GroupHeader>
                <GroupTitle>Arrives from an event, not a farm</GroupTitle>
                <GroupHint>No energy of its own — the event's requirements are listed above</GroupHint>
              </GroupHeader>
              <UnlockList>
                {unlocks.map((unit) => {
                  const source = guide.farmByEvent.get(unit.unlockEvent);
                  return (
                    <li key={unit.id}>
                      <Portrait src={unit.icon} alt="" loading="lazy" />
                      <QueueBody>
                        <QueueTitle>
                          <strong>{unit.name}</strong>
                          <Target>{targetLabel(unit)}</Target>
                        </QueueTitle>
                        <Reason>
                          {unit.unlockEvent}
                          {source && ` · ${source.readyCount} / ${source.selectedCount} requirements ready`}
                          {source?.readyToRun && ' · run it now'}
                        </Reason>
                      </QueueBody>
                      <Status $done={unit.progress.isComplete}>
                        {unit.progress.isComplete ? 'Ready' : unit.progress.statusText}
                      </Status>
                    </li>
                  );
                })}
              </UnlockList>
            </Unlocks>
          )}
        </Panel>
      ) : (
        <Panel role="tabpanel">
          <PanelHeader>
            <div>
              <h3>Everything connected to your targets</h3>
              <p>
                Select any unit to see every unlock it feeds. Dashed units are optional faction
                alternatives and are not included in the fast path.
              </p>
            </div>
            <MapControls>
              <MapSearch
                type="search"
                value={mapQuery}
                onChange={(event) => setMapQuery(event.target.value)}
                placeholder="Find a unit…"
                aria-label="Find a unit in the dependency map"
              />
              <ToggleButton
                type="button"
                aria-pressed={hideCompletedFarms}
                $active={hideCompletedFarms}
                title={
                  guide.completedFarmCount === 0
                    ? 'No event is fully complete yet, so nothing is hidden.'
                    : undefined
                }
                onClick={() => setHideCompletedFarms((current) => !current)}
              >
                {hideCompletedFarms ? 'Show completed events' : 'Hide completed events'}
                {` (${guide.completedFarmCount})`}
              </ToggleButton>
              <ToggleButton
                type="button"
                aria-pressed={hideCompletedUnits}
                $active={hideCompletedUnits}
                onClick={() => setHideCompletedUnits((current) => !current)}
              >
                {hideCompletedUnits ? 'Show completed units' : 'Hide completed units'}
                {` (${completedUnitCount})`}
              </ToggleButton>
            </MapControls>
          </PanelHeader>

          {focusedUnit && (
            <FocusCard>
              <Portrait src={focusedUnit.icon} alt="" />
              <div>
                <strong>{focusedUnit.name}</strong>
                <p>
                  {focusedUnit.selected
                    ? `Farm to ${targetLabel(focusedUnit)}.`
                    : 'Optional faction-pool alternative.'}{' '}
                  Connected to{' '}
                  {[...focusedUnit.neededFor, ...focusedUnit.alternativeFor]
                    .map((event) => guide.farmByEvent.get(event)?.reward.name ?? event)
                    .join(', ')}.
                </p>
              </div>
              <ClearFocus type="button" onClick={() => setFocusedId(null)}>
                Clear focus
              </ClearFocus>
            </FocusCard>
          )}

          {mapFarms.length === 0 && (
            <EmptyMap>Every event on this path is complete.</EmptyMap>
          )}

          <Map>
            {mapFarms.map(({ farm, position }, visibleIndex) => {
              const matchingIds = new Set(
                farm.units
                  .filter((unit) => !normalizedQuery || unit.name.toLowerCase().includes(normalizedQuery))
                  .map((unit) => unit.id)
              );
              const connected = farmIsConnected(farm);
              const visibleUnits = farm.units.filter(
                (unit) => !hideCompletedUnits || !unit.progress.isComplete
              );

              return (
                <FarmNode key={farm.event} $dimmed={!connected}>
                  <StepRail>
                    <Step $done={farm.isComplete}>{position}</Step>
                    {visibleIndex < mapFarms.length - 1 && <Rail aria-hidden="true" />}
                  </StepRail>
                  <FarmContent $done={farm.isComplete}>
                    <FarmHeader>
                      <RewardPortrait src={farm.reward.icon} alt="" loading="lazy" />
                      <div>
                        <FarmType>
                          {farm.isRoot ? 'ROADMAP TARGET' : 'PREREQUISITE JOURNEY'}
                        </FarmType>
                        <h4>{farm.reward.name}</h4>
                        <small>{farm.event}</small>
                      </div>
                      {farm.isComplete && (
                        <FarmDone $warn={Boolean(farm.rewardShortfall)}>
                          {farm.rewardShortfall
                            ? `✓ Unlocked · ${farm.rewardShortfall}`
                            : farm.isRoot ? '✓ Done' : '✓ Already unlocked'}
                        </FarmDone>
                      )}
                      {!farm.isComplete && farm.rewardOwned && (
                        <FarmCount>
                          Unlocked · {farm.readyCount} / {farm.selectedCount} at target
                        </FarmCount>
                      )}
                      {!farm.isComplete && !farm.rewardOwned && (
                        <FarmCount $ready={farm.readyToRun}>
                          {farm.readyToRun
                            ? 'Ready to run this event'
                            : `${farm.readyCount} / ${farm.selectedCount} ready`}
                        </FarmCount>
                      )}
                      {farm.dependencies.length > 0 && (
                        <DependencyLabel>
                          Requires{' '}
                          {farm.dependencies
                            .map((event) => guide.farmByEvent.get(event)?.reward.name ?? event)
                            .join(' + ')}
                        </DependencyLabel>
                      )}
                    </FarmHeader>

                    <Arrow aria-hidden="true">requirements → unlock</Arrow>

                    <UnitCloud>
                      {visibleUnits.length === 0 && (
                        <AllReadyNote>Every unit in this event is ready.</AllReadyNote>
                      )}
                      {visibleUnits.map((unit) => {
                        const isFocused = focusedId === unit.id;
                        const hiddenBySearch = normalizedQuery && !matchingIds.has(unit.id);

                        return (
                          <UnitNode
                            key={unit.id}
                            type="button"
                            $selected={unit.selected}
                            $ready={unit.progress.isComplete}
                            $focused={isFocused}
                            $hiddenBySearch={hiddenBySearch}
                            aria-pressed={isFocused}
                            onClick={() => setFocusedId(isFocused ? null : unit.id)}
                            onMouseEnter={(event) =>
                              previewNode(unit, farm, event.currentTarget)}
                            onMouseLeave={hidePreview}
                            onFocus={(event) => previewNode(unit, farm, event.currentTarget)}
                            onBlur={hidePreview}
                          >
                            <MiniPortrait src={unit.icon} alt="" loading="lazy" />
                            <span>{unit.name}</span>
                            {unit.progress.isComplete && <ReadyMark aria-label="Ready">✓</ReadyMark>}
                          </UnitNode>
                        );
                      })}
                    </UnitCloud>

                    {farm.isComplete && !farm.isRoot && (
                      <AllReadyNote>
                        You already have {farm.reward.name}, so this event is done and its
                        requirements are excluded from the farming order.
                        {farm.rewardShortfall &&
                          ` Keep farming ${farm.reward.name} though — a later farm needs ${farm.rewardShortfall.replace(/^Need /, '')}.`}
                      </AllReadyNote>
                    )}

                    {farm.isPool && (
                      <PoolNote>
                        Personalized fast squad: {farm.poolSize} selected from {farm.units.length}{' '}
                        eligible units.
                      </PoolNote>
                    )}
                  </FarmContent>
                </FarmNode>
              );
            })}
          </Map>

          <FarmPreview preview={preview} guide={guide} />
        </Panel>
      )}
    </Guide>
  );
}

const Guide = styled.section`
  margin-bottom: ${({ theme }) => theme.space[12]};
  border: 1px solid ${({ theme }) => theme.colors.borderStrong};
  border-radius: ${({ theme }) => theme.radii.lg};
  overflow: hidden;
  background: ${({ theme }) => theme.colors.card};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const GuideHeader = styled.header`
  display: flex;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[10]};
  padding: ${({ theme }) => theme.space[12]};
  background:
    radial-gradient(circle at top right, ${({ theme }) => theme.colors.glowGold}, transparent 45%),
    ${({ theme }) => theme.colors.raised};

  h2 {
    color: ${({ theme }) => theme.colors.gold};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes.xxl};
    margin: ${({ theme }) => `${theme.space[2]} 0 ${theme.space[4]}`};
  }

  ${({ theme }) => theme.media.phone} {
    padding: ${({ theme }) => theme.space[8]};
    flex-direction: column;
  }
`;

const Eyebrow = styled.span`
  color: ${({ theme }) => theme.colors.blue};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
`;

const Intro = styled.p`
  max-width: 720px;
  color: ${({ theme }) => theme.colors.body};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

const Completion = styled.div`
  min-width: 150px;
  align-self: center;
  text-align: right;

  strong,
  span {
    display: block;
  }

  strong {
    color: ${({ theme }) => theme.colors.green};
    font-size: ${({ theme }) => theme.fontSizes.xxl};
  }

  span {
    color: ${({ theme }) => theme.colors.muted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  ${({ theme }) => theme.media.phone} {
    align-self: flex-start;
    text-align: left;
  }
`;

const Method = styled.p`
  padding: ${({ theme }) => `${theme.space[6]} ${theme.space[12]}`};
  color: ${({ theme }) => theme.colors.muted};
  background: ${({ theme }) => theme.colors.infoSoft};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};

  strong {
    color: ${({ theme }) => theme.colors.text};
  }

  ${({ theme }) => theme.media.phone} {
    padding: ${({ theme }) => theme.space[8]};
  }
`;

const Tabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => `${theme.space[7]} ${theme.space[12]} 0`};
  background: ${({ theme }) => theme.colors.sunken};

  ${({ theme }) => theme.media.phone} {
    padding: ${({ theme }) => `${theme.space[6]} ${theme.space[6]} 0`};
  }
`;

const Tab = styled.button`
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => `0 ${theme.space[8]}`};
  color: ${({ theme }) => theme.colors.muted};
  background: transparent;
  border: 1px solid transparent;
  border-bottom: none;
  border-radius: ${({ theme }) => `${theme.radii.sm} ${theme.radii.sm} 0 0`};
  cursor: pointer;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};

  &[aria-selected='true'] {
    color: ${({ theme }) => theme.colors.gold};
    background: ${({ theme }) => theme.colors.card};
    border-color: ${({ theme }) => theme.colors.border};
  }
`;

const Panel = styled.div`
  padding: ${({ theme }) => theme.space[12]};

  ${({ theme }) => theme.media.phone} {
    padding: ${({ theme }) => theme.space[6]};
  }
`;

const PanelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[8]};
  margin-bottom: ${({ theme }) => theme.space[9]};

  > div {
    flex: 1 1 260px;
  }

  h3 {
    font-family: ${({ theme }) => theme.fonts.heading};
    color: ${({ theme }) => theme.colors.text};
    margin-bottom: ${({ theme }) => theme.space[2]};
  }

  p {
    color: ${({ theme }) => theme.colors.muted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
  }

  ${({ theme }) => theme.media.phone} {
    align-items: stretch;
    flex-direction: column;
  }
`;

const QueueGroup = styled.section`
  & + & {
    margin-top: ${({ theme }) => theme.space[9]};
  }
`;

const GroupHeader = styled.header`
  display: flex;
  align-items: baseline;
  flex-wrap: wrap;
  gap: ${({ theme }) => `${theme.space[1]} ${theme.space[4]}`};
  margin-bottom: ${({ theme }) => theme.space[5]};
  padding-bottom: ${({ theme }) => theme.space[3]};
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
`;

const GroupTitle = styled.h4`
  font-family: ${({ theme }) => theme.fonts.heading};
  color: ${({ theme }) => theme.colors.text};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: 0.06em;
`;

const GroupHint = styled.span`
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
`;

const Unlocks = styled.section`
  margin-top: ${({ theme }) => theme.space[9]};
`;

const Gates = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
  margin: ${({ theme }) => `${theme.space[3]} 0 ${theme.space[4]}`};
`;

const Gate = styled.span`
  display: inline-flex;
  align-items: baseline;
  gap: ${({ theme }) => theme.space[3]};
  padding: ${({ theme }) => `${theme.space[1]} ${theme.space[5]}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  border: 1px solid ${({ theme, $met }) => ($met ? theme.colors.successBorder : theme.colors.relicBorder)};
  background: ${({ theme, $met }) => ($met ? theme.colors.successSoft : theme.colors.relicBg)};
  font-size: ${({ theme }) => theme.fontSizes.xs};

  strong {
    font-weight: ${({ theme }) => theme.fontWeights.semibold};
    color: ${({ theme }) => theme.colors.text};
    white-space: nowrap;
  }

  span {
    color: ${({ theme }) => theme.colors.muted};
  }
`;

const UnlockList = styled.ul`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[6]};

  li {
    display: flex;
    align-items: center;
    gap: ${({ theme }) => theme.space[6]};
    padding: ${({ theme }) => theme.space[6]};
    border: 1px dashed ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.sunken};
  }

  ${({ theme }) => theme.media.phone} {
    grid-template-columns: 1fr;
  }
`;

const Queue = styled.ol`
  list-style: none;
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[6]};

  ${({ theme }) => theme.media.phone} {
    grid-template-columns: 1fr;
  }
`;



/**
 * Fixed rather than absolute: the guide clips its own overflow, which would cut
 * the preview off near the edges of the map.
 */



const Rank = styled.span`
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  flex: 0 0 28px;
  border-radius: ${({ theme }) => theme.radii.round};
  background: ${({ theme }) => theme.colors.infoSoft};
  color: ${({ theme }) => theme.colors.blue};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;























const ShowMore = styled.button`
  display: block;
  margin: ${({ theme }) => `${theme.space[8]} auto 0`};
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => `0 ${theme.space[8]}`};
  color: ${({ theme }) => theme.colors.blue};
  background: ${({ theme }) => theme.colors.infoSoft};
  border: 1px solid ${({ theme }) => theme.colors.sharedBorder};
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
`;

const MapControls = styled.div`
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: ${({ theme }) => theme.space[4]};
  flex-wrap: wrap;
`;

const ToggleButton = styled.button`
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => `0 ${theme.space[8]}`};
  white-space: nowrap;
  border-radius: ${({ theme }) => theme.radii.sm};
  cursor: pointer;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme, $active }) => ($active ? theme.colors.gold : theme.colors.body)};
  background: ${({ theme, $active }) =>
    $active ? theme.colors.warningSoft : theme.colors.raised};
  border: 1px solid
    ${({ theme, $active }) => ($active ? theme.colors.gold : theme.colors.border)};
  transition: background-color 0.15s, border-color 0.15s, color 0.15s;

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.borderStrong};
  }

  &:disabled {
    opacity: 0.45;
    cursor: not-allowed;
  }
`;

const EmptyMap = styled.p`
  padding: ${({ theme }) => theme.space[12]};
  color: ${({ theme }) => theme.colors.green};
  background: ${({ theme }) => theme.colors.successSoft};
  border: 1px solid ${({ theme }) => theme.colors.successBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  text-align: center;
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const MapSearch = styled.input`
  min-height: ${({ theme }) => theme.sizes.tap};
  min-width: 210px;
  padding: ${({ theme }) => `0 ${theme.space[6]}`};
  color: ${({ theme }) => theme.colors.text};
  background: ${({ theme }) => theme.colors.sunken};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.sm};
`;

const FocusCard = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[6]};
  margin-bottom: ${({ theme }) => theme.space[8]};
  padding: ${({ theme }) => theme.space[6]};
  background: ${({ theme }) => theme.colors.infoSoft};
  border: 1px solid ${({ theme }) => theme.colors.sharedBorder};
  border-radius: ${({ theme }) => theme.radii.md};

  div {
    min-width: 0;
    flex: 1;
  }

  p {
    color: ${({ theme }) => theme.colors.body};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    margin-top: ${({ theme }) => theme.space[2]};
  }
`;

const ClearFocus = styled.button`
  color: ${({ theme }) => theme.colors.blue};
  background: transparent;
  border: none;
  cursor: pointer;
  white-space: nowrap;
`;

const Map = styled.div`
  display: flex;
  flex-direction: column;
`;

const FarmNode = styled.article`
  display: grid;
  grid-template-columns: 38px minmax(0, 1fr);
  transition: opacity 0.2s;
  ${({ $dimmed }) => $dimmed && css`opacity: 0.28;`}
`;

const StepRail = styled.div`
  display: flex;
  align-items: center;
  flex-direction: column;
`;

const Step = styled.span`
  display: grid;
  place-items: center;
  width: 30px;
  height: 30px;
  flex: 0 0 30px;
  border-radius: ${({ theme }) => theme.radii.round};
  color: ${({ theme }) => theme.colors.onPrimary};
  background: ${({ theme, $done }) => ($done ? theme.colors.green : theme.colors.primary)};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.sm};
`;

const Rail = styled.span`
  width: 2px;
  min-height: 32px;
  flex: 1;
  background: ${({ theme }) => theme.colors.borderStrong};
`;

const FarmContent = styled.div`
  margin: 0 0 ${({ theme }) => theme.space[8]} ${({ theme }) => theme.space[5]};
  padding: ${({ theme }) => theme.space[7]};
  border: 1px solid
    ${({ theme, $done }) => ($done ? theme.colors.successBorder : theme.colors.border)};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.raised};
`;

const FarmDone = styled.span`
  margin-left: auto;
  color: ${({ theme, $warn }) => ($warn ? theme.colors.gold : theme.colors.green)};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  white-space: nowrap;
`;

const FarmCount = styled.span`
  margin-left: auto;
  color: ${({ theme, $ready }) => ($ready ? theme.colors.gold : theme.colors.muted)};
  font-weight: ${({ theme, $ready }) =>
    $ready ? theme.fontWeights.bold : theme.fontWeights.regular};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  white-space: nowrap;
`;

const FarmHeader = styled.header`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};

  h4 {
    color: ${({ theme }) => theme.colors.gold};
    font-family: ${({ theme }) => theme.fonts.heading};
  }

  small {
    color: ${({ theme }) => theme.colors.muted};
  }

  ${({ theme }) => theme.media.phone} {
    align-items: flex-start;
    flex-wrap: wrap;
  }
`;

const RewardPortrait = styled(Portrait)`
  width: 40px;
  height: 40px;
  flex-basis: 40px;
  border-color: ${({ theme }) => theme.colors.gold};
`;

const FarmType = styled.span`
  display: block;
  color: ${({ theme }) => theme.colors.blue};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.label};
`;

const DependencyLabel = styled.span`
  max-width: 42%;
  color: ${({ theme }) => theme.colors.purple};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  text-align: right;

  ${({ theme }) => theme.media.phone} {
    width: 100%;
    max-width: none;
    margin-left: 0;
    text-align: left;
  }
`;

const Arrow = styled.div`
  color: ${({ theme }) => theme.colors.dim};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  text-align: center;
  margin: ${({ theme }) => `${theme.space[4]} 0`};
`;

const UnitCloud = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[3]};
`;

const UnitNode = styled.button`
  display: inline-flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  min-height: 34px;
  max-width: 220px;
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[4]} ${theme.space[2]} ${theme.space[2]}`};
  color: ${({ theme, $selected }) => ($selected ? theme.colors.text : theme.colors.muted)};
  background: ${({ theme, $ready }) => ($ready ? theme.colors.successSoft : theme.colors.card)};
  border: 1px ${({ $selected }) => ($selected ? 'solid' : 'dashed')}
    ${({ theme, $focused, $ready }) =>
      $focused ? theme.colors.gold : $ready ? theme.colors.successBorder : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  cursor: pointer;
  opacity: ${({ $selected }) => ($selected ? 1 : 0.62)};
  transition: opacity 0.15s, border-color 0.15s, transform 0.15s;

  ${({ $hiddenBySearch }) => $hiddenBySearch && css`opacity: 0.12;`}

  &:hover,
  &:focus-visible {
    opacity: 1;
    transform: translateY(-1px);
  }

  span {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    font-size: ${({ theme }) => theme.fontSizes.xs};
  }
`;

const MiniPortrait = styled.img`
  width: 26px;
  height: 26px;
  flex: 0 0 26px;
  border-radius: ${({ theme }) => theme.radii.round};
  background: ${({ theme }) => theme.colors.sunken};
  object-fit: cover;
`;

const ReadyMark = styled.span`
  color: ${({ theme }) => theme.colors.green};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const AllReadyNote = styled.p`
  margin-top: ${({ theme }) => theme.space[7]};
  color: ${({ theme }) => theme.colors.green};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

const PoolNote = styled.p`
  margin-top: ${({ theme }) => theme.space[5]};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.xs};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;

