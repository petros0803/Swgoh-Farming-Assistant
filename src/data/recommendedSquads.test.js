import { recommendedSquads, getRecommendedSquad } from './recommendedSquads';

describe('getRecommendedSquad', () => {
  it('resolves a squad for a farm with a published recommendation', () => {
    const squad = getRecommendedSquad({ event: 'Contact Protocol' });

    expect(squad.ids.has('PAPLOO')).toBe(true);
    expect(squad.ids.has('CHIEFCHIRPA')).toBe(true);
    expect(squad.ids.size).toBe(5);
    expect(squad.source).toMatch(/swgoh\.wiki/);
  });

  it('returns null for farms nobody has published a squad for', () => {
    expect(getRecommendedSquad({ event: 'Daring Droid' })).toBeNull();
  });

  it('returns null for farms with no event key', () => {
    expect(getRecommendedSquad({ category: 'Some farm' })).toBeNull();
    expect(getRecommendedSquad(null)).toBeNull();
  });

  it('does not mark units the guide leaves out', () => {
    const squad = getRecommendedSquad({ event: 'Contact Protocol' });

    expect(squad.ids.has('TEEBO')).toBe(false);
    expect(squad.ids.has('EWOKSCOUT')).toBe(false);
  });

  it('keeps a source for every curated entry so the UI can attribute it', () => {
    Object.values(recommendedSquads).forEach((entry) => {
      expect(entry.source).toMatch(/^https:\/\/swgoh\.wiki\//);
      expect(entry.sourceLabel).toBeTruthy();
      expect(entry.units.length).toBeGreaterThan(0);
    });
  });
});
