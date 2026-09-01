/**
 * Regenerates src/data/allFarmsRoadmap.js.
 *
 * Sources:
 *   - swgoh-utils/gamedata  -> authoritative unit list (base ids, names, alignment,
 *                              factions) and the in-game Journey Guide roster.
 *   - swgoh.wiki            -> per-event unlock requirements (relic / star targets).
 *   - campaign.json         -> the requirements the game itself prints on each
 *                              event tier, used for events the wiki has no page
 *                              for. Everything released since mid-2024 falls here.
 *
 * Run with: npm run build:farms
 */

import { readdir, writeFile } from 'node:fs/promises';
import { brotliDecompress } from 'node:zlib';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { minimumStarsForRelic } from '../src/data/gameRules.js';

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
const TITLE_MINOR_WORDS = new Set(['a', 'an', 'and', 'for', 'in', 'of', 'on', 'the', 'to']);

/**
 * A handful of events gate on a quest chain that the game data only references
 * by id, and that the wiki has no page for, so neither source can state their
 * requirements. These are transcribed from the event's official announcement.
 */
const ANNOUNCED_REQUIREMENTS = {
  // ea.com/games/starwars/galaxy-of-heroes/news/kit-reveal-baylan-skoll
  // Only Shin Hati, Marrok and Morgan Elsbeth enter the battle; Baylan is
  // loaned for it, so the other two show up nowhere in the campaign data.
  BAYLANSKOLL: [
    { id: 'SHINHATI', targetR: 7 },
    { id: 'MARROK', targetR: 7 },
    { id: 'MORGANELSBETH', targetR: 7 },
    { id: 'GRANDADMIRALTHRAWN', targetR: 7 },
    { id: 'GREATMOTHERS', targetR: 7 }
  ]
};

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
  const membersByTag = new Map();

  for (const unit of units.data ?? units) {
    const baseId = unit.baseId;
    if (!baseId || byBaseId.has(baseId)) continue;

    const name = strings[unit.nameKey];
    if (!name) continue;

    const categoryIds = unit.categoryId ?? [];
    const entry = {
      baseId,
      name,
      alignment: ALIGNMENTS[unit.forceAlignment] ?? 'neutral',
      isCharacter: unit.combatType === COMBAT_CHARACTER,
      isCapital:
        categoryIds.includes('role_capital') || categoryIds.includes('shipclass_capitalship'),
      categories: categoryIds
    };

    byBaseId.set(baseId, entry);

    const key = normalize(name);
    if (!byName.has(key)) byName.set(key, entry);

    for (const category of categoryIds) {
      if (!category.startsWith('selftag_')) continue;
      if (!membersByTag.has(category)) membersByTag.set(category, []);
      membersByTag.get(category).push(entry);
    }

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

  return { byBaseId, byName, factionByName, membersByCategory, membersByTag, strings };
}

