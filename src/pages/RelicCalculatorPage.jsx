import { useEffect, useMemo, useState } from 'react';
import styled from 'styled-components';
import ErrorBanner from '../components/ErrorBanner';
import Placeholder from '../components/ui/Placeholder';
import { useRosterState } from '../context/rosterContext';
import { allFarmsRoadmap } from '../data/allFarmsRoadmap';
import { MAX_RELIC_LEVEL } from '../data/relicMaterials';
import { sortFarmsByName } from '../utils/farmLabels';
import {
  buildRosterCharacters,
  calculateJourneyPlan,
  calculateRelicPlan,
  materialRows
} from '../utils/relicCalculator';

const characterCatalog = Array.from(
  new Map(
    allFarmsRoadmap
      .flatMap((journey) => journey.characters || [])
      .map((character) => [character.id, character])
  ).values()
);

const relicJourneys = sortFarmsByName(
  allFarmsRoadmap.filter((journey) =>
    journey.characters?.some((character) => (character.targetR || 0) > 0)
  )
);

export default function RelicCalculatorPage() {
  const { roster, playerData, previewMode, error } = useRosterState();
  const [mode, setMode] = useState('character');
  const characters = useMemo(
    () => buildRosterCharacters(roster, characterCatalog),
    [roster]
  );
  const [characterId, setCharacterId] = useState('');
  const selectedCharacter = characters.find((character) => character.id === characterId)
    || characters[0];
  const [targetLevel, setTargetLevel] = useState(7);
  const [journeyIndex, setJourneyIndex] = useState(0);
  const selectedJourney = relicJourneys[journeyIndex] || relicJourneys[0];

  useEffect(() => {
    if (!selectedCharacter) return;
    setCharacterId(selectedCharacter.id);
    setTargetLevel((current) =>
      Math.max(selectedCharacter.currentRelic, Math.min(MAX_RELIC_LEVEL, current))
    );
  }, [selectedCharacter]);

  const characterPlan = useMemo(
    () => selectedCharacter
      ? calculateRelicPlan(selectedCharacter.currentRelic, targetLevel)
      : null,
    [selectedCharacter, targetLevel]
  );
  const journeyPlan = useMemo(
    () => selectedJourney && roster ? calculateJourneyPlan(selectedJourney, roster) : null,
    [selectedJourney, roster]
  );

  if (!roster) {
    return (
      <>
        <ErrorBanner message={error} />
        {!error && (
          <Placeholder title="Sync your roster to calculate relic materials">
            Enter your Ally Code above. The calculator will read each character&apos;s
            current relic level and only count the upgrades you still need.
          </Placeholder>
        )}
      </>
    );
  }

  return (
    <Page>
      <Hero>
        <Eyebrow>RELIC MATERIALS CALCULATOR</Eyebrow>
        <h2>Plan one character or a full Journey Guide</h2>
        <p>
          Costs start from your synced relic levels and include every scrap material,
          Signal Data type, and credit cost through Relic {MAX_RELIC_LEVEL}.
        </p>
      </Hero>

      {previewMode && (
        <PreviewNotice>
          Preview mode treats every Journey character as Relic 0. Switch preview off
          to use {playerData?.data?.name ? `${playerData.data.name}'s` : 'your'} roster.
        </PreviewNotice>
      )}

      <ModeTabs aria-label="Calculator scope">
        <ModeButton type="button" $active={mode === 'character'} onClick={() => setMode('character')}>
          Single character
        </ModeButton>
        <ModeButton type="button" $active={mode === 'journey'} onClick={() => setMode('journey')}>
          Entire journey
        </ModeButton>
      </ModeTabs>

      {mode === 'character' ? (
        characters.length > 0 ? (
          <CharacterCalculator
            characters={characters}
            selected={selectedCharacter}
            characterId={characterId}
            onCharacterChange={setCharacterId}
            targetLevel={targetLevel}
            onTargetChange={(value) => setTargetLevel(Number(value))}
            plan={characterPlan}
          />
        ) : (
          <Placeholder title="No characters available">
            Sync an Ally Code with at least one character, or leave preview mode to use
            the imported roster.
          </Placeholder>
        )
      ) : (
        <JourneyCalculator
          journeys={relicJourneys}
          selectedIndex={journeyIndex}
          onJourneyChange={(value) => setJourneyIndex(Number(value))}
          journey={selectedJourney}
          plan={journeyPlan}
        />
      )}

      <MaterialLegend />
    </Page>
  );
}

