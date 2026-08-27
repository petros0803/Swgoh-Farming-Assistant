import { createGalacticDark } from './galacticDark';
import { createGalacticLight } from './galacticLight';
import { defaultTypeScale, typeScales } from './typeScales';

export const THEME_IDS = {
  GALACTIC_DARK: 'galactic-dark',
  GALACTIC_LIGHT: 'galactic-light'
};

export const TYPE_SCALE_IDS = {
  DEFAULT: 'default',
  LARGE: 'large'
};

export const themes = {
  [THEME_IDS.GALACTIC_DARK]: createGalacticDark,
  [THEME_IDS.GALACTIC_LIGHT]: createGalacticLight
};

export const defaultThemeId = THEME_IDS.GALACTIC_DARK;
export const THEME_STORAGE_KEY = 'swgoh-theme';

export function isThemeId(value) {
  return Object.hasOwn(themes, value);
}

export function resolveTheme(themeId = defaultThemeId, typeScaleId = defaultTypeScale) {
  const createTheme = themes[themeId] || themes[defaultThemeId];
  const fontSizes = typeScales[typeScaleId] || typeScales[defaultTypeScale];
  return createTheme(fontSizes);
}