async function buildCampaignNodes() {
  const campaign = await getJson(`${GAMEDATA}/campaign.json`);
  const nodes = new Map();

  for (const entry of campaign.data ?? campaign) {
    for (const map of entry.campaignMap ?? []) {
      for (const group of map.campaignNodeDifficultyGroup ?? []) {
        for (const node of group.campaignNode ?? []) {
          nodes.set(`${entry.id}:${map.id}:${node.id}`, node);
        }
      }
    }
  }

  return nodes;
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

/** Wiki links like "Galactic Republic Ship" or "1+ Rebel Ships" are fleet gates. */
function linkLooksLikeShip(candidates) {
  return /\bships?\b|capital\s*ships?/i.test(candidates.join(' '));
}

/** "Any Galactic Republic Capital Ship" vs "any 3+ Galactic Republic Ship". */
function linkLooksLikeCapitalOnly(candidates) {
  const text = candidates.join(' ');
  if (!/capital\s*ships?/i.test(text)) return false;
  return !/\bships?\b/i.test(text.replace(/capital\s*ships?/gi, ''));
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
  if (relic) {
    const targetR = Number(relic[1]);
    return { targetR, targetStars: minimumStarsForRelic(targetR) };
  }

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

/**
 * Explicit star gates from playable tiers, kept beside the units named in the
 * same tier. This prevents a 7-star ship tier from being applied to a fleet
 * event's relic-gated characters.
 */
function collectTierStarRequirements(wikitext) {
  const requirements = [];
  const fields = wikitext.matchAll(
    /\|\s*requirements\s*=([\s\S]*?)(?=\n\s*\|\s*[a-zA-Z]+\s*=|\n\s*\}\})/gi
  );

  for (const field of fields) {
    const plainText = field[1].replace(/'/g, '');
    const stars = plainText.match(/\bStars?\s*:\s*(\d+)/i);
    if (!stars) continue;

    for (const link of field[1].matchAll(/\[\[(.+?)\]\]/g)) {
      requirements.push({
        link: link[1],
        targetStars: Number(stars[1])
      });
    }
  }

  return requirements;
}

function mergeTierStarRequirements(requirements, wikitext) {
  const overlays = collectTierStarRequirements(wikitext);

  return requirements.map((requirement) => {
    const keys = new Set(wikiLinkCandidates(requirement.link).map(normalize));
    const matchingStars = overlays
      .filter((overlay) =>
        wikiLinkCandidates(overlay.link).some((candidate) => keys.has(normalize(candidate)))
      )
      .map((overlay) => overlay.targetStars);

    return matchingStars.length === 0
      ? requirement
      : { ...requirement, targetStars: Math.max(requirement.targetStars, ...matchingStars) };
  });
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
 *   3. The infobox squad list, using the highest explicit star gate and any
 *      relic floor stated by the tiers. A relic-only gate gets only the minimum
 *      rarity the game itself requires for that relic.
 */
function extractRequirements(source, expanded) {
  for (const text of [expanded, source]) {
    const upgrades = collectUpgrades(text);
    if (upgrades.length > 0) {
      return {
        requirements: mergeTierStarRequirements(upgrades, source),
        origin: 'quests'
      };
    }
  }

  for (const text of [expanded, source]) {
    const owned = collectOwnedUnitAchievements(text);
    if (owned.length > 0) return { requirements: owned, origin: 'achievements' };
  }

  const requires = parseInfoboxField(source, 'requires');
  const floor = relicFloor(source);
  const targetStars = minimumStarsForRelic(floor) || 7;

  const requirements = mergeTierStarRequirements(
    [...requires.matchAll(/\[\[(.+?)\]\]/g)].map((match) => ({
      link: match[1],
      targetR: floor,
      targetStars
    })),
    source
  );

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
  lines.push('// Sources: swgoh-utils/gamedata (unit ids, event tiers) + swgoh.wiki (requirements).');
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
  const characterFactions = [];
  const shipFactions = [];

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
      alignment: unit.alignment,
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
      const wantsShips = linkLooksLikeShip(candidates);
      const capitalOnly = wantsShips && linkLooksLikeCapitalOnly(candidates);
      const members = (index.membersByCategory.get(faction.id) ?? []).filter((member) => {
        if (wantsShips) {
          if (member.isCharacter) return false;
          if (capitalOnly) return member.isCapital;
          return true;
        }
        return member.isCharacter;
      });

      if (members.length === 0) {
        warn(
          `"${title}": faction "${faction.label}" has no ${wantsShips ? (capitalOnly ? 'capital ships' : 'ships') : 'characters'}.`
        );
        continue;
      }

      const bucket = wantsShips ? shipFactions : characterFactions;
      if (!bucket.includes(faction.label)) bucket.push(faction.label);
      for (const member of members) {
        addUnit(member, requirement.targetR, requirement.targetStars);
      }
      continue;
    }

    if (!/capital ship|any /i.test(candidates.join(' '))) {
      warn(`"${title}": unresolved requirement "${candidates.join(' | ')}".`);
    }
  }

  if (characters.length === 0 && ships.length === 0) return null;

  const notes = [];
  if (characterFactions.length > 0) {
    notes.push(
      `Faction requirement — every eligible ${characterFactions.join(' / ')} unit is listed; ` +
        'you only need the squad size the event asks for.'
    );
  }
  if (shipFactions.length > 0) {
    notes.push(
      `Faction requirement — every eligible ${shipFactions.join(' / ')} ship is listed; ` +
        'you only need the fleet size the event asks for.'
    );
  }
  if (origin === 'achievements') {
    notes.push('Unlocked by owning these units outright — no relic quest chain.');
  }
  if (origin === 'entry') {
    notes.push('Targets come from the event entry requirements rather than a relic quest chain.');
  }

  const factions = [...new Set([...characterFactions, ...shipFactions])];
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

/**
 * Every event tier prints its entry conditions as coloured markup:
 *   [c][23C8F5]Required:[-][/c]\n- Boss Nass (Relic Level 5 or higher)\n
 *   [c][23C8F5]Borrowed:[-][/c]\n- R5-D4 (Era Level 135)\n
 */
function tierSections(text) {
  const sections = new Map();
  const parts = text.split(/\[c\]\[23C8F5\]\s*([^[\]]+?):\s*\[-\]\[\/c\]/);
  for (let i = 1; i < parts.length; i += 2) {
    const label = parts[i].trim();
    if (!sections.has(label)) sections.set(label, []);
    sections.get(label).push(parts[i + 1] ?? '');
  }
  return sections;
}

function tierLines(body) {
  return body
    .split(/\\n|\n/)
    .map((line) => line.replace(/\[[^\]]*\]/g, '').replace(/^[-•]\s*/, '').trim())
    .filter(Boolean);
}

