import { createGlobalStyle } from 'styled-components';

const GlobalStyle = createGlobalStyle`
  html {
    color-scheme: ${({ theme }) => theme.mode};
  }

  body {
    background-color: ${({ theme }) => theme.colors.bg};
    background-image:
      radial-gradient(900px 500px at 12% -10%, ${({ theme }) => theme.colors.glowBlue}, transparent 60%),
      radial-gradient(800px 500px at 88% -5%, ${({ theme }) => theme.colors.glowGold}, transparent 60%);
    background-repeat: no-repeat;
    color: ${({ theme }) => theme.colors.text};
    font-family: ${({ theme }) => theme.fonts.body};
    font-size: ${({ theme }) => theme.fontSizes.base};
    transition: background-color 0.2s ease, color 0.2s ease;
  }

  :focus-visible {
    outline: 2px solid ${({ theme }) => theme.colors.blue};
    outline-offset: 2px;
  }
`;

export default GlobalStyle;
