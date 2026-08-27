/**
 * Regenerates src/data/allFarmsRoadmap.js.
 *
 * Sources:
 *   - swgoh-utils/gamedata  -> authoritative unit list (base ids, names, alignment,
 *                              factions) and the in-game Journey Guide roster.
 *   - swgoh.wiki            -> per-event unlock requirements (relic / star targets).
 *
 * Run with: npm run build:farms
 */

import { readdir, writeFile } from 'node:fs/promises';
import { brotliDecompress } from 'node:zlib';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const brotli = promisify(brotliDecompress);

const GAMEDATA = 'https://raw.githubusercontent.com/swgoh-utils/gamedata/main';
const WIKI = 'https://swgoh.wiki';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT_FILE = path.join(ROOT, 'src', 'data', 'allFarmsRoadmap.js');
const CHAR_ASSET_DIR = path.join(ROOT, 'public', 'assets', 'characters');
const SHIP_ASSET_DIR = path.join(ROOT, 'public', 'assets', 'ships');

const ALIGNMENTS = { 1: 'neutral', 2: 'light', 3: 'dark' };
const COMBAT_CHARACTER = 1;
const FACTION_PREFIXES = /^(affiliation|species|profession)_/;

const warnings = [];

function warn(message) {
  warnings.push(message);
}

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

/** "Bounty Hunters" and "Rebels" appear pluralised on the wiki. */
function singularize(value) {
  return value.replace(/s$/, '');
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

async function getBrotliJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return JSON.parse((await brotli(buffer)).toString('utf8'));
}

/** Source wikitext, which keeps the Event Infobox template call intact. */
async function fetchWikiSource(title) {
  const url = `${WIKI}/index.php?title=${encodeURIComponent(title.replace(/ /g, '_'))}&action=raw`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.text();
}

/**
 * Templates and Semantic MediaWiki variables expanded. Needed because several
 * event pages transclude their prerequisite tables from elsewhere.
 */
async function fetchWikiExpanded(title) {
  const url =
    `${WIKI}/api.php?action=expandtemplates&format=json&prop=wikitext&text=` +
    encodeURIComponent(`{{:${title}}}`);
  const json = await getJson(url);
  return json?.expandtemplates?.wikitext ?? '';
}

/**
 * Unlock events are spread across many wiki categories and some carry none, so
 * enumerate every page using the Event Infobox and let the in-game Journey Guide
 * roster decide which ones belong on the page.
 */
async function fetchEventPages() {
  const titles = new Set();
  let cont = '';

  do {
    const json = await getJson(
      `${WIKI}/api.php?action=query&list=embeddedin` +
        `&eititle=${encodeURIComponent('Template:Event Infobox')}` +
        `&einamespace=0&eilimit=500&format=json${cont}`
    );

    for (const page of json.query?.embeddedin ?? []) {
      titles.add(page.title);
    }

    cont = json.continue?.eicontinue
      ? `&eicontinue=${encodeURIComponent(json.continue.eicontinue)}`
      : '';
  } while (cont);

  return [...titles].sort();
}

async function buildGameIndex() {
  const [units, loc, categories] = await Promise.all([
    getBrotliJson(`${GAMEDATA}/units.json.br`),
    getBrotliJson(`${GAMEDATA}/Loc_ENG_US.txt.json.br`),
    getJson(`${GAMEDATA}/category.json`)
  ]);

  const strings = loc.data ?? loc;
  const byBaseId = new Map();
  const byName = new Map();
  const membersByCategory = new Map();

  for (const unit of units.data ?? units) {
    const baseId = unit.baseId;
    if (!baseId || byBaseId.has(baseId)) continue;

    const name = strings[unit.nameKey];
    if (!name) continue;

    const entry = {
      baseId,
      name,
      alignment: ALIGNMENTS[unit.forceAlignment] ?? 'neutral',
      isCharacter: unit.combatType === COMBAT_CHARACTER,
      categories: unit.categoryId ?? []
    };

    byBaseId.set(baseId, entry);

    const key = normalize(name);
    if (!byName.has(key)) byName.set(key, entry);

    if (entry.categories.includes('any_obtainable')) {
      for (const category of entry.categories) {
        if (!FACTION_PREFIXES.test(category)) continue;
        if (!membersByCategory.has(category)) membersByCategory.set(category, []);
        membersByCategory.get(category).push(entry);
      }
    }
  }

  const factionByName = new Map();
  for (const category of categories.data ?? categories) {
    if (!category.visible || !FACTION_PREFIXES.test(category.id)) continue;
    const label = strings[category.descKey];
    if (!label || label === 'Placeholder') continue;
    const key = normalize(label);
    if (!factionByName.has(key)) factionByName.set(key, { id: category.id, label });
  }

  return { byBaseId, byName, factionByName, membersByCategory };
}

