import styled from 'styled-components';
import InfoTip from './InfoTip';
import UnitCard from './UnitCard';
import ProgressTrack from './ui/ProgressTrack';
import { C3PO_TIP_HTML } from '../utils/sharedUnits';

export default function PhaseBlock({ phase, guide, expanded, onToggle }) {
  return (
    <Block>
      <Toggle type="button" aria-expanded={expanded} onClick={onToggle}>
        <Title>
          <Chevron aria-hidden="true">▼</Chevron>
          {phase.reward?.icon && (
            <Portrait src={phase.reward.icon} alt={phase.reward.name} loading="lazy" />
          )}
          {phase.category}
        </Title>
        <Meta>
          <TrackWrap>
            <ProgressTrack value={phase.percent} />
          </TrackWrap>
          <Badge $done={phase.done}>{phase.met} / {phase.total} Ready ({phase.percent}%)</Badge>
        </Meta>
      </Toggle>

      {expanded && (
        <Sections>
          {phase.note && <Note>{phase.note}</Note>}
          {phase.poolChoice && (
            <ChoiceNote $complete={phase.poolChoice.selectedCount === phase.poolChoice.count}>
              Showing your farm squad: {phase.poolChoice.selectedCount} of {phase.poolChoice.count}{' '}
              {phase.poolChoice.label} selected.
            </ChoiceNote>
          )}
          {phase.recommendation && (
            <RecommendedNote>
              <strong>★ marks the community-recommended squad</strong> ({phase.recommendation.count} units),
              transcribed from{' '}
              <SourceLink
                href={phase.recommendation.source}
                target="_blank"
                rel="noreferrer noopener"
              >
                {phase.recommendation.sourceLabel}
              </SourceLink>
              {phase.recommendation.caveat && ` — ${phase.recommendation.caveat}`}
            </RecommendedNote>
          )}
          {phase.sections.map((section) => (
            <div key={section.title}>
              <Subtitle>
                <span>{section.title}</span>
                {phase.isC3po && <InfoTip html={C3PO_TIP_HTML} />}
              </Subtitle>
              <Grid>
                {section.units.map((unit) => (
                  <UnitCard
                    key={`${phase.index}-${unit.id}`}
                    unit={unit}
                    guide={guide}
                    goalName={phase.reward?.name ?? phase.category}
                  />
                ))}
              </Grid>
            </div>
          ))}
        </Sections>
      )}
    </Block>
  );
}

const Block = styled.section`
  background: ${({ theme }) => theme.colors.card};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  box-shadow: ${({ theme }) => theme.shadows.card};
`;

const Toggle = styled.button`
  width: 100%;
  border-top-left-radius: inherit;
  border-top-right-radius: inherit;
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => `${theme.space[8]} ${theme.space[11]}`};
  background-color: ${({ theme }) => theme.colors.raised};
  border: none;
  border-bottom: 1px solid ${({ theme }) => theme.colors.border};
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: ${({ theme }) => theme.space[8]};
  text-align: left;
  color: inherit;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: ${({ theme }) => theme.colors.hover};
  }

  ${({ theme }) => theme.media.phone} {
    padding: ${({ theme }) => `${theme.space[7]} ${theme.space[8]}`};
    flex-wrap: wrap;
    align-items: flex-start;
  }
`;

const Title = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.xl};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.gold};
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[5]};
  min-width: 0;
  overflow-wrap: anywhere;
`;

const Chevron = styled.span`
  display: inline-block;
  font-size: ${({ theme }) => theme.fontSizes.sm};
  color: ${({ theme }) => theme.colors.muted};
  transition: transform 0.2s ease;
  flex-shrink: 0;

  ${Toggle}[aria-expanded='false'] & {
    transform: rotate(-90deg);
  }
`;

const Portrait = styled.img`
  width: ${({ theme }) => theme.sizes.phasePortrait};
  height: ${({ theme }) => theme.sizes.phasePortrait};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: 1px solid ${({ theme }) => theme.colors.gold};
  background-color: ${({ theme }) => theme.colors.bg};
  object-fit: cover;
  flex-shrink: 0;
`;

const Meta = styled.span`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[6]};
  flex-shrink: 0;

  ${({ theme }) => theme.media.phone} {
    width: 100%;
    justify-content: space-between;
  }
`;

const TrackWrap = styled.span`
  width: ${({ theme }) => theme.sizes.phaseTrack};
  display: block;

  ${({ theme }) => theme.media.phone} {
    display: none;
  }
`;

const Badge = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.md};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[5]}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  background-color: ${({ theme, $done }) => ($done ? theme.colors.successSoft : theme.colors.infoSoft)};
  color: ${({ theme, $done }) => ($done ? theme.colors.green : theme.colors.blue)};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  white-space: nowrap;
`;

const Sections = styled.div`
  padding: ${({ theme }) => `${theme.space[9]} ${theme.space[11]} ${theme.space[11]}`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[11]};

  ${({ theme }) => theme.media.phone} {
    padding: ${({ theme }) => theme.space[8]};
  }
`;

const Note = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  color: ${({ theme }) => theme.colors.muted};
  background: ${({ theme }) => theme.colors.infoSoft};
  border: 1px solid ${({ theme }) => theme.colors.sharedBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => `${theme.space[6]} ${theme.space[8]}`};
`;

const ChoiceNote = styled.p`
  color: ${({ theme, $complete }) => ($complete ? theme.colors.green : theme.colors.gold)};
  background: ${({ theme }) => theme.colors.sunken};
  border: 1px solid ${({ theme, $complete }) =>
    $complete ? theme.colors.successBorder : theme.colors.recommendedBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => `${theme.space[5]} ${theme.space[7]}`};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;

const RecommendedNote = styled.p`
  font-size: ${({ theme }) => theme.fontSizes.md};
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
  color: ${({ theme }) => theme.colors.muted};
  background: ${({ theme }) => theme.colors.recommendedBg};
  border: 1px solid ${({ theme }) => theme.colors.recommendedBorder};
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => `${theme.space[6]} ${theme.space[8]}`};

  strong {
    color: ${({ theme }) => theme.colors.recommendedText};
  }
`;

const SourceLink = styled.a`
  color: ${({ theme }) => theme.colors.blue};
  text-decoration: underline;

  &:hover {
    color: ${({ theme }) => theme.colors.text};
  }
`;

const Subtitle = styled.h3`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
  color: ${({ theme }) => theme.colors.blue};
  margin-bottom: ${({ theme }) => theme.space[7]};
  border-bottom: 1px dashed ${({ theme }) => theme.colors.border};
  padding-bottom: ${({ theme }) => theme.space[4]};
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[5]};
`;

const Grid = styled.div`
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(250px, 1fr));
  gap: ${({ theme }) => theme.space[7]};

  ${({ theme }) => theme.media.phone} {
    grid-template-columns: 1fr;
  }

  ${({ theme }) => theme.media.phoneLandscape} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;
