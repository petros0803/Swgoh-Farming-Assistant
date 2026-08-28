import { resolveTheme, THEME_IDS, TYPE_SCALE_IDS } from './resolveTheme';

describe('resolveTheme', () => {
  it('builds the default galactic dark theme with token groups', () => {
    const theme = resolveTheme();
    expect(theme.id).toBe(THEME_IDS.GALACTIC_DARK);
    expect(theme.colors.bg).toBeTruthy();
    expect(theme.fonts.body).toContain('Inter');
    expect(theme.space[8]).toBe('16px');
    expect(theme.fontSizes.heading).toBeTruthy();
  });

  it('can swap type scale independently of color theme', () => {
    const compact = resolveTheme(THEME_IDS.GALACTIC_DARK, TYPE_SCALE_IDS.DEFAULT);
    const large = resolveTheme(THEME_IDS.GALACTIC_DARK, TYPE_SCALE_IDS.LARGE);
    expect(large.fontSizes.base).not.toBe(compact.fontSizes.base);
    expect(large.colors.bg).toBe(compact.colors.bg);
  });

  it('provides distinct dark and light palettes', () => {
    const dark = resolveTheme(THEME_IDS.GALACTIC_DARK);
    const light = resolveTheme(THEME_IDS.GALACTIC_LIGHT);

    expect(dark.mode).toBe('dark');
    expect(light.mode).toBe('light');
    expect(light.colors.bg).not.toBe(dark.colors.bg);
    expect(light.fonts).toEqual(dark.fonts);
    expect(light.space).toEqual(dark.space);

    // The empty progress channel tints the card it sits on, so a light theme
    // that inherited the dark overlay would wash out instead of showing.
    expect(dark.colors.progressTrack).toBeTruthy();
    expect(light.colors.progressTrack).not.toBe(dark.colors.progressTrack);
  });
});
