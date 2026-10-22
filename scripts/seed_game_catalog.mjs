import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import { createServer } from 'vite';
import ws from 'ws';

if (typeof globalThis.WebSocket !== 'function') globalThis.WebSocket = ws;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const dryRun = process.argv.includes('--dry-run');
const sqlDirFlag = process.argv.indexOf('--sql-dir');
const sqlDir = sqlDirFlag === -1 ? '' : process.argv[sqlDirFlag + 1];
const assetBase = '/Swgoh-Farming-Assistant/';

function loadEnv(file) {
  try {
    return Object.fromEntries(
      readFileSync(file, 'utf8')
        .split(/\r?\n/)
        .map((line) => line.match(/^\s*([A-Za-z0-9_]+)\s*=\s*(.*?)\s*$/))
        .filter(Boolean)
        .map((match) => {
          let value = match[2];
          if (
            (value.startsWith('"') && value.endsWith('"')) ||
            (value.startsWith("'") && value.endsWith("'"))
          ) {
            value = value.slice(1, -1);
          }
          return [match[1], value];
        })
    );
  } catch {
    return {};
  }
}

function projectUrl(value) {
  return String(value || '').trim().replace(/\/rest\/v1\/?$/i, '').replace(/\/+$/, '');
}

function relativeIcon(icon) {
  if (typeof icon !== 'string') return icon;
  if (icon.startsWith(assetBase)) return icon.slice(assetBase.length);
  return icon.replace(/^\/+/, '');
}

function relativizeUnit(unit) {
  if (!unit || typeof unit !== 'object' || typeof unit.icon !== 'string') return unit;
  return { ...unit, icon: relativeIcon(unit.icon) };
}

function farmRow(farm, index, collection) {
  return {
    id: `${collection}:${index}`,
    collection,
    sort_order: index,
    event: farm.event,
    category: farm.category,
    reward: relativizeUnit(farm.reward),
    characters: (farm.characters ?? []).map(relativizeUnit),
    ships: (farm.ships ?? []).map(relativizeUnit)
  };
}