function CharacterCalculator({
  characters,
  selected,
  characterId,
  onCharacterChange,
  targetLevel,
  onTargetChange,
  plan
}) {
  const alreadyComplete = plan.levels.length === 0;

  return (
    <>
      <Controls>
        <Field>
          <span>Character</span>
          <select value={characterId || selected.id} onChange={(event) => onCharacterChange(event.target.value)}>
            {characters.map((character) => (
              <option key={character.id} value={character.id}>
                {character.name} — R{character.currentRelic}
              </option>
            ))}
          </select>
        </Field>
        <Field>
          <span>Target relic level</span>
          <select value={targetLevel} onChange={(event) => onTargetChange(event.target.value)}>
            {Array.from(
              { length: MAX_RELIC_LEVEL - selected.currentRelic + 1 },
              (_, index) => selected.currentRelic + index
            ).map((level) => <option key={level} value={level}>Relic {level}</option>)}
          </select>
        </Field>
        <CharacterSummary>
          {selected.icon && <Portrait src={selected.icon} alt="" />}
          <div>
            <strong>{selected.name}</strong>
            <span>
              {selected.gearLevel < 13 ? `Gear ${selected.gearLevel} · ` : ''}
              Current R{selected.currentRelic} → Target R{plan.targetLevel}
            </span>
          </div>
        </CharacterSummary>
      </Controls>

      {selected.gearLevel < 13 && (
        <InfoNote>
          This character is Gear {selected.gearLevel}. Relic costs begin after Gear 13;
          gear needed to reach Gear 13 is not included.
        </InfoNote>
      )}

      {alreadyComplete ? (
        <Placeholder slim title="Target already reached">
          {selected.name} is already Relic {selected.currentRelic}; no additional relic
          materials are needed.
        </Placeholder>
      ) : (
        <>
          <SectionHeading>
            Level-by-level breakdown <span>{plan.levels.length} upgrades</span>
          </SectionHeading>
          <LevelList>
            {plan.levels.map((entry) => (
              <LevelCard key={entry.level}>
                <LevelTitle>
                  <span>R{entry.level - 1}</span>
                  <b>→</b>
                  <strong>Relic {entry.level}</strong>
                </LevelTitle>
                <MaterialGrid counts={entry.materials} compact />
              </LevelCard>
            ))}
          </LevelList>
          <TotalsPanel>
            <SectionHeading as="h3">
              Total needed <span>R{plan.currentLevel} → R{plan.targetLevel}</span>
            </SectionHeading>
            <MaterialGrid counts={plan.totals} />
          </TotalsPanel>
        </>
      )}
    </>
  );
}

function JourneyCalculator({ journeys, selectedIndex, onJourneyChange, journey, plan }) {
  return (
    <>
      <Controls>
        <Field $wide>
          <span>Journey Guide</span>
          <select value={selectedIndex} onChange={(event) => onJourneyChange(event.target.value)}>
            {journeys.map((entry, index) => (
              <option key={`${entry.category}-${entry.event}`} value={index}>
                {entry.category.replace(/^[^\p{L}\p{N}]+/u, '')}
              </option>
            ))}
          </select>
        </Field>
        <CharacterSummary>
          {journey.reward?.icon && <Portrait src={journey.reward.icon} alt="" />}
          <div>
            <strong>{journey.category}</strong>
            <span>{journey.event} · {plan.characters.length} relic requirements</span>
          </div>
        </CharacterSummary>
      </Controls>

      <SectionHeading>
        Character requirements <span>based on current roster</span>
      </SectionHeading>
      <JourneyGrid>
        {plan.characters.map((character) => (
          <JourneyCard key={character.id} $complete={character.plan.levels.length === 0}>
            {character.icon && <Portrait src={character.icon} alt="" />}
            <div>
              <strong>{character.name}</strong>
              <span>R{character.currentRelic} → R{character.targetR}</span>
            </div>
            <JourneyStatus $complete={character.plan.levels.length === 0}>
              {character.plan.levels.length === 0 ? 'Ready' : `${character.plan.levels.length} levels`}
            </JourneyStatus>
          </JourneyCard>
        ))}
      </JourneyGrid>

      <TotalsPanel>
        <SectionHeading as="h3">
          Journey total <span>all remaining character upgrades</span>
        </SectionHeading>
        {materialRows(plan.totals).length > 0 ? (
          <MaterialGrid counts={plan.totals} />
        ) : (
          <ReadyText>Every relic requirement for this journey is already complete.</ReadyText>
        )}
      </TotalsPanel>
    </>
  );
}

