import { useCallback, useState } from 'react';
import styled, { css, keyframes } from 'styled-components';
import { THEME_IDS, useThemeSettings } from '../theme';

export default function ThemeSwitch() {
  const { themeId, toggleTheme } = useThemeSettings();
  const [spinning, setSpinning] = useState(false);
  const isDark = themeId === THEME_IDS.GALACTIC_DARK;
  const handleClick = useCallback(() => {
    setSpinning(true);
    toggleTheme();
  }, [toggleTheme]);

  return (
    <Toggle
      type="button"
      aria-label="Light theme"
      aria-pressed={!isDark}
      title={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      $dark={isDark}
      onClick={handleClick}
    >
      <Saber
        aria-hidden="true"
        $dark={isDark}
        $spinning={spinning}
        onAnimationEnd={() => setSpinning(false)}
      >
        <Hilt />
        <Blade />
      </Saber>
    </Toggle>
  );
}

const spinToLight = keyframes`
  from {
    transform: rotate(var(--saber-rest));
  }

  to {
    transform: rotate(calc(var(--saber-rest) + 1turn));
  }
`;

const spinToDark = keyframes`
  from {
    transform: rotate(var(--saber-rest));
  }

  to {
    transform: rotate(calc(var(--saber-rest) - 1turn));
  }
`;

const Toggle = styled.button`
  --saber-rest: ${({ theme }) => theme.angles.saberRest};
  --saber-color: ${({ theme, $dark }) => ($dark ? theme.colors.saberRed : theme.colors.saberBlue)};
  --saber-glow: ${({ theme, $dark }) => ($dark ? theme.colors.saberRedGlow : theme.colors.saberBlueGlow)};
  width: ${({ theme }) => theme.sizes.tap};
  height: ${({ theme }) => theme.sizes.tap};
  flex-shrink: 0;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: ${({ theme }) => theme.colors.card};
  border: ${({ theme }) => theme.borders.thin} solid ${({ theme }) => theme.colors.border};
  border-radius: ${({ theme }) => theme.radii.pill};
  box-shadow: ${({ theme }) => theme.shadows.card};
  cursor: pointer;
  transition:
    background-color 0.2s,
    border-color ${({ theme }) => theme.motion.saberColor} linear ${({ theme }) => theme.motion.saberColorDelay},
    transform 0.15s;

  &:hover {
    background: ${({ theme }) => theme.colors.raised};
    border-color: var(--saber-color);
    transform: translateY(-1px);
  }
`;

const Saber = styled.span`
  display: inline-flex;
  align-items: center;
  width: ${({ theme }) => theme.sizes.saber};
  transform: rotate(var(--saber-rest));

  ${({ theme, $dark, $spinning }) => $spinning && css`
    animation: ${$dark ? spinToDark : spinToLight}
      ${theme.motion.saberSpin} ${theme.motion.saberSpinEase};
  `}
`;

const Hilt = styled.span`
  width: ${({ theme }) => theme.sizes.saberHiltWidth};
  height: ${({ theme }) => theme.sizes.saberHiltHeight};
  flex-shrink: 0;
  border-radius: ${({ theme }) => theme.radii.xs} 0 0 ${({ theme }) => theme.radii.xs};
  background: ${({ theme }) => theme.colors.saberHilt};
  border-right: ${({ theme }) => theme.borders.thin} solid ${({ theme }) => theme.colors.saberHiltEdge};
`;

const Blade = styled.span`
  width: ${({ theme }) => theme.sizes.saberBladeWidth};
  height: ${({ theme }) => theme.sizes.saberBladeHeight};
  border-radius: 0 ${({ theme }) => theme.radii.pill} ${({ theme }) => theme.radii.pill} 0;
  background: ${({ theme }) => theme.colors.saberCore};
  border: ${({ theme }) => theme.borders.thin} solid var(--saber-color);
  box-shadow:
    0 0 3px var(--saber-color),
    0 0 7px var(--saber-glow),
    0 0 11px var(--saber-glow);
  transition:
    border-color ${({ theme }) => theme.motion.saberColor} linear ${({ theme }) => theme.motion.saberColorDelay},
    box-shadow ${({ theme }) => theme.motion.saberColor} linear ${({ theme }) => theme.motion.saberColorDelay};
`;
