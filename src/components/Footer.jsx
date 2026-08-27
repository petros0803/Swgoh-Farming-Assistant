import styled from 'styled-components';

export default function Footer() {
  return (
    <Bar>
      <p>Powered by SWGoH.gg API • Hosted on GitHub Pages</p>
    </Bar>
  );
}

const Bar = styled.footer`
  text-align: center;
  padding: ${({ theme }) => theme.space[10]} ${({ theme }) => theme.space[10]} calc(${({ theme }) => theme.space[10]} + env(safe-area-inset-bottom));
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.base};
  border-top: 1px solid ${({ theme }) => theme.colors.border};
  margin-top: ${({ theme }) => theme.space[16]};
`;
