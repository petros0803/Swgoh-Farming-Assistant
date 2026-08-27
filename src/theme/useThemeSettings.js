import { createContext, useContext } from 'react';
import { defaultThemeId } from './resolveTheme';
import { defaultTypeScale } from './typeScales';

export const ThemeSettingsContext = createContext({
  themeId: defaultThemeId,
  typeScaleId: defaultTypeScale,
  setThemeId: () => {},
  setTypeScaleId: () => {},
  toggleTheme: () => {}
});

export function useThemeSettings() {
  return useContext(ThemeSettingsContext);
}