/** "Cal Kestis (Gear XII+)" is one unit; "Bastila Shan (Fallen)" is another. */
function resolveTierUnit(line, index) {
  for (const candidate of [line, line.replace(/\s*\([^()]*\)\s*$/, '')]) {
    const hit = index.byName.get(normalize(candidate));
    if (hit) return hit;
  }
  return null;
}

/** A gate is stated either on the unit's own line or as a heading above it. */
function parseTierGate(line) {
  const relic = line.match(/relic\s*level\s*(\d+)/i);
  if (relic) {
    const targetR = Number(relic[1]);
    return { targetR, targetStars: minimumStarsForRelic(targetR) };
  }
  const stars = line.match(/(\d+)\s*-?\s*stars?/i);
  if (stars) return { targetR: 0, targetStars: Number(stars[1]) };
  return null;
}

/**
 * Neither list the game prints is trustworthy alone: the entry gate also allows
 * optional stand-ins the tier never asks for, so a unit is a farm target only
 * when the game both gates the tier on it and prints it under "Required".
 *
 * The "Borrowed" list is deliberately ignored. A tier can lend copies of a unit
 * it also requires — "The Price of Hope" lends two KX Security Droids on top of
 * the one the player has to bring — and units that are only ever lent never
 * reach the "Required" list in the first place.
 */
function readEventRequirements(node, rewardBaseId, index) {
  const named = new Map();
  const gated = new Set();

  for (const mission of node.campaignNodeMission ?? []) {
    const sections = tierSections(index.strings[mission.descKey] ?? '');

    for (const body of sections.get('Required') ?? []) {
      let heading = null;
      for (const line of tierLines(body)) {
        const unit = resolveTierUnit(line, index);
        if (!unit) {
          heading = parseTierGate(line) ?? heading;
          continue;
        }
        const target = parseTierGate(line) ?? heading ?? { targetR: 0, targetStars: 7 };
        const previous = named.get(unit.baseId);
        named.set(unit.baseId, {
          unit,
          targetR: Math.max(previous?.targetR ?? 0, target.targetR),
          targetStars: Math.max(previous?.targetStars ?? 0, target.targetStars)
        });
      }
    }

    // Only a per-unit "selftag_" gate names a specific unit; faction gates such
    // as affiliation_republic belong to the pool events the wiki covers.
    const gate = mission.entryCategoryAllowed;
    for (const tag of [...(gate?.categoryId ?? []), ...(gate?.commanderCategoryId ?? [])]) {
      if (!tag.startsWith('selftag_')) continue;
      for (const unit of index.membersByTag.get(tag) ?? []) gated.add(unit.baseId);
    }
    for (const mandatory of gate?.mandatoryRosterUnit ?? []) {
      if (mandatory.id) gated.add(mandatory.id);
    }
  }

  return [...named.values()].filter(
    ({ unit }) => unit.baseId !== rewardBaseId && gated.has(unit.baseId)
  );
}

