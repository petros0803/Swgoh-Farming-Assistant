import { afterEach, describe, expect, it } from 'vitest';
import { characterCatalog } from '../utils/unitCatalog';
import { getCatalog, installCatalog, resetCatalog } from './catalogState';
import { gearLevelForRelics, lightspeedTokenCovers } from './gameRules';

describe('catalog state', () => {
  afterEach(() => {
    resetCatalog();
  });

  it('lets the running app swap in a database catalog and restore the built-in one', () => {
    const current = getCatalog();
    installCatalog({
      ...current,
      units: [
        ...current.units,
        {
          id: 'TESTUNIT',
          name: 'Test Unit',
          kind: 'character',
          alignment: 'light',
          icon: 'assets/characters/Test Unit.png',
          sources: []
        }
      ],
      gearLevelForRelics: 12,
      lightspeedTokenCeiling: { stars: 7, relic: 0 }
    });

    expect(characterCatalog.some((unit) => unit.id === 'TESTUNIT')).toBe(true);
    expect(gearLevelForRelics()).toBe(12);
    expect(lightspeedTokenCovers('character', { targetStars: 7, targetR: 0 })).toBe(true);

    resetCatalog();

    expect(characterCatalog.some((unit) => unit.id === 'TESTUNIT')).toBe(false);
    expect(gearLevelForRelics()).toBe(13);
    expect(lightspeedTokenCovers('character', { targetStars: 7, targetR: 0 })).toBe(false);
  });
});
