/**
 * Generates node farming locations for every unit in the event catalog.
 *
 * Nodes come from the live swgoh-utils/gamedata mirror. Store/event-only units
 * use swgoh.wiki's structured acquisition index because shipment inventory is
 * server-side and is not published in the game-data collections.
 *
 * Run with: node scripts/build_farming_sources.mjs
 */
import { mkdir, readFile, rm, writeFile } from 'node:fs/promises';
import { brotliDecompress } from 'node:zlib';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const brotli = promisify(brotliDecompress);
const GAMEDATA = 'https://raw.githubusercontent.com/swgoh-utils/gamedata/main';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const ROADMAP_FILE = path.join(ROOT, 'src', 'data', 'allFarmsRoadmap.js');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'farmingSources.js');
const ICON_OUT_FILE = path.join(ROOT, 'src', 'data', 'currencyIcons.js');
const ICON_DIR = path.join(ROOT, 'public', 'assets', 'currencies');
const ICON_PUBLIC_PATH = 'assets/currencies';
const WIKI_API = 'https://swgoh.wiki/api.php';
const WIKI_ORIGIN = 'https://swgoh.wiki';
const STORE_PAGES = [
  'Cantina Battles Store',
  'Conquest Store',
  'Fleet Arena Store',
  'Galactic War Store',
  'Guild Activity Store',
  'Guild Events Store',
  'Legend Tokens Store',
  'Shard Store',
  'Squad Arena Store'
];
const STORES_WITH_APPEARANCE = new Set([
  'Cantina Battles Store',
  'Fleet Arena Store',
  'Galactic War Store',
  'Guild Activity Store',
  'Guild Events Store',
  'Shard Store',
  'Squad Arena Store'
]);

const CAMPAIGN_TYPES = {
  C01L: { type: 'hard-node', label: 'Light Side' },
  C01D: { type: 'hard-node', label: 'Dark Side' },
  C01SP: { type: 'fleet-node', label: 'Fleet' },
  C01H: { type: 'cantina-node', label: 'Cantina' }
};

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

function decodeHtml(value) {
  return value
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)))
    .replace(/&#x([\da-f]+);/gi, (_, code) => String.fromCodePoint(Number.parseInt(code, 16)))
    .replace(/&infin;/g, '∞')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&quot;/g, '"')
    .replace(/&apos;|&#39;/g, "'");
}