async function loadModules() {
  const server = await createServer({
    configFile: resolve(root, 'vite.config.js'),
    root,
    logLevel: 'error',
    server: { middlewareMode: true, hmr: false },
    appType: 'custom'
  });

  try {
    const load = (path) => server.ssrLoadModule(path);
    const [
      sources,
      priority,
      farms,
      relics,
      assaults,
      teams,
      squads,
      alternate,
      pools,
      currencies,
      rules
    ] = await Promise.all([
      load('/src/data/farmingSources.js'),
      load('/src/data/farmingRoadmap.js'),
      load('/src/data/allFarmsRoadmap.js'),
      load('/src/data/relicMaterials.js'),
      load('/src/data/assaultBattles.js'),
      load('/src/data/assaultBattleTeams.js'),
      load('/src/data/recommendedSquads.js'),
      load('/src/data/alternateFarmingSources.js'),
      load('/src/data/poolRequirements.js'),
      load('/src/data/currencyIcons.js'),
      load('/src/data/gameRules.js')
    ]);

    return {
      units: sources.unitCatalog.map((unit, index) => ({
        id: unit.id,
        name: unit.name,
        kind: unit.kind,
        alignment: unit.alignment ?? null,
        icon: relativeIcon(unit.icon) || '',
        sources: unit.sources ?? [],
        sort_order: index
      })),
      farms: [
        ...priority.farmingRoadmap.map((farm, index) => farmRow(farm, index, 'priority')),
        ...farms.allFarmsRoadmap.map((farm, index) => farmRow(farm, index, 'catalog'))
      ],
      relicMaterials: relics.RELIC_MATERIALS.map((material, index) => ({
        id: material.id,
        name: material.name,
        icon: relativeIcon(material.icon),
        material_group: material.group,
        sort_order: index
      })),
      relicCosts: Object.entries(relics.RELIC_COST_BY_LEVEL).map(([level, costs]) => ({
        level: Number(level),
        costs
      })),
      assaultBattles: assaults.assaultBattles.map((battle, index) => ({
        id: battle.id,
        event_key: battle.eventKey,
        name: battle.name,
        summary: battle.summary ?? '',
        format: battle.format ?? '',
        sort_order: index,
        payload: battle
      })),
      assaultTeams: Object.entries(teams.assaultBattleTeams).map(([battleId, squads]) => ({
        battle_id: battleId,
        teams: squads
      })),
      recommendedSquads: Object.entries(squads.recommendedSquads).map(([event, entry]) => ({
        event,
        units: entry.units,
        source: entry.source ?? null,
        source_label: entry.sourceLabel ?? null,
        caveat: entry.caveat ?? null
      })),
      alternateSources: Object.entries(alternate.alternateFarmingSources).map(([unitId, sources]) => ({
        unit_id: unitId,
        sources
      })),
      storeCurrencies: Object.entries(alternate.STORE_CURRENCIES).map(([storeName, currency]) => ({
        store_name: storeName,
        currency
      })),
      poolRequirements: Object.entries(pools.POOL_REQUIREMENTS).map(([event, requirement]) => ({
        event,
        squad_count: requirement.count,
        label: requirement.label
      })),
      settings: [
        { key: 'farming_source_meta', value: sources.FARMING_SOURCE_META },
        { key: 'gear_level_for_relics', value: rules.GEAR_LEVEL_FOR_RELICS },
        { key: 'lightspeed_token_ceiling', value: rules.LIGHTSPEED_TOKEN_CEILING },
        { key: 'max_relic_level', value: relics.MAX_RELIC_LEVEL },
        { key: 'currency_icons', value: currencies.currencyIconPaths }
      ]
    };
  } finally {
    await server.close();
  }
}

function sqlString(value) {
  if (value === null || value === undefined) return 'null';
  return `'${String(value).replaceAll("'", "''")}'`;
}

function sqlJson(value) {
  return `${sqlString(JSON.stringify(value))}::jsonb`;
}

function insertSql(table, rows, columns, conflict) {
  const values = rows.map((row) => `(${columns.map((column) => {
    const value = row[column];
    if (column === 'level' || column === 'sort_order' || column === 'squad_count') return Number(value);
    if (typeof value === 'number' || typeof value === 'boolean') return `${JSON.stringify(value)}::jsonb`;
    if (value !== null && typeof value === 'object') return sqlJson(value);
    return sqlString(value);
  }).join(', ')})`);
  const updates = columns
    .filter((column) => column !== conflict)
    .map((column) => `${column} = excluded.${column}`)
    .join(', ');
  return `insert into public.${table} (${columns.join(', ')})\nvalues\n${values.join(',\n')}\non conflict (${conflict}) do update set ${updates};`;
}

