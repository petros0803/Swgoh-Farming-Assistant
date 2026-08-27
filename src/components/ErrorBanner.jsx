import styled from 'styled-components';

export default function ErrorBanner({ message }) {
  if (!message) return null;
  return <Banner role="alert">{message}</Banner>;
}

const Banner = styled.div`
  background: ${({ theme }) => theme.colors.dangerSoft};
  border: 1px solid ${({ theme }) => theme.colors.red};
  color: ${({ theme }) => theme.colors.red};
  padding: ${({ theme }) => theme.space[7]};
  border-radius: ${({ theme }) => theme.radii.md};
  margin-bottom: ${({ theme }) => theme.space[10]};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
`;