function cellValues(html) {
  return decodeHtml(
    html
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<img\b[^>]*>/gi, '')
      .replace(/<[^>]*>/g, ' ')
  )
    .split('\n')
    .map((value) => value.replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function appearanceLabel(value) {
  if (value === '∞') return 'Always';
  if (/^avg$/i.test(value)) return 'Average';
  return value;
}

function numericValue(value) {
  const match = value.replaceAll(',', '').match(/(\d+(?:\.\d+)?)\s*(k)?/i);
  if (!match) return null;
  const amount = Number(match[1]);
  return match[2] ? Math.round(amount * 1000) : amount;
}

const APPEARANCE_RANK = {
  Always: 4,
  High: 3,
  Average: 2,
  Low: 1
};

function dedupeOffers(offers) {
  const byPrice = new Map();
  offers.forEach((offer) => {
    const key = `${offer.quantity}:${offer.cost}:${offer.currency}:${offer.itemType}`;
    const existing = byPrice.get(key);
    if (!existing ||
        (APPEARANCE_RANK[offer.appearance] ?? 0) >
        (APPEARANCE_RANK[existing.appearance] ?? 0)) {
      byPrice.set(key, offer);
    }
  });
  return [...byPrice.values()];
}

function parseStoreInventory(html, store, unitIdByName) {
  const offersByUnit = new Map();
  const iconUrlByCurrency = new Map();
  const rows = html.match(/<tr[\s\S]*?<\/tr>/g) ?? [];

  rows.forEach((row) => {
    const cells = [...row.matchAll(/<td[^>]*>([\s\S]*?)<\/td>/g)].map((match) => match[1]);
    if (cells.length < 4) return;

    const type = cellValues(cells.at(-1)).join(' ');
    if (!/^(Shards?|Blueprints?|Units)$/i.test(type)) return;

    const titles = [...cells[0].matchAll(/<a\b[^>]*\btitle="([^"]+)"/gi)]
      .map((match) => decodeHtml(match[1]).replace(/ \(page does not exist\)$/i, ''));
    const name = titles.find((candidate) => unitIdByName.has(normalize(candidate)));
    if (!name) return;
    const unitId = unitIdByName.get(normalize(name));
    if (!unitId) return;

    const quantities = cellValues(cells[1]).map(numericValue).filter(Number.isFinite);
    const costs = cellValues(cells[2])
      .map(numericValue)
      .filter(Number.isFinite);
    const currencies = [...cells[2].matchAll(/<img\b[^>]*>/gi)]
      .map((match) => {
        const currency = decodeHtml(match[0].match(/\balt="([^"]+)"/i)?.[1] ?? '');
        // The table renders 25px thumbnails; the unscaled file sits one level up.
        const file = match[0].match(/\bsrc="([^"]+)"/i)?.[1]
          ?.replace('/images/thumb/', '/images/')
          .replace(/\/\d+px-[^/]+$/, '');
        if (currency && file && !iconUrlByCurrency.has(currency)) {
          iconUrlByCurrency.set(currency, `${WIKI_ORIGIN}${file}`);
        }
        return currency;
      })
      .filter(Boolean);
    const appearances = STORES_WITH_APPEARANCE.has(store)
      ? cellValues(cells[3]).map(appearanceLabel)
      : [];
    const count = Math.max(quantities.length, costs.length, currencies.length, appearances.length);
    if (count === 0) return;

    const pick = (values, index) => values[index] ?? values.at(-1) ?? null;
    const offers = Array.from({ length: count }, (_, index) => ({
      quantity: pick(quantities, index),
      cost: pick(costs, index),
      currency: pick(currencies, index),
      appearance: pick(appearances, index),
      itemType: /^Blueprints?$/i.test(type) ? 'blueprints' : 'shards'
    })).filter((offer) => offer.quantity && offer.cost && offer.currency);

    if (offers.length > 0) {
      offersByUnit.set(unitId, [...(offersByUnit.get(unitId) ?? []), ...offers]);
    }
  });

  return {
    iconUrlByCurrency,
    entries: [...offersByUnit].map(([unitId, offers]) => ({
      unitId,
      source: {
        type: 'store',
        label: store,
        url: `https://swgoh.wiki/wiki/${store.replaceAll(' ', '_')}`,
        communityListed: true,
        offers: dedupeOffers(offers)
      }
    }))
  };
}

async function getStoreInventories(unitIdByName) {
  const inventories = await Promise.all(STORE_PAGES.map(async (store) => {
    const url = `${WIKI_API}?action=parse&page=${encodeURIComponent(store)}&prop=text&format=json`;
    const response = await fetch(url);
    if (!response.ok) return { iconUrlByCurrency: new Map(), entries: [] };
    const json = await response.json();
    return parseStoreInventory(json.parse?.text?.['*'] ?? '', store, unitIdByName);
  }));

  const iconUrlByCurrency = new Map();
  inventories.forEach((inventory) => {
    inventory.iconUrlByCurrency.forEach((url, currency) => {
      if (!iconUrlByCurrency.has(currency)) iconUrlByCurrency.set(currency, url);
    });
  });

  return {
    iconUrlByCurrency,
    entries: inventories.flatMap((inventory) => inventory.entries)
  };
}

function iconFileName(currency) {
  const slug = currency
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
  return `${slug}.png`;
}

/**
 * Caches every currency icon the stores actually use and emits the name -> path
 * map, so the app never asks swgoh.wiki for an image at runtime.
 */