function titleCase(value) {
  return value
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) =>
      i > 0 && TITLE_MINOR_WORDS.has(word) ? word : word.charAt(0).toUpperCase() + word.slice(1)
    )
    .join(' ');
}

/**
 * Builds a farm for an event the wiki has no page for, from the requirements
 * the game prints on the event's own tiers. Events won entirely with loaned
 * units produce nothing, because they have nothing to farm.
 */
function buildPhaseFromGameData({ entry, node, index, assets, isGalacticLegend }) {
  const reward = index.byBaseId.get(entry.unitBaseId);
  if (!reward) return null;

  const announced = ANNOUNCED_REQUIREMENTS[entry.unitBaseId];
  const requirements = announced
    ? announced.map((item) => ({
      unit: index.byBaseId.get(item.id),
      targetR: item.targetR,
      targetStars: minimumStarsForRelic(item.targetR) || 7
    }))
    : node
      ? readEventRequirements(node, entry.unitBaseId, index)
      : [];

  const resolved = requirements.filter((item) => item.unit);
  if (resolved.length === 0) return null;

  const characters = [];
  const ships = [];

  for (const { unit, targetR, targetStars } of resolved) {
    const icon = iconFor(unit, assets);
    if (!icon) warn(`Missing portrait for "${unit.name}" (${unit.baseId}).`);
    const record = {
      name: unit.name,
      id: unit.baseId,
      alignment: unit.alignment,
      targetR: unit.isCharacter ? targetR : 0,
      targetStars,
      icon
    };
    (unit.isCharacter ? characters : ships).push(record);
  }

  const rewardIcon = iconFor(reward, assets);
  if (!rewardIcon) warn(`Missing reward portrait for "${reward.name}" (${reward.baseId}).`);

  const title = index.strings[entry.titleKey];

  return {
    category: categoryLabel(reward, isGalacticLegend),
    event: title ? titleCase(title) : reward.name,
    note: announced
      ? 'Requirements come from the event announcement — the game only references its unlock quest by id.'
      : 'Requirements read from the event tiers in game, which is the only source for it so far.',
    reward: { name: reward.name, icon: rewardIcon },
    rewardBaseId: reward.baseId,
    isGalacticLegend,
    characters,
    ships
  };
}

async function main() {
  console.log('Fetching game data and wiki event list…');
  const [index, assets, guide, nodes, pages] = await Promise.all([
    buildGameIndex(),
    buildAssetIndex(),
    getJson(`${GAMEDATA}/unitGuideDefinition.json`),
    buildCampaignNodes(),
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

  // Nothing released since mid-2024 has a wiki page, so fall back to what the
  // game itself states on the event's tiers.
  const fromGameData = [];
  for (const entry of guideEntries) {
    if (entry.unitBaseId === 'TBA' || byReward.has(entry.unitBaseId)) continue;
    const ref = entry.campaignElementIdentifier ?? {};
    const phase = buildPhaseFromGameData({
      entry,
      node: nodes.get(`${ref.campaignId}:${ref.campaignMapId}:${ref.campaignNodeId}`),
      index,
      assets,
      isGalacticLegend: glBaseIds.has(entry.unitBaseId)
    });
    if (!phase) continue;
    byReward.set(entry.unitBaseId, phase);
    fromGameData.push(phase.event);
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

  if (fromGameData.length > 0) {
    console.log(`\nRead from the game instead of the wiki (${fromGameData.length}):`);
    fromGameData.forEach((title) => console.log(`  - ${title}`));
  }

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
