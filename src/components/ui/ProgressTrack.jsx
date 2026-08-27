import styled from 'styled-components';

export default function ProgressTrack({ value = 0, size = 'sm' }) {
  return (
    <Track $size={size}>
      <Fill style={{ width: `${value}%` }} />
    </Track>
  );
}

const Track = styled.div`
  height: ${({ theme, $size }) => ($size === 'lg' ? theme.sizes.trackLg : theme.sizes.track)};
  margin-top: ${({ theme, $size }) => ($size === 'lg' ? theme.space[3] : 0)};
  background-color: ${({ theme }) => theme.colors.track};
  border-radius: ${({ theme }) => theme.radii.pill};
  overflow: hidden;
`;

const Fill = styled.div`
  height: 100%;
  border-radius: ${({ theme }) => theme.radii.pill};
  background: linear-gradient(90deg, ${({ theme }) => theme.colors.blue}, ${({ theme }) => theme.colors.green});
  transition: width 0.5s ease-in-out;
`;