async function downloadCurrencyIcons(iconUrlByCurrency) {
  await rm(ICON_DIR, { recursive: true, force: true });
  await mkdir(ICON_DIR, { recursive: true });

  const icons = {};
  for (const currency of [...iconUrlByCurrency.keys()].sort()) {
    const response = await fetch(iconUrlByCurrency.get(currency));
    if (!response.ok) throw new Error(`${response.status} icon for ${currency}`);
    const file = iconFileName(currency);
    await writeFile(path.join(ICON_DIR, file), Buffer.from(await response.arrayBuffer()));
    icons[currency] = `${ICON_PUBLIC_PATH}/${file}`;
  }

  await writeFile(
    ICON_OUT_FILE,
    [
      '// Generated by scripts/build_farming_sources.mjs — do not edit by hand.',
      '// Files live in public/assets/currencies so no icon is hotlinked at runtime.',
      '',
      `export const currencyIconPaths = ${JSON.stringify(icons, null, 2)};`,
      ''
    ].join('\n'),
    'utf8'
  );

  return icons;
}

async function getJson(file) {
  const response = await fetch(`${GAMEDATA}/${file}`);
  if (!response.ok) throw new Error(`${response.status} ${file}`);
  return response.json();
}

async function getBrotliJson(file) {
  const response = await fetch(`${GAMEDATA}/${file}`);
  if (!response.ok) throw new Error(`${response.status} ${file}`);
  const bytes = Buffer.from(await response.arrayBuffer());
  return JSON.parse((await brotli(bytes)).toString('utf8'));
}

function findMission(campaigns, identifier) {
  const campaign = campaigns.get(identifier.campaignId);
  const map = campaign?.campaignMap?.find((entry) => entry.id === identifier.campaignMapId);
  const group = map?.campaignNodeDifficultyGroup?.find(
    (entry) => entry.campaignNodeDifficulty === identifier.campaignNodeDifficulty
  );
  const node = group?.campaignNode?.find((entry) => entry.id === identifier.campaignNodeId);
  const mission = node?.campaignNodeMission?.find(
    (entry) => entry.id === identifier.campaignMissionId
  );
  return mission ? { campaign, mission } : null;
}

function serialize(sources, version) {
  return [
    '// Generated by scripts/build_farming_sources.mjs — do not edit by hand.',
    '// Nodes: swgoh-utils/gamedata. Store/event fallback: swgoh.wiki structured acquisition data.',
    '// Drop chance uses the long-observed 33% shard rate; store odds are not inferred.',
    `// Game-data version: ${version}. Generated ${new Date().toISOString().slice(0, 10)}.`,
    '',
    `export const FARMING_SOURCE_META = ${JSON.stringify({
      shardDropChance: 1 / 3,
      hardNodeAttemptsPerDay: 5,
      naturalCantinaEnergyPerDay: 120,
      bonusCantinaEnergyPerDay: 45
    }, null, 2)};`,
    '',
    `export const farmingSources = ${JSON.stringify(sources, null, 2)};`,
    ''
  ].join('\n');
}

async function getWikiLocations(name, isCharacter, storesOnly) {
  const property = isCharacter ? 'Has shards for' : 'Has blueprints for';
  const query = `[[${property}::${name}]]|limit=50`;
  const url = `https://swgoh.wiki/api.php?action=ask&query=${encodeURIComponent(query)}&format=json`;

  try {
    const response = await fetch(url);
    if (!response.ok) return [];
    const json = await response.json();
    return Object.values(json.query?.results ?? {})
      .map((result) => ({
        type: /store/i.test(result.fulltext) ? 'store' : 'event',
        label: result.fulltext,
        url: result.fullurl,
        communityListed: true
      }))
      // The wiki also lists the campaign nodes, which game data already
      // describes with energy costs and drop sizes. Keep its shipments only.
      .filter((source) => !storesOnly || source.type === 'store');
  } catch {
    return [];
  }
}

async function inBatches(items, size, task) {
  const results = [];
  for (let index = 0; index < items.length; index += size) {
    results.push(...await Promise.all(items.slice(index, index + size).map(task)));
  }
  return results;
}

