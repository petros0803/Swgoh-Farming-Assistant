import { useState } from 'react';
import styled, { css } from 'styled-components';
import { useFarmPreview } from '../hooks/useFarmPreview';
import { requirementLabel } from '../utils/farmLabels';
import { MAX_STARS } from '../utils/unitProgress';
import ProgressTrack from './ui/ProgressTrack';
import SharedTag from './SharedTag';
import { FarmPreview } from './UnitFarmCard';

const FALLBACK =
  "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%238b949e' stroke-width='2'><circle cx='12' cy='12' r='10'/><path d='M12 8v4M12 16h.01'/></svg>";

export default function UnitCard({ unit, guide, goalName }) {
  const { target, progress, badge, recommended, portrait } = unit;
  const [src, setSrc] = useState(portrait || FALLBACK);
  const { preview, show, hide } = useFarmPreview();
  // The grid shows one phase's requirement; the guide knows how to farm the unit
  // for every phase at once, so the preview leads with this phase's own gate.
  const farmUnit = guide?.unitById.get(unit.id) ?? null;
  const note = goalName ? `${goalName} needs ${requirementLabel(target)}` : null;

  return (
    <Card
      $status={progress.statusClass}
      $recommended={recommended}
      onMouseEnter={(event) => show(farmUnit, event.currentTarget, note)}
      onMouseLeave={hide}
    >
      <FarmPreview preview={preview} guide={guide} />
      <Header>
        <Portrait
          $alignment={target.alignment || 'none'}
          src={src}
          alt={target.name}
          loading="lazy"
          onError={() => setSrc(FALLBACK)}
        />
        <Info>
          <Name>{target.name}</Name>
          <Stars title={`${progress.currentStars} of ${target.targetStars} stars`}>
            {Array.from({ length: MAX_STARS }, (_, index) => (
              <Star key={index} $on={index < progress.currentStars} aria-hidden="true">★</Star>
            ))}
          </Stars>
        </Info>
      </Header>

      <Body>
        <Pills>
          {!progress.inRoster && <Pill>Not in roster</Pill>}
          {progress.inRoster && target.targetR && (
            <>
              <Pill>G{progress.currentGear}</Pill>
              <Pill $relic $met={progress.isComplete}>
                R{progress.currentRelic} / {target.targetR}
              </Pill>
            </>
          )}
          {progress.inRoster && !target.targetR && (
            <Pill>{progress.currentStars}★ / {target.targetStars}★</Pill>
          )}
        </Pills>
        <ProgressTrack value={progress.progressPct} />
      </Body>

      <Footer>
        {recommended && (
          <SharedTag badge={{ text: '★ Recommended', className: 'tag-recommended', farms: [] }} />
        )}
        {badge && <SharedTag badge={badge} />}
        <Status $status={progress.statusClass}>{progress.statusText}</Status>
      </Footer>
    </Card>
  );
}

const statusColors = {
  completed: (theme) => theme.colors.green,
  'in-progress': (theme) => theme.colors.gold,
  'not-started': (theme) => theme.colors.red
};

const Card = styled.article`
  background: ${({ theme }) => theme.colors.sunken};
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-left-width: 3px;
  border-left-color: ${({ theme, $status }) => (statusColors[$status] ?? statusColors['not-started'])(theme)};
  ${({ theme, $recommended }) => $recommended && css`
    border-top-color: ${theme.colors.recommendedBorder};
    border-right-color: ${theme.colors.recommendedBorder};
    border-bottom-color: ${theme.colors.recommendedBorder};
  `}
  border-radius: ${({ theme }) => theme.radii.md};
  padding: ${({ theme }) => theme.space[7]};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[6]};
  position: relative;
  min-width: 0;
  transition: transform 0.2s, border-color 0.2s, box-shadow 0.2s;

  /* Lift the card so an open shared-unit tooltip is not covered by its neighbours. */
  &:hover,
  &:focus-within {
    z-index: 1;
  }

  &:hover {
    transform: translateY(-2px);
    border-color: ${({ theme }) => theme.colors.borderStrong};
    box-shadow: ${({ theme }) => theme.shadows.lift};
  }

  ${({ theme }) => theme.media.phone} {
    &:hover {
      transform: none;
    }
  }
`;

