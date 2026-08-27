import { evaluateUnit, relicLevel, percent } from './unitProgress';

describe('relicLevel', () => {
  it('converts SWGoH relic_tier to displayed relic', () => {
    expect(relicLevel({ relic_tier: 9 })).toBe(7);
    expect(relicLevel({ relic_tier: 2 })).toBe(0);
    expect(relicLevel(null)).toBe(0);
  });
});

describe('evaluateUnit', () => {
  it('marks a relic target complete when relic meets the requirement', () => {
    const result = evaluateUnit(
      { targetR: 7, targetStars: 7 },
      { rarity: 7, relic_tier: 9, gear_level: 13 }
    );
    expect(result.isComplete).toBe(true);
    expect(result.statusText).toBe('Ready');
    expect(result.statusClass).toBe('completed');
  });

  it('reports in-progress when the unit is owned but under relic', () => {
    const result = evaluateUnit(
      { targetR: 8, targetStars: 7 },
      { rarity: 7, relic_tier: 7, gear_level: 13 }
    );
    expect(result.isComplete).toBe(false);
    expect(result.statusText).toBe('Need R8');
    expect(result.statusClass).toBe('in-progress');
  });

  it('marks missing units as not started', () => {
    const result = evaluateUnit({ targetR: 5, targetStars: 7 }, null);
    expect(result.inRoster).toBe(false);
    expect(result.statusClass).toBe('not-started');
    expect(result.progressPct).toBe(0);
  });
});

describe('percent', () => {
  it('rounds progress and handles empty totals', () => {
    expect(percent(1, 2)).toBe(50);
    expect(percent(0, 0)).toBe(0);
  });
});
