/**
 * Generates the recurring Assault Battle catalog from the public game-data mirror.
 *
 * Hard gates and reward previews come from campaign.json.br. Strategy/team
 * advice remains hand-curated in src/data/assaultBattleTeams.js.
 *
 * Run with: npm run build:assaults
 */
import { readdir, readFile, writeFile } from 'node:fs/promises';
import { brotliDecompress } from 'node:zlib';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const brotli = promisify(brotliDecompress);
const GAMEDATA = 'https://raw.githubusercontent.com/swgoh-utils/gamedata/main';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'assaultBattles.js');
const TEAMS_FILE = path.join(ROOT, 'src', 'data', 'assaultBattleTeams.js');
const ASSET_DIRS = ['characters', 'ships', 'relic-materials', 'currencies', 'reward-icons'];

const EVENT_DEFINITIONS = [
  {
    id: 'NODE_EVENT_ASSAULT_EWOK',
    eventKey: 'EVENT_ASSAULT_EWOK',
    name: 'Forest Moon',
    summary: 'Battle waves of increasingly dangerous Ewoks.',
    wiki: 'https://swgoh.wiki/wiki/Forest_Moon'
  },
  {
    id: 'NODE_EVENT_ASSAULT_EMPIRE',
    eventKey: 'EVENT_ASSAULT_EMPIRE',
    name: 'Military Might',
    summary: 'Lead Rebels or Clone Troopers against the Empire.',
    wiki: 'https://swgoh.wiki/wiki/Military_Might'
  },
  {
    id: 'NODE_EVENT_ASSAULT_SEPARATIST',
    eventKey: 'EVENT_ASSAULT_SEPARATIST',
    name: 'Ground War',
    summary: 'Use Jedi and their allies to overcome Separatist armies.',
    wiki: 'https://swgoh.wiki/wiki/Ground_War'
  },
  {
    id: 'NODE_EVENT_ASSAULT_JEDI',
    eventKey: 'EVENT_ASSAULT_JEDI',
    name: 'Places of Power',
    summary: 'First Order and Sith face waves of Jedi.',
    wiki: 'https://swgoh.wiki/wiki/Places_of_Power'
  },
  {
    id: 'NODE_EVENT_ASSAULT_DARKSIDE',
    eventKey: 'EVENT_ASSAULT_DARKSIDE',
    name: 'Secrets and Shadows',
    summary: 'Nightsisters and Phoenix confront Sith forces.',
    wiki: 'https://swgoh.wiki/wiki/Secrets_and_Shadows'
  },
  {
    id: 'NODE_EVENT_ASSAULT_REBEL',
    eventKey: 'EVENT_ASSAULT_REBEL',
    name: 'Rebel Roundup',
    summary: 'Bounty Hunters and Imperial Troopers hunt Rebel squads.',
    wiki: 'https://swgoh.wiki/wiki/Rebel_Roundup'
  },
  {
    id: 'NODE_EVENT_ASSAULT_INQUISITOR',
    eventKey: 'EVENT_ASSAULT_INQUISITOR',
    name: 'Fanatical Devotion',
    summary: 'Inquisitorius and Tusken squads battle Jedi defenders.',
    wiki: 'https://swgoh.wiki/wiki/Fanatical_Devotion'
  },
  {
    id: 'NODE_EVENT_ASSAULT_DUEL_OF_THE_FATES',
    eventKey: 'EVENT_ASSAULT_DUEL_OF_THE_FATES',
    name: 'Duel of the Fates',
    summary: 'A fixed duo relives the confrontation with Darth Maul.',
    wiki: 'https://swgoh.wiki/wiki/Duel_of_the_Fates'
  },
  {
    id: 'NODE_EVENT_ASSAULT_PERIDEA_PATROL',
    eventKey: 'EVENT_ASSAULT_PERIDEA_PATROL',
    name: 'Peridea Patrol',
    summary: 'Captain Enoch and his Night Troopers patrol Peridea.',
    wiki: 'https://swgoh.wiki/wiki/Peridea_Patrol'
  }
];

