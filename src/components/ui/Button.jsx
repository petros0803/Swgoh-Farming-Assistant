import styled, { css, keyframes } from 'styled-components';

export default function Button({ variant = 'primary', loading = false, children, ...props }) {
  return (
    <StyledButton
      {...props}
      $variant={variant}
      $loading={loading}
      disabled={Boolean(props.disabled) || loading}
    >
      {variant === 'primary' && <Spinner aria-hidden="true" />}
      {children}
    </StyledButton>
  );
}

const spin = keyframes`
  to { transform: rotate(360deg); }
`;

const primaryStyles = css`
  background-color: ${({ theme }) => theme.colors.primary};
  color: ${({ theme }) => theme.colors.onPrimary};

  &:hover:not(:disabled) {
    background-color: ${({ theme }) => theme.colors.primaryHover};
  }
`;

const ghostStyles = css`
  background-color: ${({ theme }) => theme.colors.raised};
  border: 1px solid ${({ theme }) => theme.colors.border};
  color: ${({ theme }) => theme.colors.text};
  font-family: ${({ theme }) => theme.fonts.body};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  font-size: ${({ theme }) => theme.fontSizes.base};

  &:hover:not(:disabled) {
    border-color: ${({ theme }) => theme.colors.borderStrong};
    background-color: ${({ theme }) => theme.colors.hover};
  }
`;

const Spinner = styled.span`
  display: none;
  width: ${({ theme }) => theme.sizes.spinner};
  height: ${({ theme }) => theme.sizes.spinner};
  border: ${({ theme }) => theme.borders.medium} solid ${({ theme }) => theme.colors.onPrimary};
  border-top-color: transparent;
  border-radius: ${({ theme }) => theme.radii.round};
  animation: ${spin} 0.8s linear infinite;
`;

const StyledButton = styled.button`
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: ${({ theme }) => theme.space[4]};
  min-height: ${({ theme }) => theme.sizes.tap};
  padding: ${({ theme }) => `${theme.space[5]} ${theme.space[11]}`};
  border: none;
  border-radius: ${({ theme }) => theme.radii.md};
  font-family: ${({ theme }) => theme.fonts.heading};
  font-size: ${({ theme }) => theme.fontSizes.base};
  font-weight: ${({ theme }) => theme.fontWeights.semibold};
  letter-spacing: ${({ theme }) => theme.letterSpacing.label};
  color: inherit;
  cursor: pointer;
  white-space: nowrap;
  transition: background-color 0.2s, border-color 0.2s, transform 0.1s;

  ${({ $variant }) => ($variant === 'ghost' ? ghostStyles : primaryStyles)}

  &:active {
    transform: scale(0.98);
  }

  &:disabled {
    opacity: 0.7;
    cursor: wait;
  }

  ${({ $loading }) => $loading && css`
    ${Spinner} {
      display: inline-block;
    }
  `}
`;
