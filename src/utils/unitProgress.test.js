import { lightspeedTokenCovers, minimumStarsForRelic } from '../data/gameRules';
import { evaluateUnit, relicLevel, percent } from './unitProgress';

describe('minimumStarsForRelic', () => {
  it('matches the current in-game relic rarity gates', () => {
    expect(minimumStarsForRelic(0)).toBe(0);
    expect(minimumStarsForRelic(1)).toBe(4);
    expect(minimumStarsForRelic(2)).toBe(4);
    expect(minimumStarsForRelic(3)).toBe(5);
    expect(minimumStarsForRelic(4)).toBe(5);
    expect(minimumStarsForRelic(5)).toBe(6);
    expect(minimumStarsForRelic(6)).toBe(7);
    expect(minimumStarsForRelic(10)).toBe(7);
  });
});

describe('lightspeedTokenCovers', () => {
  it('covers characters up to 6 stars and Relic 5 only', () => {
    expect(lightspeedTokenCovers('character', { targetStars: 6, targetR: 5 })).toBe(true);
    expect(lightspeedTokenCovers('character', { targetStars: 5, targetR: 3 })).toBe(true);
    expect(lightspeedTokenCovers('character', { targetStars: 7, targetR: 5 })).toBe(false);
    expect(lightspeedTokenCovers('character', { targetStars: 6, targetR: 6 })).toBe(false);
    expect(lightspeedTokenCovers('character', {})).toBe(false);
  });

  it('never covers a ship', () => {
    expect(lightspeedTokenCovers('ship', { targetStars: 5 })).toBe(false);
  });
});

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

  it('holds a star-only requirement open until the stars are there', () => {
    const result = evaluateUnit(
      { targetStars: 7 },
      { rarity: 6, relic_tier: 0, gear_level: 8 }
    );
    expect(result.isComplete).toBe(false);
    expect(result.statusText).toBe('Need 7★');
  });

  it('does not let a met relic target mask a missing star requirement', () => {
    const result = evaluateUnit(
      { targetR: 3, targetStars: 7 },
      { rarity: 5, relic_tier: 8, gear_level: 13 }
    );
    expect(result.isComplete).toBe(false);
    expect(result.statusText).toBe('Need 7★');
  });

  it('infers only the game rarity gate when a relic-only event omits stars', () => {
    expect(
      evaluateUnit(
        { targetR: 3 },
        { rarity: 5, relic_tier: 5, gear_level: 13 }
      ).isComplete
    ).toBe(true);
    expect(
      evaluateUnit(
        { targetR: 5 },
        { rarity: 5, relic_tier: 7, gear_level: 13 }
      ).statusText
    ).toBe('Need 6★');
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