async function main() {
  const roadmap = await readFile(ROADMAP_FILE, 'utf8');
  const unitIds = [...new Set([...roadmap.matchAll(/\bid:\s*"([^"]+)"/g)].map((match) => match[1]))];

  const [materialsJson, campaignJson, localizationJson, unitsJson, versions] = await Promise.all([
    getJson('material.json'),
    getJson('campaign.json'),
    getBrotliJson('Loc_ENG_US.txt.json.br'),
    getBrotliJson('units.json.br'),
    getJson('allVersions.json')
  ]);

  const materials = new Map(materialsJson.data.map((entry) => [entry.id, entry]));
  const campaigns = new Map(campaignJson.data.map((entry) => [entry.id, entry]));
  const strings = localizationJson.data ?? localizationJson;
  const units = new Map(unitsJson.data.map((entry) => [entry.baseId, entry]));
  const unitIdByName = new Map(
    [...units.values()]
      .map((unit) => [normalize(strings[unit.nameKey] ?? ''), unit.baseId])
      .filter(([name]) => name)
  );
  const sources = {};
  const wikiQueue = [];

  for (const unitId of unitIds.sort()) {
    const shardId = `unitshard_${unitId}`;
    const material = materials.get(shardId);
    if (!material) continue;

    const nodes = [];
    for (const lookup of material.lookupMission ?? []) {
      const identifier = lookup.missionIdentifier;
      const campaignType = CAMPAIGN_TYPES[identifier.campaignId];
      if (!campaignType) continue;

      const resolved = findMission(campaigns, identifier);
      if (!resolved) continue;

      const { mission } = resolved;
      const shardReward = mission.rewardPreview?.find((reward) => reward.id === shardId);
      const energy = mission.entryCostRequirement?.find((cost) =>
        ['PVE', 'SHIP_PVE', 'CANTINA_PVE'].includes(cost.id)
      );
      if (!shardReward || !energy) continue;

      nodes.push({
        type: campaignType.type,
        label: `${campaignType.label} ${strings[mission.shortNameKey] ?? identifier.campaignMissionId}`,
        energy: energy.minQuantity,
        attemptsPerDay: campaignType.type === 'cantina-node' ? null : 5,
        shardsPerDrop: shardReward.minQuantity,
        accelerated: shardReward.minQuantity > 1
      });
    }

    if (nodes.length > 0) {
      sources[unitId] = nodes.sort(
        (a, b) => a.energy - b.energy || a.label.localeCompare(b.label)
      );
    }

    // Shipments are queried for every unit, not just node-less ones. A unit can
    // have both: the Imperial TIE Bomber drops on Dark Side 5-A and also
    // appears in the Galactic War Store, and buying there accelerates the node.
    const unit = units.get(unitId);
    const name = material.nameKey ? strings[material.nameKey] : null;
    if (unit && name) {
      wikiQueue.push({
        unitId,
        name,
        isCharacter: unit.combatType === 1,
        storesOnly: nodes.length > 0
      });
    }
  }

  const [wikiResults, storeInventory] = await Promise.all([
    inBatches(
      wikiQueue,
      12,
      async ({ unitId, name, isCharacter, storesOnly }) => ({
        unitId,
        locations: await getWikiLocations(name, isCharacter, storesOnly)
      })
    ),
    getStoreInventories(unitIdByName)
  ]);
  wikiResults.forEach(({ unitId, locations }) => {
    if (locations.length === 0) return;
    sources[unitId] = [...(sources[unitId] ?? []), ...locations];
  });
  storeInventory.entries.forEach(({ unitId, source }) => {
    if (!unitIds.includes(unitId)) return;
    const existing = sources[unitId] ?? [];
    sources[unitId] = [
      ...existing.filter((candidate) =>
        candidate.type !== 'store' || candidate.label !== source.label
      ),
      source
    ];
  });

  await writeFile(
    OUT_FILE,
    serialize(sources, versions.gameVersion ?? versions.version ?? 'unknown'),
    'utf8'
  );
  const icons = await downloadCurrencyIcons(storeInventory.iconUrlByCurrency);
  const nodeCount = Object.values(sources).filter((entries) =>
    entries.some((entry) => entry.type.endsWith('-node'))
  ).length;
  console.log(
    `Wrote ${path.relative(ROOT, OUT_FILE)} for ${Object.keys(sources).length}/${unitIds.length} units ` +
    `(${nodeCount} with repeatable nodes).`
  );
  console.log(
    `Cached ${Object.keys(icons).length} currency icons in ${path.relative(ROOT, ICON_DIR)}.`
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