function MaterialGrid({ counts, compact = false, showAmounts = true }) {
  return (
    <Materials $compact={compact}>
      {materialRows(counts).map((material) => (
        <Material key={material.id}>
          <MaterialIcon src={material.icon} alt="" loading="lazy" />
          <MaterialText>
            {showAmounts && <strong>{material.amount.toLocaleString()}</strong>}
            <span>{material.name}</span>
          </MaterialText>
        </Material>
      ))}
    </Materials>
  );
}

function MaterialLegend() {
  const allMaterials = Object.fromEntries(
    // A positive value ensures the shared renderer displays every supported item.
    ['credits', 'carboniteCircuitBoard', 'bronziumWiring', 'chromiumTransistor',
      'aurodiumHeatsink', 'electriumConductor', 'zinbiddleCard', 'impulseDetector',
      'aeromagnifier', 'gyrdaKeypad', 'droidBrain', 'coaxialServomotor',
      'fragmentedSignalData', 'incompleteSignalData', 'flawedSignalData',
      'corruptedSignalData'].map((id) => [id, 1])
  );

  return (
    <Legend>
      <SectionHeading as="h3">
        Material reference <span>all resources used by the calculator</span>
      </SectionHeading>
      <MaterialGrid counts={allMaterials} compact showAmounts={false} />
    </Legend>
  );
}

const Page = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[10]};
`;

const Hero = styled.section`
  padding: ${({ theme }) => theme.space[12]};
  border: 1px solid ${({ theme }) => theme.colors.relicBorder};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: linear-gradient(135deg, ${({ theme }) => theme.colors.relicBg}, ${({ theme }) => theme.colors.card});

  h2 {
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.heading};
    font-size: ${({ theme }) => theme.fontSizes['4xl']};
    margin: ${({ theme }) => `${theme.space[3]} 0 ${theme.space[4]}`};
  }

  p {
    color: ${({ theme }) => theme.colors.muted};
    line-height: ${({ theme }) => theme.lineHeights.relaxed};
    max-width: ${({ theme }) => theme.sizes.contentText};
  }
`;

const Eyebrow = styled.div`
  color: ${({ theme }) => theme.colors.purple};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
`;

const PreviewNotice = styled.div`
  padding: ${({ theme }) => theme.space[7]};
  border: 1px solid ${({ theme }) => theme.colors.sharedBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.blue};
  background: ${({ theme }) => theme.colors.sharedBg};
`;

const ModeTabs = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[4]};
`;

const ModeButton = styled.button`
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => `0 ${theme.space[9]}`};
  border: 1px solid ${({ theme, $active }) => $active ? theme.colors.purple : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $active }) => $active ? theme.colors.relicBg : theme.colors.sunken};
  color: ${({ theme, $active }) => $active ? theme.colors.purple : theme.colors.muted};
  font: inherit;
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  cursor: pointer;
`;

const Controls = styled.section`
  display: flex;
  align-items: end;
  flex-wrap: wrap;
  gap: ${({ theme }) => theme.space[8]};
  padding: ${({ theme }) => theme.space[10]};
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const Field = styled.label`
  display: flex;
  flex: ${({ $wide }) => $wide ? '1 1 360px' : '1 1 220px'};
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};

  select {
    min-height: ${({ theme }) => theme.sizes.tap};
    padding: ${({ theme }) => `0 ${theme.space[6]}`};
    border: 1px solid ${({ theme }) => theme.colors.border};
    border-radius: ${({ theme }) => theme.radii.md};
    background: ${({ theme }) => theme.colors.bg};
    color: ${({ theme }) => theme.colors.text};
    font: inherit;
  }
