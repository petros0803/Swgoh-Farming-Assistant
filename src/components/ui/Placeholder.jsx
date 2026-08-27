import styled from 'styled-components';

export default function Placeholder({ title, children, slim = false }) {
  return (
    <Notice $slim={slim}>
      {title && <Title>{title}</Title>}
      {children && <Body>{children}</Body>}
    </Notice>
  );
}

const Notice = styled.div`
  text-align: center;
  padding: ${({ theme, $slim }) => ($slim ? `${theme.space[15]} ${theme.space[10]}` : `${theme.space[17]} ${theme.space[10]}`)};
  background: ${({ theme }) => theme.colors.card};
  border: 1px dashed ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.lg};
`;

const Title = styled.h2`
  font-family: ${({ theme }) => theme.fonts.heading};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  color: ${({ theme }) => theme.colors.gold};
  margin-bottom: ${({ theme }) => theme.space[6]};
  font-size: ${({ theme }) => theme.fontSizes['3xl']};
  line-height: ${({ theme }) => theme.lineHeights.heading};
`;

const Body = styled.p`
  color: ${({ theme }) => theme.colors.muted};
  max-width: 600px;
  margin: 0 auto;
  line-height: ${({ theme }) => theme.lineHeights.relaxed};
`;