async function buildAssetIndex() {
  const readDirSafe = async (dir) => {
    try {
      return await readdir(dir);
    } catch {
      warn(`Missing asset directory ${dir}`);
      return [];
    }
  };

  const [charFiles, shipFiles] = await Promise.all([
    readDirSafe(CHAR_ASSET_DIR),
    readDirSafe(SHIP_ASSET_DIR)
  ]);

  const toMap = (files) => {
    const map = new Map();
    for (const file of files) {
      if (!/\.(png|webp|jpg|jpeg)$/i.test(file)) continue;
      map.set(normalize(path.parse(file).name), file);
    }
    return map;
  };

  return { characters: toMap(charFiles), ships: toMap(shipFiles) };
}

/** A wiki link may be "[[Page|Display]]" or an SMW annotation; try every reading. */
function wikiLinkCandidates(raw) {
  const value = raw.trim().replace(/^[^:|[\]]{2,40}::/, '');
  return value
    .split('|')
    .map((part) => part.replace(/'''/g, '').replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

function parseTarget(raw) {
  const relic = raw.match(/relic\s*(\d+)/i);
  if (relic) return { targetR: Number(relic[1]), targetStars: 7 };

  const stars = raw.match(/(\d+)\s*stars?/i);
  if (stars) return { targetR: 0, targetStars: Number(stars[1]) };

  return null;
}

const UPGRADE_RE =
  /upg?r+ade\s+(?:the\s+)?'{0,4}\s*\[\[(.+?)\]\]\s*'{0,4}\s*to\s*'{0,4}\s*(relic\s*\d+|\d+\s*stars?)/gi;

function parseInfoboxField(wikitext, field) {
  const infobox = wikitext.match(/\{\{Event Infobox([\s\S]*?)\n\}\}/);
  if (!infobox) return '';
  const match = infobox[1].match(
    new RegExp(`\\|\\s*${field}\\s*=([\\s\\S]*?)(?=\\n\\s*\\|\\s*[a-zA-Z]+\\s*=|$)`)
  );
  return match ? match[1].trim() : '';
}

function extractPrerequisiteSection(wikitext) {
  const match = wikitext.match(/={2,3}\s*Prerequisites\s*={2,3}([\s\S]*?)(?=\n={2,3}[^=]|$)/);
  return match ? match[1] : '';
}

/** Lowest "Relic Level: N+" gate stated across the event tiers. */
function relicFloor(wikitext) {
  const values = [...wikitext.matchAll(/Relic Level:'*\s*'*\s*(\d+)/gi)].map((m) => Number(m[1]));
  return values.length > 0 ? Math.min(...values) : 0;
}

function collectUpgrades(wikitext) {
  const section = extractPrerequisiteSection(wikitext);
  const found = [];

  for (const match of section.matchAll(UPGRADE_RE)) {
    const target = parseTarget(match[2]);
    if (!target) continue;
    found.push({ link: match[1], ...target });
  }

  return found;
}

/**
 * Some events gate on owning another unlockable unit outright, stated as an
 * achievement like "Own 7-Star Darth Revan". Those are the real prerequisites,
 * unlike the infobox squad list, which is only what you take into the battle.
 */
function collectOwnedUnitAchievements(wikitext) {
  const section = extractPrerequisiteSection(wikitext);

  return [...section.matchAll(/Own\s+(\d+)\s*-?\s*Star\s+([^\n|}]+)/gi)].map((match) => ({
    link: match[2].trim(),
    targetR: 0,
    targetStars: Number(match[1])
  }));
}

/**
 * Requirements are read from the most authoritative source available:
 *   1. "Upgrade X to Relic N" quest rows (Galactic Legend ascension chains).
 *   2. "Own N-Star X" achievements (events gated on another unlockable unit).
 *   3. The infobox squad list, gated on 7 stars plus any relic floor the tiers
 *      state. Some of those entries name a whole faction rather than a unit.
 */
function extractRequirements(source, expanded) {
  for (const text of [expanded, source]) {
    const upgrades = collectUpgrades(text);
    if (upgrades.length > 0) return { requirements: upgrades, origin: 'quests' };
  }

  for (const text of [expanded, source]) {
    const owned = collectOwnedUnitAchievements(text);
    if (owned.length > 0) return { requirements: owned, origin: 'achievements' };
  }

  const requires = parseInfoboxField(source, 'requires');
  const floor = relicFloor(source);

  const requirements = [...requires.matchAll(/\[\[(.+?)\]\]/g)].map((match) => ({
    link: match[1],
    targetR: floor,
    targetStars: 7
  }));

  return { requirements, origin: 'entry' };
}

function resolveRewardUnit(source, expanded, index) {
  const lookup = (token) =>
    index.byBaseId.get(token.toUpperCase()) ?? index.byName.get(normalize(token)) ?? null;

  const rewards = parseInfoboxField(source, 'rewards');
  for (const match of rewards.matchAll(/\{\{Reward List\|[^|]*\|([^}|]+)\}\}/g)) {
    const hit = lookup(match[1].trim());
    if (hit) return hit;
  }

  // Pages that build their reward name from a variable still spell it out in the
  // expanded quest headings, e.g. "Galactic Legend Pirate King Hondo Ohnaka (1 of 4)".
  const heading = expanded.match(/Galactic Legend\s+(.+?)\s*\(\d+\s*of\s*\d+\)/i);
  if (heading) {
    const hit = lookup(heading[1]);
    if (hit) return hit;
  }

  return null;
}

function iconFor(unit, assets) {
  if (unit.isCharacter) {
    const file = assets.characters.get(normalize(unit.name));
    return file ? { dir: 'CHAR', file } : null;
  }
  const file =
    assets.ships.get(normalize(unit.baseId)) ?? assets.ships.get(normalize(unit.name));
  return file ? { dir: 'SHIP', file } : null;
}

function categoryLabel(reward, isGalacticLegend) {
  if (isGalacticLegend) return `👑 Galactic Legend: ${reward.name}`;
  if (!reward.isCharacter) return `🚀 Fleet Unlock: ${reward.name}`;
  return `⭐ Journey: ${reward.name}`;
}

function serialize(phases) {
  const lines = [];
  lines.push('// Generated by scripts/build_all_farms.mjs — do not edit by hand.');
  lines.push('// Sources: swgoh-utils/gamedata (unit ids) + swgoh.wiki (event requirements).');
  lines.push(`// Generated ${new Date().toISOString().slice(0, 10)}.`);
  lines.push('');
  lines.push('const CHAR_PATH = `${import.meta.env.BASE_URL}assets/characters/`;');
  lines.push('const SHIP_PATH = `${import.meta.env.BASE_URL}assets/ships/`;');
  lines.push('');
  lines.push('export const allFarmsRoadmap = [');

  phases.forEach((phase, phaseIndex) => {
    lines.push('  {');
    lines.push(`    category: ${JSON.stringify(phase.category)},`);
    lines.push(`    event: ${JSON.stringify(phase.event)},`);
    if (phase.note) lines.push(`    note: ${JSON.stringify(phase.note)},`);

    const rewardIcon = phase.reward.icon;
    const rewardFields = [`name: ${JSON.stringify(phase.reward.name)}`];
    if (rewardIcon) rewardFields.push(`icon: \`\${${rewardIcon.dir}_PATH}${rewardIcon.file}\``);
    lines.push(`    reward: { ${rewardFields.join(', ')} },`);

    for (const key of ['characters', 'ships']) {
      const list = phase[key];
      const tail = key === 'ships' ? '' : ',';

      if (list.length === 0) {
        lines.push(`    ${key}: []${tail}`);
        continue;
      }

      lines.push(`    ${key}: [`);
      list.forEach((unit, unitIndex) => {
        const fields = [`name: ${JSON.stringify(unit.name)}`, `id: ${JSON.stringify(unit.id)}`];
        if (unit.alignment) fields.push(`alignment: ${JSON.stringify(unit.alignment)}`);
        if (unit.targetR) fields.push(`targetR: ${unit.targetR}`);
        fields.push(`targetStars: ${unit.targetStars}`);
        if (unit.icon) fields.push(`icon: \`\${${unit.icon.dir}_PATH}${unit.icon.file}\``);
        lines.push(`      { ${fields.join(', ')} }${unitIndex === list.length - 1 ? '' : ','}`);
      });
      lines.push(`    ]${tail}`);
    }

    lines.push(`  }${phaseIndex === phases.length - 1 ? '' : ','}`);
  });

  lines.push('];');
  lines.push('');
  return lines.join('\n');
}

function buildPhase({ title, source, expanded, reward, isGalacticLegend, index, assets }) {
  const { requirements, origin } = extractRequirements(source, expanded);
  const characters = [];
  const ships = [];
  const seen = new Map();
  const factions = [];

  const addUnit = (unit, targetR, targetStars) => {
    const existing = seen.get(unit.baseId);
    if (existing) {
      existing.targetR = Math.max(existing.targetR, targetR);
      existing.targetStars = Math.max(existing.targetStars, targetStars);
      return;
    }

    const record = {
      name: unit.name,
      id: unit.baseId,
      alignment: unit.isCharacter ? unit.alignment : null,
      targetR: unit.isCharacter ? targetR : 0,
      targetStars,
      icon: iconFor(unit, assets)
    };

    if (!record.icon) warn(`Missing portrait for "${unit.name}" (${unit.baseId}).`);

    seen.set(unit.baseId, record);
    (unit.isCharacter ? characters : ships).push(record);
  };

  for (const requirement of requirements) {
    const candidates = wikiLinkCandidates(requirement.link);

    const unit = candidates
      .map((candidate) => index.byName.get(normalize(candidate)))
      .find(Boolean);

    if (unit) {
      addUnit(unit, requirement.targetR, requirement.targetStars);
      continue;
    }

    // Faction gates such as "any 5 Ewoks" list the whole eligible pool instead.
    const faction = candidates
      .map(
        (candidate) =>
          index.factionByName.get(normalize(candidate)) ??
          index.factionByName.get(normalize(singularize(candidate)))
      )
      .find(Boolean);

    if (faction) {
      const members = index.membersByCategory.get(faction.id) ?? [];
      if (members.length === 0) {
        warn(`"${title}": faction "${faction.label}" has no members.`);
        continue;
      }
      if (!factions.includes(faction.label)) factions.push(faction.label);
      for (const member of members) {
        if (!member.isCharacter) continue;
        addUnit(member, requirement.targetR, requirement.targetStars);
      }
      continue;
    }

    if (!/capital ship|any /i.test(candidates[0] ?? '')) {
      warn(`"${title}": unresolved requirement "${candidates.join(' | ')}".`);
    }
  }

  if (characters.length === 0 && ships.length === 0) return null;

  const notes = [];
  if (factions.length > 0) {
    notes.push(
      `Faction requirement — every eligible ${factions.join(' / ')} unit is listed; ` +
        'you only need the squad size the event asks for.'
    );
  }
  if (origin === 'achievements') {
    notes.push('Unlocked by owning these units outright — no relic quest chain.');
  }
  if (origin === 'entry') {
    notes.push('Targets come from the event entry requirements rather than a relic quest chain.');
  }

  const suffix = factions.length > 0 ? ` (${factions.join(' / ')} pool)` : '';
  const rewardIcon = iconFor(reward, assets);
  if (!rewardIcon) warn(`Missing reward portrait for "${reward.name}" (${reward.baseId}).`);

  return {
    category: categoryLabel(reward, isGalacticLegend) + suffix,
    event: title,
    note: notes.join(' ') || null,
    reward: { name: reward.name, icon: rewardIcon },
    rewardBaseId: reward.baseId,
    isGalacticLegend,
    characters,
    ships
  };
}

async function main() {
  console.log('Fetching game data and wiki event list…');
  const [index, assets, guide, pages] = await Promise.all([
    buildGameIndex(),
    buildAssetIndex(),
    getJson(`${GAMEDATA}/unitGuideDefinition.json`),
    fetchEventPages()
  ]);

  const guideEntries = guide.data.filter((entry) => !entry.inPreview);
  const guideOrder = new Map(guideEntries.map((entry, i) => [entry.unitBaseId, i]));
  const glBaseIds = new Set(
    guideEntries.filter((entry) => entry.galacticLegend).map((entry) => entry.unitBaseId)
  );

  console.log(`Reading ${pages.length} wiki event pages…`);
  const byReward = new Map();

  for (const title of pages) {
    let source;
    let expanded;
    try {
      [source, expanded] = await Promise.all([fetchWikiSource(title), fetchWikiExpanded(title)]);
    } catch (err) {
      warn(`Could not read wiki page "${title}": ${err.message}`);
      continue;
    }

    const reward = resolveRewardUnit(source, expanded, index);
    if (!reward || !guideOrder.has(reward.baseId)) continue;

    const phase = buildPhase({
      title,
      source,
      expanded,
      reward,
      isGalacticLegend: glBaseIds.has(reward.baseId),
      index,
      assets
    });

    if (!phase) {
      warn(`Skipped "${title}" (${reward.name}): no requirements resolved.`);
      continue;
    }

    // A unit can have more than one event page; keep the most detailed one.
    const existing = byReward.get(reward.baseId);
    const size = phase.characters.length + phase.ships.length;
    if (existing && existing.characters.length + existing.ships.length >= size) continue;
    byReward.set(reward.baseId, phase);
  }

  const phases = [...byReward.values()];
  const covered = new Set(byReward.keys());

  phases.sort((a, b) => {
    if (a.isGalacticLegend !== b.isGalacticLegend) return a.isGalacticLegend ? -1 : 1;
    const orderA = guideOrder.get(a.rewardBaseId) ?? Number.MAX_SAFE_INTEGER;
    const orderB = guideOrder.get(b.rewardBaseId) ?? Number.MAX_SAFE_INTEGER;
    if (orderA !== orderB) return orderA - orderB;
    return a.category.localeCompare(b.category);
  });

  await writeFile(OUT_FILE, serialize(phases), 'utf8');

  const uncovered = guideEntries
    .filter((entry) => !covered.has(entry.unitBaseId) && entry.unitBaseId !== 'TBA')
    .map((entry) => index.byBaseId.get(entry.unitBaseId)?.name ?? entry.unitBaseId);

  const glCount = phases.filter((phase) => phase.isGalacticLegend).length;
  const unitCount = phases.reduce((sum, p) => sum + p.characters.length + p.ships.length, 0);

  console.log(`\nWrote ${path.relative(ROOT, OUT_FILE)}`);
  console.log(`  ${phases.length} events (${glCount} Galactic Legends), ${unitCount} requirements`);

  if (uncovered.length > 0) {
    console.log(`\nJourney Guide units without a requirements page (${uncovered.length}):`);
    uncovered.forEach((name) => console.log(`  - ${name}`));
  }

  if (warnings.length > 0) {
    console.log(`\nWarnings (${warnings.length}):`);
    warnings.forEach((message) => console.log(`  ! ${message}`));
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
