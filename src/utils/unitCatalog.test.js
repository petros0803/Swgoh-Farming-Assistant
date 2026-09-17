import { farmingSources, unitCatalog } from '../data/farmingSources';
import {
  acquisitionSources,
  acquisitionSummary,
  characterCatalog,
  shipCatalog,
  unitCatalogById
} from './unitCatalog';

describe('canonical unit catalog', () => {
  it('contains every obtainable character once and backs the legacy source index', () => {
    expect(characterCatalog.length).toBeGreaterThan(300);
    expect(shipCatalog.length).toBeGreaterThan(60);
    expect(shipCatalog.every((ship) => ship.sources.length > 0)).toBe(true);
    expect(new Set(characterCatalog.map((character) => character.id)).size)
      .toBe(characterCatalog.length);
    expect(unitCatalogById.size).toBe(unitCatalog.length);
    expect(farmingSources.ADMIRALPIETT).toBe(acquisitionSources('ADMIRALPIETT'));
  });

  it('provides one shared acquisition summary for every UI', () => {
    expect(acquisitionSummary('ADMIRALPIETT')).toContain('Light Side 6-B');
    expect(acquisitionSummary('missing-unit')).toBe('Source not currently tracked');
  });

  it('keeps stable nodes and stores complete and correctly classified', () => {
    const nihilus = unitCatalogById.get('DARTHNIHILUS');
    expect(nihilus.sources).toContainEqual(expect.objectContaining({
      type: 'hard-node',
      label: 'Dark Side 9-A',
      energy: 20,
      shardsPerDrop: 2
    }));
    expect(nihilus.sources).not.toContainEqual(expect.objectContaining({
      label: 'Galactic War Store'
    }));

    const sources = unitCatalog.flatMap((unit) => unit.sources);
    expect(sources.filter((source) => source.type.endsWith('-node'))
      .every((source) => source.energy > 0)).toBe(true);
    expect(sources.filter((source) => source.type === 'store')
      .every((source) => source.offers?.length > 0 || source.quantity > 0)).toBe(true);
    expect(sources.some((source) =>
      source.type === 'event' &&
      /^(Light|Dark) Side Battles:|^(Cantina|Fleet) Battles:/i.test(source.label)
    )).toBe(false);
  });
});
