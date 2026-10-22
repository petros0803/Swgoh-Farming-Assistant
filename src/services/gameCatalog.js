const PAGE_SIZE = 1000;

const REQUIRED_SETTINGS = [
  'farming_source_meta',
  'gear_level_for_relics',
  'lightspeed_token_ceiling',
  'max_relic_level',
  'currency_icons'
];

export function publicAssetUrl(icon, assetBase = '/') {
  if (typeof icon !== 'string' || icon.length === 0) return icon;
  if (/^(?:[a-z][a-z0-9+.-]*:|\/\/)/i.test(icon)) return icon;

  const base = assetBase.endsWith('/') ? assetBase : `${assetBase}/`;
  if (icon.startsWith(base)) return icon;
  return `${base}${icon.replace(/^\/+/, '')}`;
}

function withIcon(record, assetBase) {
  if (!record || typeof record !== 'object' || typeof record.icon !== 'string') return record;
  return { ...record, icon: publicAssetUrl(record.icon, assetBase) };
}

function missing(what) {
  throw new Error(`Game catalog is missing ${what}.`);
}

export function assembleCatalog(tables, { assetBase = '/' } = {}) {
  const units = [...(tables.units ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const farms = [...(tables.farms ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const relicMaterials = [...(tables.relicMaterials ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const relicCosts = [...(tables.relicCosts ?? [])];
  const assaultBattles = [...(tables.assaultBattles ?? [])].sort((a, b) => a.sort_order - b.sort_order);
  const settings = Object.fromEntries((tables.settings ?? []).map((row) => [row.key, row.value]));

  if (!units.some((unit) => unit.kind === 'character')) missing('characters');
  if (!units.some((unit) => unit.kind === 'ship')) missing('ships');
  if (!farms.some((farm) => farm.collection === 'priority')) missing('the priority roadmap');
  if (!farms.some((farm) => farm.collection === 'catalog')) missing('journey farms');
  if (relicMaterials.length === 0) missing('relic materials');
  if (assaultBattles.length === 0) missing('assault battles');
  if ((tables.poolRequirements ?? []).length === 0) missing('faction pool rules');

  for (const key of REQUIRED_SETTINGS) {
    if (!(key in settings)) missing(`setting ${key}`);
  }

  const maxRelicLevel = Number(settings.max_relic_level);
  if (!Number.isInteger(maxRelicLevel) || maxRelicLevel < 1) missing('a valid max relic level');

  const relicCostByLevel = {};
  relicCosts.forEach((row) => {
    relicCostByLevel[row.level] = row.costs;
  });
  for (let level = 1; level <= maxRelicLevel; level += 1) {
    if (!relicCostByLevel[level]) missing(`relic cost for level ${level}`);
  }

  const farmsIn = (collection) => farms
    .filter((farm) => farm.collection === collection)
    .map((farm) => ({
      category: farm.category,
      event: farm.event,
      reward: withIcon(farm.reward, assetBase),
      characters: (farm.characters ?? []).map((unit) => withIcon(unit, assetBase)),
      ships: (farm.ships ?? []).map((unit) => withIcon(unit, assetBase))
    }));

  const ceiling = settings.lightspeed_token_ceiling ?? {};
  if (!Number.isInteger(ceiling.stars) || !Number.isInteger(ceiling.relic)) {
    missing('the lightspeed token ceiling');
  }

  return {
    source: 'supabase',
    units: units.map((unit) => ({
      id: unit.id,
      name: unit.name,
      kind: unit.kind,
      alignment: unit.alignment,
      icon: unit.icon,
      sources: unit.sources ?? []
    })),
    farmingSourceMeta: settings.farming_source_meta,
    priorityFarms: farmsIn('priority'),
    farms: farmsIn('catalog'),
    relicMaterials: relicMaterials.map((material) => ({
      id: material.id,
      name: material.name,
      icon: publicAssetUrl(material.icon, assetBase),
      group: material.material_group
    })),
    relicCostByLevel,
    maxRelicLevel,
    assaultBattles: assaultBattles.map((row) => row.payload),
    assaultBattleTeams: Object.fromEntries(
      (tables.assaultTeams ?? []).map((row) => [row.battle_id, row.teams])
    ),
    recommendedSquads: Object.fromEntries(
      (tables.recommendedSquads ?? []).map((row) => [row.event, {
        units: row.units,
        source: row.source,
        sourceLabel: row.source_label,
        ...(row.caveat ? { caveat: row.caveat } : {})
      }])
    ),
    alternateFarmingSources: Object.fromEntries(
      (tables.alternateSources ?? []).map((row) => [row.unit_id, row.sources])
    ),
    storeCurrencies: Object.fromEntries(
      (tables.storeCurrencies ?? []).map((row) => [row.store_name, row.currency])
    ),
    poolRequirements: Object.fromEntries(
      (tables.poolRequirements ?? []).map((row) => [row.event, {
        count: row.squad_count,
        label: row.label
      }])
    ),
    currencyIconPaths: settings.currency_icons,
    gearLevelForRelics: Number(settings.gear_level_for_relics),
    lightspeedTokenCeiling: { stars: ceiling.stars, relic: ceiling.relic }
  };
}

async function fetchAll(client, table, orderColumn) {
  const rows = [];

  for (let from = 0; ; from += PAGE_SIZE) {
    let query = client.from(table).select('*');
    if (orderColumn) query = query.order(orderColumn, { ascending: true });
    const { data, error } = await query.range(from, from + PAGE_SIZE - 1);
    if (error) throw error;
    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) break;
  }

  return rows;
}

export async function loadGameCatalog(client, { assetBase = import.meta.env.BASE_URL } = {}) {
  const [
    units,
    farms,
    relicMaterials,
    relicCosts,
    assaultBattles,
    assaultTeams,
    recommendedSquads,
    alternateSources,
    storeCurrencies,
    poolRequirements,
    settings
  ] = await Promise.all([
    fetchAll(client, 'units', 'sort_order'),
    fetchAll(client, 'farms', 'sort_order'),
    fetchAll(client, 'relic_materials', 'sort_order'),
    fetchAll(client, 'relic_level_costs', 'level'),
    fetchAll(client, 'assault_battles', 'sort_order'),
    fetchAll(client, 'assault_battle_teams'),
    fetchAll(client, 'recommended_squads'),
    fetchAll(client, 'alternate_farming_sources'),
    fetchAll(client, 'store_currencies'),
    fetchAll(client, 'pool_requirements'),
    fetchAll(client, 'catalog_settings')
  ]);

  return assembleCatalog({
    units,
    farms,
    relicMaterials,
    relicCosts,
    assaultBattles,
    assaultTeams,
    recommendedSquads,
    alternateSources,
    storeCurrencies,
    poolRequirements,
    settings
  }, { assetBase });
}

export function catalogLoadError(error) {
  const message = String(error?.message || error || '');
  if (/schema cache|does not exist|PGRST205|42P01/i.test(message)) {
    return 'Supabase does not have the game catalog yet. Run supabase/game_catalog.sql in the SQL editor, then npm run seed:catalog. The built-in catalog is showing for now.';
  }
  if (/Game catalog/.test(message)) {
    return `${message} The built-in catalog is showing for now.`;
  }
  return 'The game catalog could not be loaded from Supabase. The built-in catalog is showing for now.';
}