const Header = styled.div`
  display: flex;
  align-items: flex-start;
  gap: ${({ theme }) => theme.space[6]};
`;

const alignmentColors = {
  light: (theme) => theme.colors.blue,
  dark: (theme) => theme.colors.red,
  neutral: (theme) => theme.colors.text,
  none: (theme) => theme.colors.border
};

const Portrait = styled.img`
  width: ${({ theme }) => theme.sizes.portrait};
  height: ${({ theme }) => theme.sizes.portrait};
  border-radius: ${({ theme }) => theme.radii.sm};
  border: ${({ theme }) => theme.borders.medium} solid
    ${({ theme, $alignment }) => (alignmentColors[$alignment] ?? alignmentColors.none)(theme)};
  background-color: ${({ theme }) => theme.colors.bg};
  object-fit: cover;
  flex-shrink: 0;
`;

const Info = styled.div`
  display: flex;
  flex-direction: column;
  gap: 5px;
  min-width: 0;
  flex-grow: 1;
`;

const Name = styled.div`
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  font-size: ${({ theme }) => theme.fontSizes.lg};
  color: ${({ theme }) => theme.colors.text};
  line-height: ${({ theme }) => theme.lineHeights.snug};
  min-height: 2.4em;
  display: flex;
  align-items: center;
  overflow-wrap: anywhere;
`;

const Stars = styled.div`
  display: flex;
  gap: ${({ theme }) => theme.space[1]};
  font-size: ${({ theme }) => theme.fontSizes.base};
  line-height: ${({ theme }) => theme.lineHeights.tight};
`;

const Star = styled.span`
  color: ${({ theme, $on }) => ($on ? theme.colors.gold : theme.colors.starOff)};
`;

const Body = styled.div`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[4]};
  margin-top: auto;
`;

const Pills = styled.div`
  display: flex;
  align-items: center;
  gap: ${({ theme }) => theme.space[3]};
  flex-wrap: wrap;
`;

const Pill = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.tight};
  padding: ${({ theme }) => `${theme.space[2]} ${theme.space[4]}`};
  border-radius: ${({ theme }) => theme.radii.pill};
  background: ${({ theme, $relic, $met }) => {
    if ($met) return theme.colors.successBg;
    if ($relic) return theme.colors.relicBg;
    return theme.colors.track;
  }};
  color: ${({ theme, $relic, $met }) => {
    if ($met) return theme.colors.green;
    if ($relic) return theme.colors.purple;
    return theme.colors.muted;
  }};
  border: 1px solid ${({ theme, $relic, $met }) => {
    if ($met) return theme.colors.successBorder;
    if ($relic) return theme.colors.relicBorder;
    return theme.colors.border;
  }};
  white-space: nowrap;
`;

const Footer = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: ${({ theme }) => theme.space[4]};
  flex-wrap: wrap;
`;

const Status = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  font-weight: ${({ theme }) => theme.fontWeights.bold};
  padding: ${({ theme }) => `${theme.space[2]} 9px`};
  border-radius: ${({ theme }) => theme.radii.sm};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.letterSpacing.label};
  margin-left: auto;
  white-space: nowrap;
  background: ${({ theme, $status }) => {
    if ($status === 'completed') return theme.colors.successBg;
    if ($status === 'in-progress') return theme.colors.warningSoft;
    return theme.colors.dangerSoft;
  }};
  color: ${({ theme, $status }) => {
    if ($status === 'completed') return theme.colors.green;
    if ($status === 'in-progress') return theme.colors.gold;
    return theme.colors.red;
  }};
`;
