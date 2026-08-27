import styled, { css } from 'styled-components';
import { formatNumber } from '../utils/format';
import ProgressTrack from './ui/ProgressTrack';

export default function StatsOverview({ dashboard }) {
  if (!dashboard) return null;

  return (
    <Grid>
      <Card>
        <Label>Player Name</Label>
        <Value>{dashboard.playerName}</Value>
      </Card>
      <Card>
        <Label>Galactic Power</Label>
        <Value>{formatNumber(dashboard.galacticPower)}</Value>
      </Card>
      <Card>
        <Label>Units Ready</Label>
        <Value>{dashboard.totalMetRequirements} / {dashboard.totalRequirements}</Value>
      </Card>
      <Card $wide>
        <Label>Overall Farm Progress</Label>
        <Value>{dashboard.overallPct}%</Value>
        <ProgressTrack value={dashboard.overallPct} size="lg" />
      </Card>
    </Grid>
  );
}

const Grid = styled.section`
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: ${({ theme }) => theme.space[8]};
  margin-bottom: ${({ theme }) => theme.space[10]};

  ${({ theme }) => theme.media.tablet} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  ${({ theme }) => theme.media.phone} {
    grid-template-columns: 1fr;
  }

  ${({ theme }) => theme.media.phoneLandscape} {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
`;

const Card = styled.div`
  background: linear-gradient(180deg, ${({ theme }) => theme.colors.card}, ${({ theme }) => theme.colors.gradientEnd});
  border: 1px solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
  padding: ${({ theme }) => `${theme.space[8]} ${theme.space[9]}`};
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[3]};
  box-shadow: ${({ theme }) => theme.shadows.card};
  min-width: 0;

  ${({ $wide }) => $wide && css`
    ${({ theme }) => theme.media.tablet} {
      grid-column: 1 / -1;
    }
  `}
`;

const Label = styled.span`
  font-size: ${({ theme }) => theme.fontSizes.sm};
  text-transform: uppercase;
  letter-spacing: ${({ theme }) => theme.letterSpacing.wide};
  color: ${({ theme }) => theme.colors.muted};
`;

const Value = styled.span`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes['4xl']};
  font-weight: ${({ theme }) => theme.fontWeights.medium};
  color: ${({ theme }) => theme.colors.blue};
  overflow-wrap: anywhere;
`;