const CLASSIC_TIER_NAMES = [
  'Tier I',
  'Tier II',
  'Bonus Tier',
  'Mythic Tier',
  'Challenge Tier I',
  'Challenge Tier II',
  'Challenge Tier III'
];

const MODERN_TIER_NAMES = [
  'Tier I',
  'Tier II',
  'Tier III',
  'Tier IV',
  'Tier V',
  'Tier VI'
];

/**
 * In-game "Recommended" panels as transcribed on the SWGOH Wiki event pages.
 * These are advice, never entry gates.
 */
const CLASSIC_RECOMMENDATIONS = [
  ['Unit level 75+', 'Gear level 8+', 'Mods 3+ dots'],
  ['Unit level 80+', 'Gear level 10+', 'Mods 4+ dots'],
  ['Unit level 85', 'Gear level 11+', 'Mods 5+ dots'],
  ['Unit level 85', 'Gear level 11+', 'Mods 5+ dots', 'Zeta ability upgrades'],
  ['Relic level 3+', 'Mods 6 dots', 'Zeta ability upgrades'],
  ['Relic level 5+', 'Mods 6 dots', 'Zeta ability upgrades'],
  ['Relic level 7+', 'Mods 6 dots', 'Zeta ability upgrades']
];

const MODERN_RECOMMENDATIONS = [
  ['Unit level 75+', 'Gear level 8+', 'Mods 3+ dots'],
  ['Unit level 80+', 'Gear level 10+', 'Mods 4+ dots'],
  ['Unit level 85', 'Gear level 11+', 'Mods 5+ dots'],
  ['Relic level 5+', 'Mods 6 dots'],
  ['Relic level 7+', 'Mods 6 dots', 'Zeta ability upgrades'],
  ['Mods 6 dots', 'Zeta ability upgrades']
];

/**
 * How many lines of a reward pool actually drop. The reward preview lists the
 * whole pool without saying so, but every event page on the SWGOH Wiki states
 * the rule ("Drops: 2 characters, 1 ship, all mods", "Either of the following").
 * `stated` applies to the tiers the wiki prints that sentence on; anything else
 * falls back to DEFAULT_SELECTION and is flagged as unsourced.
 */
const REWARD_RULES = {
  // "Drops: 1 character, 1 gear, 1 mod and credits"
  NODE_EVENT_ASSAULT_EWOK: {
    statedTiers: [1, 2, 3],
    stated: { character: 1, gear: 1, mod: 1 }
  },
  // "Drops: 2 characters, 1 ship, 1 Ship Ability Mk I, 1 Ship Ability Mk II and 1 enhancement droid"
  NODE_EVENT_ASSAULT_EMPIRE: {
    statedTiers: [1, 2, 3],
    stated: { character: 2, ship: 1, abilityMaterial: 'all', trainingDroid: 1 }
  },
  // "Drops: 2 characters, 1 ship, all mods, Mk III Ability Material"
  NODE_EVENT_ASSAULT_SEPARATIST: {
    statedTiers: [1, 2, 3],
    stated: { character: 2, ship: 1, mod: 'all', abilityMaterial: 'all' }
  },
  // "Drops: 1 character, 1 ship, 1 gear, Ship Building Materials"
  NODE_EVENT_ASSAULT_JEDI: {
    statedTiers: [1, 2, 3],
    stated: { character: 1, ship: 1, gear: 1 }
  },
  // "Drops: 1 character, 1 ship, 1 gear, and credits"
  NODE_EVENT_ASSAULT_DARKSIDE: {
    statedTiers: [1, 2, 3],
    stated: { character: 1, ship: 1, gear: 1 }
  },
  // "Drops: 2 characters and 2 ships"
  NODE_EVENT_ASSAULT_REBEL: {
    statedTiers: [1, 2, 3],
    stated: { character: 2, ship: 2 }
  },
  // "Drops: 3 characters, 1 gear and Ship Building Materials"
  NODE_EVENT_ASSAULT_INQUISITOR: {
    statedTiers: [1, 2, 3],
    stated: { character: 3, gear: 1 }
  },
  NODE_EVENT_ASSAULT_DUEL_OF_THE_FATES: {
    byTier: {
      1: { character: 1 },
      2: { character: 1 },
      3: { modSlicing: 'all' },
      4: { relicScrap: 1, signalData: 1 },
      5: { relicScrap: 1, signalData: 1 },
      6: { relicScrap: 1 }
    }
  },
  NODE_EVENT_ASSAULT_PERIDEA_PATROL: {
    byTier: {
      1: { character: 1 },
      2: { character: 1 },
      3: { modSlicing: 'all' },
      4: { gear: 1 },
      5: { relicScrap: 1 },
      6: { relicScrap: 1, abilityMaterial: 'all' }
    }
  }
};