`;

const CharacterSummary = styled.div`
  display: flex;
  flex: 1 1 280px;
  align-items: center;
  gap: ${({ theme }) => theme.space[6]};
  min-height: ${({ theme }) => theme.sizes.tap};

  div {
    display: flex;
    flex-direction: column;
    gap: ${({ theme }) => theme.space[2]};
    min-width: 0;
  }

  strong { color: ${({ theme }) => theme.colors.text}; }
  span { color: ${({ theme }) => theme.colors.muted}; font-size: ${({ theme }) => theme.fontSizes.sm}; }
`;

const Portrait = styled.img`
  width: 48px;
  height: 48px;
  flex: 0 0 48px;
  object-fit: cover;
  border: 2px solid ${({ theme }) => theme.colors.relicBorder};
  border-radius: ${({ theme }) => theme.radii.round};
  background: ${({ theme }) => theme.colors.bg};
`;

const InfoNote = styled.div`
  padding: ${({ theme }) => theme.space[7]};
  border: 1px solid ${({ theme }) => theme.colors.recommendedBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  color: ${({ theme }) => theme.colors.recommendedText};
  background: ${({ theme }) => theme.colors.recommendedBg};
`;

const SectionHeading = styled.h2`
  display: flex;
  align-items: baseline;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[6]};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes['2xl']};

  span {
    color: ${({ theme }) => theme.colors.muted};
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    font-weight: ${({ theme }) => theme.fontWeights.regular};
  }
`;

const LevelList = styled.div`
  display: grid;
  gap: ${({ theme }) => theme.space[7]};
`;

const LevelCard = styled.article`
  display: grid;
  grid-template-columns: minmax(130px, 180px) 1fr;
  gap: ${({ theme }) => theme.space[9]};
  padding: ${({ theme }) => theme.space[9]};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left: 3px solid ${({ theme }) => theme.colors.purple};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.sunken};

  ${({ theme }) => theme.media.phone} {
    grid-template-columns: 1fr;
  }
`;

const LevelTitle = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  color: ${({ theme }) => theme.colors.muted};
  white-space: nowrap;

  b { color: ${({ theme }) => theme.colors.dim}; }
  strong { color: ${({ theme }) => theme.colors.purple}; }
`;

const Materials = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(${({ $compact }) => $compact ? '135px' : '170px'}, 1fr));
  gap: ${({ theme }) => theme.space[5]};
`;

const Material = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[4]};
  min-width: 0;
`;

const MaterialIcon = styled.img`
  width: 38px;
  height: 38px;
  flex: 0 0 38px;
  object-fit: contain;
`;

const MaterialText = styled.div`
  display: flex;
  flex-direction: column;
  min-width: 0;

  strong { color: ${({ theme }) => theme.colors.text}; }
  span {
    color: ${({ theme }) => theme.colors.muted};
    font-size: ${({ theme }) => theme.fontSizes.sm};
    line-height: ${({ theme }) => theme.lineHeights.snug};
  }
`;

const TotalsPanel = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[9]};
  padding: ${({ theme }) => theme.space[10]};
  border: 1px solid ${({ theme }) => theme.colors.relicBorder};
  border-radius: ${({ theme }) => theme.radii.lg};
  background: ${({ theme }) => theme.colors.relicBg};
`;

const JourneyGrid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.space[6]};
`;

const JourneyCard = styled.article`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};
  padding: ${({ theme }) => theme.space[7]};
  border: 1px solid ${({ theme, $complete }) => $complete ? theme.colors.successBorder : theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.md};
  background: ${({ theme }) => theme.colors.sunken};

  div {
    display: flex;
    flex: 1;
    flex-direction: column;
    min-width: 0;
  }

  strong { color: ${({ theme }) => theme.colors.text}; }
  span { color: ${({ theme }) => theme.colors.muted}; font-size: ${({ theme }) => theme.fontSizes.sm}; }
`;

const JourneyStatus = styled.span`
  flex: 0 0 auto;
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[4]}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  color: ${({ theme, $complete }) => $complete ? theme.colors.green : theme.colors.purple} !important;
  background: ${({ theme, $complete }) => $complete ? theme.colors.successBg : theme.colors.relicBg};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
`;

const Legend = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[8]};
  margin-top: ${({ theme }) => theme.space[8]};
  padding-top: ${({ theme }) => theme.space[10]};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
`;

const ReadyText = styled.p`
  color: ${({ theme }) => theme.colors.green};
`;
