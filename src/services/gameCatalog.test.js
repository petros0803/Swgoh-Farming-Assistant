import { assembleCatalog, catalogLoadError, loadGameCatalog, publicAssetUrl } from './gameCatalog';

const assetBase = '/Swgoh-Farming-Assistant/';

function tables() {
  return {
    units: [
      {
        id: 'SHIP',
        name: 'Ghost',
        kind: 'ship',
        alignment: 'light',
        icon: 'assets/ships/GHOST.webp',
        sources: [],
        sort_order: 1
      },
      {
        id: 'AAYLASECURA',
        name: 'Aayla Secura',
        kind: 'character',
        alignment: 'light',
        icon: 'assets/characters/Aayla Secura.png',
        sources: [{ type: 'hard-node', label: 'Light Side 1-A' }],
        sort_order: 0
      }
    ],
    farms: [
      {
        collection: 'catalog',
        sort_order: 0,
        event: 'Contact Protocol',
        category: 'Journey',
        reward: { name: 'C-3PO', icon: 'assets/characters/C-3PO.png' },
        characters: [{ id: 'AAYLASECURA', name: 'Aayla Secura', icon: 'assets/characters/Aayla Secura.png' }],
        ships: []
      },
      {
        collection: 'priority',
        sort_order: 0,
        event: 'Discarded Doctrine',
        category: 'Phase 1',
        reward: { name: 'Executor', icon: 'assets/ships/CAPITALEXECUTOR.webp' },
        characters: [],
        ships: []
      }
    ],
    relicMaterials: [
      {
        id: 'credits',
        name: 'Credits',
        icon: 'assets/relic-materials/credits.png',
        material_group: 'currency',
        sort_order: 0
      }
    ],
    relicCosts: [{ level: 1, costs: { credits: 10000 } }],
    assaultBattles: [{ sort_order: 0, payload: { id: 'FOREST', name: 'Forest Moon', tiers: [] } }],
    assaultTeams: [{ battle_id: 'FOREST', teams: [{ name: 'Troopers' }] }],
    recommendedSquads: [{
      event: 'Contact Protocol',
      units: ['PAPLOO'],
      source: 'https://swgoh.wiki/wiki/Contact_Protocol',
      source_label: 'Guide',
      caveat: null
    }],
    alternateSources: [{ unit_id: 'AAYLASECURA', sources: [{ type: 'store', label: 'Guild Activity Store' }] }],
    storeCurrencies: [{ store_name: 'Guild Activity Store', currency: 'Guild Tokens' }],
    poolRequirements: [{ event: 'Contact Protocol', squad_count: 5, label: 'Ewoks' }],
    settings: [
      { key: 'farming_source_meta', value: { shardDropChance: 0.33 } },
      { key: 'gear_level_for_relics', value: 13 },
      { key: 'lightspeed_token_ceiling', value: { stars: 6, relic: 5 } },
      { key: 'max_relic_level', value: 1 },
      { key: 'currency_icons', value: { 'Guild Token': 'assets/currencies/guild-token.png' } }
    ]
  };
}

function clientFor(rows) {
  return {
    from(table) {
      const api = {
        select() { return api; },
        order() { return api; },
        async range(from, to) {
          return { data: (rows[table] ?? []).slice(from, to + 1), error: null };
        }
      };
      return api;
    }
  };
}

describe('publicAssetUrl', () => {
  it('prefixes site-relative icons once', () => {
    expect(publicAssetUrl('assets/characters/Aayla Secura.png', assetBase))
      .toBe('/Swgoh-Farming-Assistant/assets/characters/Aayla Secura.png');
    expect(publicAssetUrl(`${assetBase}assets/characters/Aayla Secura.png`, assetBase))
      .toBe('/Swgoh-Farming-Assistant/assets/characters/Aayla Secura.png');
    expect(publicAssetUrl('https://example.test/icon.png', assetBase))
      .toBe('https://example.test/icon.png');
  });
});

describe('assembleCatalog', () => {
  it('rebuilds the shapes the tracker already calculates with', () => {
    const catalog = assembleCatalog(tables(), { assetBase });

    expect(catalog.units.map((unit) => unit.id)).toEqual(['AAYLASECURA', 'SHIP']);
    expect(catalog.priorityFarms[0].reward.icon)
      .toBe('/Swgoh-Farming-Assistant/assets/ships/CAPITALEXECUTOR.webp');
    expect(catalog.farms[0].characters[0].icon)
      .toBe('/Swgoh-Farming-Assistant/assets/characters/Aayla Secura.png');
    expect(catalog.relicMaterials[0]).toMatchObject({ id: 'credits', group: 'currency' });
    expect(catalog.relicCostByLevel[1]).toEqual({ credits: 10000 });
    expect(catalog.assaultBattleTeams.FOREST).toEqual([{ name: 'Troopers' }]);
    expect(catalog.recommendedSquads['Contact Protocol'].sourceLabel).toBe('Guide');
    expect(catalog.poolRequirements['Contact Protocol']).toEqual({ count: 5, label: 'Ewoks' });
    expect(catalog.storeCurrencies['Guild Activity Store']).toBe('Guild Tokens');
  });

  it('rejects a database that does not have the character list yet', () => {
    const incomplete = tables();
    incomplete.units = incomplete.units.filter((unit) => unit.kind === 'ship');
    expect(() => assembleCatalog(incomplete)).toThrow(/missing characters/);
  });
});

describe('loadGameCatalog', () => {
  it('reads every catalog table through the Supabase client', async () => {
    const source = tables();
    const catalog = await loadGameCatalog(clientFor({
      units: source.units,
      farms: source.farms,
      relic_materials: source.relicMaterials,
      relic_level_costs: source.relicCosts,
      assault_battles: source.assaultBattles,
      assault_battle_teams: source.assaultTeams,
      recommended_squads: source.recommendedSquads,
      alternate_farming_sources: source.alternateSources,
      store_currencies: source.storeCurrencies,
      pool_requirements: source.poolRequirements,
      catalog_settings: source.settings
    }), { assetBase });

    expect(catalog.source).toBe('supabase');
    expect(catalog.units).toHaveLength(2);
    expect(catalog.maxRelicLevel).toBe(1);
  });
});

describe('catalogLoadError', () => {
  it('explains a project that has not created the tables', () => {
    expect(catalogLoadError({ message: "Could not find the table 'public.units' in the schema cache" }))
      .toMatch(/game_catalog.sql/);
    expect(catalogLoadError(new Error('Game catalog is missing characters.')))
      .toMatch(/built-in catalog/);
  });
});