const DEFAULT_SELECTION = {
  character: 1,
  ship: 1,
  gear: 1,
  mod: 1,
  relicScrap: 1,
  signalData: 1,
  modSlicing: 'all',
  abilityMaterial: 'all',
  trainingDroid: 1,
  material: 'all'
};

const CURRENCIES = {
  GRIND: { name: 'Credits', kind: 'currency' },
  SHIP_GRIND: { name: 'Ship Building Materials', kind: 'currency' },
  PREMIUM: { name: 'Crystals', kind: 'currency' }
};

const CATEGORY_LABEL_OVERRIDES = {
  assaultbattle_duelofthefates: 'Master Qui-Gon or Qui-Gon Jinn'
};

/**
 * Relic scrap is previewed as separate pools per progression band, which is how
 * the wiki renders it (Duel of the Fates Tier IV lists SCV_001–004 as one
 * "either of the following" block and its signal data as another).
 */
const RELIC_SCRAP_BANDS = [
  { group: 'relicScrapI', upTo: 5 },
  { group: 'relicScrapII', upTo: 8 },
  { group: 'relicScrapIII', upTo: 10 }
];

const GROUP_ORDER = [
  ['character', 'Character shards'],
  ['ship', 'Ship blueprints'],
  ['relicScrapI', 'Relic materials'],
  ['relicScrapII', 'Relic materials'],
  ['relicScrapIII', 'Relic materials'],
  ['signalData', 'Signal data'],
  ['abilityMaterial', 'Ability materials'],
  ['modSlicing', 'Mod slicing materials'],
  ['mod', 'Mods'],
  ['gear', 'Gear salvage'],
  ['trainingDroid', 'Training droids'],
  ['material', 'Other rewards']
];

/** Families share one selection rule regardless of which pool they land in. */
function selectionFamily(group) {
  return group.startsWith('relicScrap') ? 'relicScrap' : group;
}

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

