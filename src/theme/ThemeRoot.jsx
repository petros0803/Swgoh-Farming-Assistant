import { useCallback, useEffect, useMemo, useState } from 'react';
import { ThemeProvider } from 'styled-components';
import GlobalStyle from './GlobalStyle';
import {
  defaultThemeId,
  isThemeId,
  resolveTheme,
  THEME_IDS,
  THEME_STORAGE_KEY
} from './resolveTheme';
import { defaultTypeScale } from './typeScales';
import { ThemeSettingsContext } from './useThemeSettings';

export default function ThemeRoot({
  children,
  initialThemeId,
  initialTypeScaleId = defaultTypeScale
}) {
  const [themeId, setThemeId] = useState(() => {
    if (initialThemeId && isThemeId(initialThemeId)) {
      return initialThemeId;
    }

    try {
      const storedTheme = window.localStorage.getItem(THEME_STORAGE_KEY);
      return isThemeId(storedTheme) ? storedTheme : defaultThemeId;
    } catch {
      return defaultThemeId;
    }
  });
  const [typeScaleId, setTypeScaleId] = useState(initialTypeScaleId);
  const theme = useMemo(
    () => resolveTheme(themeId, typeScaleId),
    [themeId, typeScaleId]
  );
  const toggleTheme = useCallback(() => {
    setThemeId((current) => (
      current === THEME_IDS.GALACTIC_DARK
        ? THEME_IDS.GALACTIC_LIGHT
        : THEME_IDS.GALACTIC_DARK
    ));
  }, []);
  const settings = useMemo(() => ({
    themeId,
    typeScaleId,
    setThemeId,
    setTypeScaleId,
    toggleTheme
  }), [themeId, typeScaleId, toggleTheme]);

  useEffect(() => {
    try {
      window.localStorage.setItem(THEME_STORAGE_KEY, themeId);
    } catch {
      // Storage can be unavailable in private or restricted browser contexts.
    }

    document.documentElement.dataset.theme = theme.mode;
    document.documentElement.style.colorScheme = theme.mode;
    document.querySelector('meta[name="theme-color"]')
      ?.setAttribute('content', theme.colors.themeColor);
  }, [theme, themeId]);

  return (
    <ThemeSettingsContext.Provider value={settings}>
      <ThemeProvider theme={theme}>
        <GlobalStyle />
        {children}
      </ThemeProvider>
    </ThemeSettingsContext.Provider>
  );
}