function writeSqlFiles(directory, tables) {
  mkdirSync(directory, { recursive: true });
  const jobs = [
    ['units', tables.units, ['id', 'name', 'kind', 'alignment', 'icon', 'sources', 'sort_order'], 'id'],
    ['farms', tables.farms, ['id', 'collection', 'sort_order', 'event', 'category', 'reward', 'characters', 'ships'], 'id'],
    ['relic_materials', tables.relicMaterials, ['id', 'name', 'icon', 'material_group', 'sort_order'], 'id'],
    ['relic_level_costs', tables.relicCosts, ['level', 'costs'], 'level'],
    ['assault_battles', tables.assaultBattles, ['id', 'event_key', 'name', 'summary', 'format', 'sort_order', 'payload'], 'id'],
    ['assault_battle_teams', tables.assaultTeams, ['battle_id', 'teams'], 'battle_id'],
    ['recommended_squads', tables.recommendedSquads, ['event', 'units', 'source', 'source_label', 'caveat'], 'event'],
    ['alternate_farming_sources', tables.alternateSources, ['unit_id', 'sources'], 'unit_id'],
    ['store_currencies', tables.storeCurrencies, ['store_name', 'currency'], 'store_name'],
    ['pool_requirements', tables.poolRequirements, ['event', 'squad_count', 'label'], 'event'],
    ['catalog_settings', tables.settings, ['key', 'value'], 'key']
  ];
  const files = [];
  jobs.forEach(([table, rows, columns, conflict]) => {
    let batch = [];
    let size = 0;
    let part = 0;
    const flush = () => {
      if (batch.length === 0) return;
      const name = `${String(files.length).padStart(3, '0')}-${table}-${part}.sql`;
      writeFileSync(resolve(directory, name), insertSql(table, batch, columns, conflict));
      files.push(name);
      batch = [];
      size = 0;
      part += 1;
    };
    rows.forEach((row) => {
      const encoded = JSON.stringify(row).length;
      if (batch.length > 0 && size + encoded > 35000) flush();
      batch.push(row);
      size += encoded;
    });
    flush();
  });
  writeFileSync(resolve(directory, 'manifest.json'), JSON.stringify(files));
  return files;
}

async function upsertChunks(client, table, rows, onConflict, size = 100) {
  for (let index = 0; index < rows.length; index += size) {
    const { error } = await client
      .from(table)
      .upsert(rows.slice(index, index + size), { onConflict });
    if (error) throw new Error(`${table}: ${error.message}`);
  }
}

const env = { ...loadEnv(resolve(root, '.env')), ...process.env };
const url = projectUrl(env.VITE_SUPABASE_URL);
const secret = env.SUPABASE_SECRET_KEY || env.SUPABASE_SERVICE_ROLE_KEY;

const tables = await loadModules();
const counts = Object.fromEntries(Object.entries(tables).map(([name, rows]) => [name, rows.length]));
console.log(dryRun ? 'Dry run. No rows written.' : 'Seeding game catalog.');
console.log(counts);

if (dryRun || sqlDir) {
  const sampleIcon = tables.farms[0]?.reward?.icon ?? '';
  if (sampleIcon.startsWith('/') || sampleIcon.includes('Swgoh-Farming-Assistant')) {
    throw new Error(`Farm icons should be stored relative to the site root. Got ${sampleIcon}`);
  }
  if (sqlDir) {
    const files = writeSqlFiles(sqlDir, tables);
    console.log(`Wrote ${files.length} SQL files to ${sqlDir}`);
  }
  process.exit(0);
}

if (!url || !secret) {
  console.error('Add VITE_SUPABASE_URL and SUPABASE_SECRET_KEY to .env, then run this again.');
  console.error('The secret key is the service_role or secret key. Do not put it in a VITE_ variable.');
  process.exit(1);
}

const client = createClient(url, secret, {
  auth: { persistSession: false, autoRefreshToken: false }
});

await upsertChunks(client, 'units', tables.units, 'id');
await upsertChunks(client, 'farms', tables.farms, 'id');
await upsertChunks(client, 'relic_materials', tables.relicMaterials, 'id');
await upsertChunks(client, 'relic_level_costs', tables.relicCosts, 'level');
await upsertChunks(client, 'assault_battles', tables.assaultBattles, 'id', 5);
await upsertChunks(client, 'assault_battle_teams', tables.assaultTeams, 'battle_id');
await upsertChunks(client, 'recommended_squads', tables.recommendedSquads, 'event');
await upsertChunks(client, 'alternate_farming_sources', tables.alternateSources, 'unit_id');
await upsertChunks(client, 'store_currencies', tables.storeCurrencies, 'store_name');
await upsertChunks(client, 'pool_requirements', tables.poolRequirements, 'event');
await upsertChunks(client, 'catalog_settings', tables.settings, 'key');
console.log('Game catalog seeded.');