function fallbackLabel(id) {
  return id
    .replace(/^unitshard_/, '')
    .replace(/_/g, ' ')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

async function getJson(file) {
  const response = await fetch(`${GAMEDATA}/${file}`);
  if (!response.ok) throw new Error(`${response.status} ${file}`);
  return response.json();
}

async function getBrotliJson(file) {
  const response = await fetch(`${GAMEDATA}/${file}`);
  if (!response.ok) throw new Error(`${response.status} ${file}`);
  const buffer = Buffer.from(await response.arrayBuffer());
  return JSON.parse((await brotli(buffer)).toString('utf8'));
}

/** Maps normalized artwork names to the paths already shipped in public/assets. */
async function buildAssetIndex() {
  const index = new Map();
  for (const dir of ASSET_DIRS) {
    const files = await readdir(path.join(ROOT, 'public', 'assets', dir));
    for (const file of files) {
      if (!/\.(png|webp|jpe?g)$/i.test(file)) continue;
      const key = `${dir}:${normalize(path.parse(file).name)}`;
      if (!index.has(key)) index.set(key, `assets/${dir}/${file}`);
    }
  }
  return index;
}

function collectNodes(campaign) {
  const events = campaign.data.find((entry) => entry.id === 'EVENTS');
  const scheduled = events?.campaignMap?.find((entry) => entry.id === 'SCHEDULED');
  return (scheduled?.campaignNodeDifficultyGroup ?? [])
    .flatMap((group) => group.campaignNode ?? []);
}

function buildUnitIndex(units, strings) {
  const byId = new Map();
  for (const unit of units.data ?? units) {
    if (!unit.baseId || byId.has(unit.baseId)) continue;
    const name = strings[unit.nameKey];
    if (!name) continue;
    byId.set(unit.baseId, {
      id: unit.baseId,
      name,
      kind: unit.combatType === 2 ? 'ship' : 'character'
    });
  }
  return byId;
}

function buildCategoryIndex(categories, strings) {
  return new Map((categories.data ?? categories).map((category) => [
    category.id,
    CATEGORY_LABEL_OVERRIDES[category.id]
      || strings[category.descKey]
      || fallbackLabel(category.id.replace(/^[^_]+_/, ''))
  ]));
}

function materialGroup(id) {
  if (id.startsWith('SCV_')) {
    const index = Number(id.slice('SCV_'.length));
    return RELIC_SCRAP_BANDS.find((band) => index <= band.upTo)?.group ?? 'relicScrapIII';
  }
  if (id.startsWith('RM_')) return 'signalData';
  if (id.startsWith('MOD_SLICING_')) return 'modSlicing';
  if (/ability_mat_/.test(id)) return 'abilityMaterial';
  if (/xp-mat|xpbot/.test(id)) return 'trainingDroid';
  return 'material';
}

function buildRewardIndex({ materials, equipment, strings, unitById, modSets, assets }) {
  const index = new Map(
    Object.entries(CURRENCIES).map(([id, details]) => [id, {
      ...details,
      group: 'currency',
      icon: assets.get(`reward-icons:${normalize(id)}`)
        ?? assets.get(`relic-materials:${normalize(details.name)}`)
        ?? assets.get(`currencies:${normalize(details.name.replace(/s$/, ''))}`)
        ?? null
    }])
  );

  for (const item of [...(materials.data ?? materials), ...(equipment.data ?? equipment)]) {
    const unitId = item.id.startsWith('unitshard_') ? item.id.slice('unitshard_'.length) : null;
    const unit = unitId ? unitById.get(unitId) : null;
    const localized = strings[item.nameKey];
    const isGear = !unit && /Salvage$|^\d+$/.test(item.id);
    const group = unit ? unit.kind : isGear ? 'gear' : materialGroup(item.id);
    const name = unit
      ? `${unit.name} ${unit.kind === 'ship' ? 'blueprints' : 'shards'}`
      : localized || fallbackLabel(item.id);

    index.set(item.id, {
      name,
      kind: group,
      group,
      icon: assets.get(`reward-icons:${normalize(item.id)}`)
        ?? (unit
          ? assets.get(`${unit.kind === 'ship' ? 'ships' : 'characters'}:${normalize(unit.name)}`)
          : assets.get(`relic-materials:${normalize(name)}`))
        ?? null
    });
  }

  const modSetNames = new Map(
    (modSets.data ?? modSets).map((set) => [set.id, strings[set.name] || fallbackLabel(set.name)])
  );
  return { index, modSetNames };
}

function rewardEntry(reward, rewardIndex, modSetNames, assets) {
  let details = rewardIndex.get(reward.id);
  if (!details && reward.type === 16) {
    details = {
      name: `${modSetNames.get(reward.id[0]) || 'Random'} mod`,
      kind: 'mod',
      group: 'mod',
      icon: assets.get(`reward-icons:${normalize(reward.id)}`) ?? null
    };
  }
  details ??= { name: fallbackLabel(reward.id), kind: 'material', group: 'material', icon: null };

  const min = Number(reward.minQuantity);
  const max = Number(reward.maxQuantity);
  return {
    id: reward.id,
    name: details.name,
    kind: details.kind,
    group: details.group,
    icon: details.icon,
    min,
    max,
    variable: min !== max || min === 0
  };
}

/** How many lines of a pool drop, and whether the event page says so. */
function selectionFor(eventId, tierOrder, group, lineCount) {
  const rule = REWARD_RULES[eventId];
  const stated = rule?.byTier?.[tierOrder]
    ?? (rule?.statedTiers?.includes(tierOrder) ? rule.stated : null);
  const family = selectionFamily(group);
  const value = stated?.[family];
  const resolved = value ?? DEFAULT_SELECTION[family] ?? 'all';

  if (resolved === 'all' || resolved >= lineCount) {
    return { mode: 'all', sourced: value !== undefined };
  }
  return { mode: 'some', count: resolved, sourced: value !== undefined };
}

/**
 * Splits a reward preview into always-awarded currency and the item pools the
 * preview lists in full, keeping each family in its own group.
 */
function groupRewards(rewards, eventId, tierOrder) {
  const guaranteed = rewards.filter((reward) => reward.group === 'currency');
  const groups = [];

  for (const [group, label] of GROUP_ORDER) {
    const members = rewards.filter((reward) => reward.group === group);
    if (members.length === 0) continue;
    groups.push({
      group,
      label,
      selection: selectionFor(eventId, tierOrder, group, members.length),
      rewards: members
    });
  }

  return { guaranteed, groups };
}

/**
 * Daily attempts and the escalating crystal cost of extra runs, grouped into
 * ranges the way the event screen shows them ("1-2 = 499").
 */
function refreshFor(mission, capsById) {
  const cap = capsById.get(mission.dailyBattleCapKey);
  if (!cap) return null;

  const steps = [];
  for (const [index, cost] of (cap.purchaseCost ?? []).entries()) {
    const quantity = Number(cost.minQuantity);
    const currency = CURRENCIES[cost.id]?.name ?? fallbackLabel(cost.id);
    const previous = steps.at(-1);
    if (previous && previous.cost === quantity && previous.currency === currency) {
      previous.to = index + 1;
    } else {
      steps.push({ from: index + 1, to: index + 1, cost: quantity, currency });
    }
  }

  return {
    attempts: Number(cap.maxActions) || 0,
    unlimited: Boolean(cap.unlimitedPurchases),
    steps
  };
}

function gateFromMission(mission, categoryById, unitById) {
  const gate = mission.entryCategoryAllowed ?? {};
  const minimumStars = Number(gate.minimumUnitRarity);
  const minimumRelicTier = Number(gate.minimumRelicTier);
  return {
    categories: (gate.categoryId ?? []).map((id) => ({
      id,
      name: categoryById.get(id) || fallbackLabel(id)
    })),
    excludedCategories: (gate.excludeCategoryId ?? []).map((id) => ({
      id,
      name: categoryById.get(id) || fallbackLabel(id)
    })),
    mandatoryUnits: (gate.mandatoryRosterUnit ?? []).map((entry) => {
      const id = typeof entry === 'string' ? entry : entry.unitId || entry.id;
      return unitById.get(id) ?? { id, name: fallbackLabel(id), kind: 'character' };
    }),
    teamSize: Number(gate.minimumRequiredUnitQuantity) || 0,
    maximumUnits: Number(gate.maximumAllowedUnitQuantity) || 0,
    minimumStars: minimumStars >= 1 && minimumStars <= 7 ? minimumStars : 0,
    minimumLevel: Number(gate.minimumUnitLevel) > 1 ? Number(gate.minimumUnitLevel) : 0,
    minimumGear: Number(gate.minimumUnitTier) > 1 ? Number(gate.minimumUnitTier) : 0,
    minimumRelic: minimumRelicTier > 2 ? minimumRelicTier - 2 : 0,
    minimumModDots: Number(gate.minimumModRarity) <= 6 ? Number(gate.minimumModRarity) : 0
  };
}

function sourceFor(definition) {
  return [
    {
      label: 'Game data',
      url: `${GAMEDATA}/campaign.json.br`,
      type: 'canonical'
    },
    {
      label: 'SWGOH Wiki',
      url: definition.wiki,
      type: 'reference'
    },
    {
      label: 'SWGOH.GG event data',
      url: `https://swgoh.gg/events/${definition.eventKey}/`,
      type: 'reference'
    }
  ];
}

function validate(events, unitById, teams) {
  if (events.length !== EVENT_DEFINITIONS.length) {
    throw new Error(`Expected ${EVENT_DEFINITIONS.length} Assault Battles, received ${events.length}.`);
  }

  for (const event of events) {
    const expectedTiers = event.format === 'classic' ? 7 : 6;
    if (event.tiers.length !== expectedTiers) {
      throw new Error(`${event.name} has ${event.tiers.length} tiers; expected ${expectedTiers}.`);
    }
    event.tiers.forEach((tier, index) => {
      if (tier.order !== index + 1) throw new Error(`${event.name} tier order is invalid.`);
      if (tier.recommended.length === 0) {
        throw new Error(`${event.name} ${tier.name} is missing its recommended benchmark.`);
      }
      if (!tier.refresh) {
        throw new Error(`${event.name} ${tier.name} has no daily attempt cap.`);
      }
      for (const group of tier.rewards.groups) {
        if (group.selection.mode === 'some' && group.selection.count >= group.rewards.length) {
          throw new Error(`${event.name} ${tier.name} ${group.label} has a pointless pool rule.`);
        }
      }
      const rewards = [
        ...tier.firstTimeRewards,
        ...tier.rewards.guaranteed,
        ...tier.rewards.groups.flatMap((group) => group.rewards)
      ];
      for (const reward of rewards) {
        if (!reward.name || /_NAME|_DESC/.test(reward.name)) {
          throw new Error(`${event.name} has an unresolved reward ${reward.id}: "${reward.name}".`);
        }
        if (!reward.icon) {
          throw new Error(`${event.name} has no local icon for ${reward.id}: "${reward.name}".`);
        }
      }
    });
  }

  // A curated pool rule that matches no reward family means the event changed.
  for (const [eventId, rule] of Object.entries(REWARD_RULES)) {
    const event = events.find((entry) => entry.id === eventId);
    if (!event) throw new Error(`Pool rule points to unknown event ${eventId}.`);

    const entries = rule.byTier
      ? Object.entries(rule.byTier)
      : rule.statedTiers.map((order) => [order, rule.stated]);
    for (const [order, families] of entries) {
      const tier = event.tiers[Number(order) - 1];
      const present = new Set(tier.rewards.groups.map((group) => selectionFamily(group.group)));
      for (const family of Object.keys(families)) {
        if (!present.has(family)) {
          throw new Error(`${event.name} ${tier.name} has no ${family} rewards to apply a rule to.`);
        }
      }
    }
  }

  for (const [eventId, recommendations] of Object.entries(teams)) {
    if (!events.some((event) => event.id === eventId)) {
      throw new Error(`Team guide points to unknown event ${eventId}.`);
    }
    for (const recommendation of recommendations) {
      for (const unit of recommendation.units) {
        if (!unitById.has(unit.id)) {
          throw new Error(`${recommendation.name} uses unknown unit ${unit.id}.`);
        }
      }
    }
  }
}

async function main() {
  const [
    campaign,
    localization,
    materials,
    equipment,
    categories,
    units,
    modSets,
    dailyActionCaps,
    assets
  ] = await Promise.all([
    getBrotliJson('campaign.json.br'),
    getBrotliJson('Loc_ENG_US.txt.json.br'),
    getJson('material.json'),
    getJson('equipment.json'),
    getJson('category.json'),
    getBrotliJson('units.json.br'),
    getJson('statModSet.json'),
    getJson('dailyActionCap.json'),
    buildAssetIndex()
  ]);

  const strings = localization.data ?? localization;
  const unitById = buildUnitIndex(units, strings);
  const categoryById = buildCategoryIndex(categories, strings);
  const { index: rewardIndex, modSetNames } = buildRewardIndex({
    materials,
    equipment,
    strings,
    unitById,
    modSets,
    assets
  });
  const capsById = new Map(
    (dailyActionCaps.data ?? dailyActionCaps).map((cap) => [cap.id, cap])
  );
  const nodeById = new Map(collectNodes(campaign).map((node) => [node.id, node]));
  const { assaultBattleTeams } = await import(`${pathToFileURL(TEAMS_FILE).href}?v=${Date.now()}`);

  const events = EVENT_DEFINITIONS.map((definition) => {
    const node = nodeById.get(definition.id);
    if (!node) throw new Error(`Missing campaign node ${definition.id}.`);
    const format = node.campaignNodeMission.length === 7 ? 'classic' : 'modern';
    const tierNames = format === 'classic' ? CLASSIC_TIER_NAMES : MODERN_TIER_NAMES;
    const recommendations = format === 'classic'
      ? CLASSIC_RECOMMENDATIONS
      : MODERN_RECOMMENDATIONS;

    return {
      ...definition,
      format,
      sources: sourceFor(definition),
      tiers: node.campaignNodeMission.map((mission, index) => {
        const repeatRewards = (mission.rewardPreview ?? [])
          .map((reward) => rewardEntry(reward, rewardIndex, modSetNames, assets));
        const rewards = groupRewards(repeatRewards, definition.id, index + 1);

        return {
          id: mission.id,
          order: index + 1,
          name: tierNames[index],
          gate: gateFromMission(mission, categoryById, unitById),
          recommended: recommendations[index] ?? [],
          firstTimeRewards: (mission.firstCompleteRewardPreview ?? [])
            .map((reward) => rewardEntry(reward, rewardIndex, modSetNames, assets)),
          rewards,
          rewardRulesSourced: rewards.groups.every(
            (group) => group.selection.sourced || group.rewards.length === 1
          ),
          refresh: refreshFor(mission, capsById)
        };
      })
    };
  });

  validate(events, unitById, assaultBattleTeams);

  const header = [
    '// Generated by scripts/build_assault_battles.mjs — do not edit by hand.',
    `// Game data version: ${campaign.version}. Generated ${new Date().toISOString().slice(0, 10)}.`,
    '// Pool drop rules come from the SWGOH Wiki event pages; refresh costs from dailyActionCap.',
    ''
  ].join('\n');
  await writeFile(
    OUT_FILE,
    `${header}export const assaultBattles = ${JSON.stringify(events, null, 2)};\n`,
    'utf8'
  );

  // Ensure the generated module can be read and contains all expected ids.
  const source = await readFile(OUT_FILE, 'utf8');
  if (!EVENT_DEFINITIONS.every((definition) => source.includes(definition.id))) {
    throw new Error('Generated output failed its final event-id validation.');
  }

  const tiers = events.reduce((sum, event) => sum + event.tiers.length, 0);
  const rewards = events.reduce((sum, event) => sum + event.tiers.reduce(
    (count, tier) => count + tier.rewards.guaranteed.length
      + tier.rewards.groups.reduce((lines, group) => lines + group.rewards.length, 0),
    0
  ), 0);
  console.log(`Wrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${events.length} events, ${tiers} tiers, ${rewards} reward lines`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
