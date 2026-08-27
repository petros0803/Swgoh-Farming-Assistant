import styled from 'styled-components';
import PhaseBlock from './PhaseBlock';
import Placeholder from './ui/Placeholder';

export default function Roadmap({ phases, collapsed, onTogglePhase }) {
  if (!phases.length) {
    return (
      <Placeholder slim>
        No units match your current filters.
      </Placeholder>
    );
  }

  return (
    <Grid>
      {phases.map((phase) => (
        <PhaseBlock
          key={phase.index}
          phase={phase}
          expanded={!collapsed[phase.index]}
          onToggle={() => onTogglePhase(phase.index)}
        />
      ))}
    </Grid>
  );
}

const Grid = styled.section`
  display: flex;
  flex-direction: column;
  gap: ${({ theme }) => theme.space[11]};
`;
