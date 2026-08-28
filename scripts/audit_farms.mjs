/**
 * Audits the roadmap data files against swgoh-utils/gamedata.
 *
 * Reports, per farm:
 *   - unit ids that do not exist in the game
 *   - unit ids whose stored name disagrees with the game name
 *   - duplicate units inside one farm
 *   - characters listed as ships and vice versa
 *   - faction-pool farms whose listed roster no longer matches the live faction
 *
 * Also diffs the hand-maintained farmingRoadmap.js against the generated
 * allFarmsRoadmap.js for the events they have in common.
 *
 * Run with: node scripts/audit_farms.mjs
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import { brotliDecompress } from 'node:zlib';
import { promisify } from 'node:util';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const brotli = promisify(brotliDecompress);

const GAMEDATA = 'https://raw.githubusercontent.com/swgoh-utils/gamedata/main';
const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const TMP = path.join(ROOT, '.audit-tmp');

const ALIGNMENTS = { 1: 'neutral', 2: 'light', 3: 'dark' };
const FACTION_PREFIXES = /^(affiliation|species|profession)_/;

function normalize(value) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '');
}

async function getBrotliJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  const buffer = Buffer.from(await res.arrayBuffer());
  return JSON.parse((await brotli(buffer)).toString('utf8'));
}

async function getJson(url) {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`${res.status} ${url}`);
  return res.json();
}

/** The data files reference import.meta.env, so stub it before importing. */
async function loadRoadmap(file, exportName) {
  const source = await readFile(path.join(ROOT, 'src', 'data', file), 'utf8');
  const patched = source.replace(/import\.meta\.env\.BASE_URL/g, '""');
  const out = path.join(TMP, file);
  await writeFile(out, patched, 'utf8');
  const mod = await import(`file://${out.replace(/\\/g, '/')}`);
  return mod[exportName];
}

async function buildGameIndex() {
  const [units, loc, categories] = await Promise.all([
    getBrotliJson(`${GAMEDATA}/units.json.br`),
    getBrotliJson(`${GAMEDATA}/Loc_ENG_US.txt.json.br`),
    getJson(`${GAMEDATA}/category.json`)
  ]);

  const strings = loc.data ?? loc;
  const byBaseId = new Map();
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
      isCharacter: unit.combatType === 1,
      categories: unit.categoryId ?? []
    };
    byBaseId.set(baseId, entry);

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

  return { byBaseId, factionByName, membersByCategory };
}

const problems = [];
function report(farm, kind, detail) {
  problems.push({ farm, kind, detail });
}

function auditFarm(farm, index, { source }) {
  const label = `[${source}] ${farm.category}`;
  const seen = new Map();

  for (const [listName, list] of [
    ['characters', farm.characters ?? []],
    ['ships', farm.ships ?? []]
  ]) {
    for (const unit of list) {
      const game = index.byBaseId.get(unit.id);

      if (!game) {
        report(label, 'UNKNOWN ID', `${listName}: "${unit.name}" (${unit.id}) does not exist in game data`);
        continue;
      }

      if (normalize(game.name) !== normalize(unit.name)) {
        report(
          label,
          'NAME/ID MISMATCH',
          `${listName}: stored as "${unit.name}" but ${unit.id} is "${game.name}"`
        );
      }

      const expected = game.isCharacter ? 'characters' : 'ships';
      if (expected !== listName) {
        report(label, 'WRONG LIST', `"${unit.name}" (${unit.id}) is a ${expected.slice(0, -1)} but sits in ${listName}`);
      }

      if (!unit.alignment) {
        report(label, 'ALIGNMENT', `"${unit.name}" (${unit.id}) is missing alignment`);
      } else if (game.alignment !== unit.alignment) {
        report(
          label,
          'ALIGNMENT',
          `"${unit.name}" (${unit.id}) stored as ${unit.alignment}, game says ${game.alignment}`
        );
      }

      if (seen.has(unit.id)) {
        report(label, 'DUPLICATE', `"${unit.name}" (${unit.id}) listed twice`);
      }
      seen.set(unit.id, unit);
    }
  }

  // Faction-pool farms should list the full current faction roster for the
  // combat type the event actually gates on (characters vs ships).
  const poolMatch = farm.category.match(/\(([^)]+) pool\)/);
  if (poolMatch) {
    const faction =
      index.factionByName.get(normalize(poolMatch[1])) ??
      index.factionByName.get(normalize(poolMatch[1].replace(/s$/, '')));

    if (faction) {
      const note = farm.note ?? '';
      const checkCharacters = /eligible .+ unit is listed/i.test(note);
      const checkShips = /eligible .+ ship is listed/i.test(note);
      const kinds = [];
      if (checkCharacters) kinds.push({ isCharacter: true, listed: farm.characters ?? [], noun: faction.label });
      if (checkShips) kinds.push({ isCharacter: false, listed: farm.ships ?? [], noun: `${faction.label} ships` });
      if (kinds.length === 0) {
        kinds.push({ isCharacter: true, listed: farm.characters ?? [], noun: faction.label });
      }

      for (const kind of kinds) {
        const live = (index.membersByCategory.get(faction.id) ?? []).filter((u) =>
          kind.isCharacter ? u.isCharacter : !u.isCharacter
        );
        const liveIds = new Set(live.map((u) => u.baseId));
        const listedIds = new Set(kind.listed.map((u) => u.id));

        const missing = live.filter((u) => !listedIds.has(u.baseId));
        const extra = kind.listed.filter((u) => !liveIds.has(u.id));

        if (missing.length > 0) {
          report(
            label,
            'POOL MISSING',
            `${missing.length} ${kind.noun} not listed: ${missing.map((u) => `${u.name} (${u.baseId})`).join(', ')}`
          );
        }
        if (extra.length > 0) {
          report(
            label,
            'POOL EXTRA',
            `${extra.length} listed but not ${kind.noun}: ${extra.map((u) => `${u.name} (${u.id})`).join(', ')}`
          );
        }
      }
    } else {
      report(label, 'POOL UNRESOLVED', `could not resolve faction "${poolMatch[1]}"`);
    }
  }
}

/** Match a personal-roadmap phase to the generated farm for the same reward. */
function rewardKey(farm) {
  return normalize(farm.reward?.name ?? '');
}

function diffAgainstGenerated(personal, generated) {
  const byReward = new Map(generated.map((farm) => [rewardKey(farm), farm]));
  const lines = [];

  for (const mine of personal) {
    const theirs = byReward.get(rewardKey(mine));
    if (!theirs) {
      lines.push(`\n  ${mine.category}\n    no generated farm for reward "${mine.reward?.name}" — cannot cross-check`);
      continue;
    }

    const flat = (farm) => [
      ...(farm.characters ?? []).map((u) => ({ ...u, kind: 'char' })),
      ...(farm.ships ?? []).map((u) => ({ ...u, kind: 'ship' }))
    ];

    const mineUnits = new Map(flat(mine).map((u) => [u.id, u]));
    const theirUnits = new Map(flat(theirs).map((u) => [u.id, u]));

    const missing = [...theirUnits.values()].filter((u) => !mineUnits.has(u.id));
    const extra = [...mineUnits.values()].filter((u) => !theirUnits.has(u.id));
    const targetDiffs = [];

    for (const [id, mineUnit] of mineUnits) {
      const theirUnit = theirUnits.get(id);
      if (!theirUnit) continue;
      const mr = mineUnit.targetR ?? 0;
      const tr = theirUnit.targetR ?? 0;
      if (mr !== tr || mineUnit.targetStars !== theirUnit.targetStars) {
        targetDiffs.push(
          `${mineUnit.name}: yours R${mr}/${mineUnit.targetStars}★ vs event R${tr}/${theirUnit.targetStars}★`
        );
      }
    }

    if (missing.length === 0 && extra.length === 0 && targetDiffs.length === 0) continue;

    lines.push(`\n  ${mine.category}   (vs "${theirs.event}")`);
    if (missing.length > 0) {
      lines.push(`    MISSING ${missing.length}: ${missing.map((u) => `${u.name} (${u.id})`).join(', ')}`);
    }
    if (extra.length > 0) {
      lines.push(`    EXTRA ${extra.length}: ${extra.map((u) => `${u.name} (${u.id})`).join(', ')}`);
    }
    for (const diff of targetDiffs) {
      lines.push(`    TARGET  ${diff}`);
    }
  }

  return lines;
}

async function main() {
  await mkdir(TMP, { recursive: true });

  console.log('Fetching game data…');
  const [index, personal, generated] = await Promise.all([
    buildGameIndex(),
    loadRoadmap('farmingRoadmap.js', 'farmingRoadmap'),
    loadRoadmap('allFarmsRoadmap.js', 'allFarmsRoadmap')
  ]);

  console.log(`Game data: ${index.byBaseId.size} units, ${index.factionByName.size} factions\n`);
  console.log(`Auditing ${personal.length} personal phases and ${generated.length} generated farms…`);

  for (const farm of personal) auditFarm(farm, index, { source: 'personal' });
  for (const farm of generated) auditFarm(farm, index, { source: 'all-farms' });

  console.log('\n' + '='.repeat(78));
  console.log('DATA INTEGRITY PROBLEMS');
  console.log('='.repeat(78));

  if (problems.length === 0) {
    console.log('None.');
  } else {
    const byFarm = new Map();
    for (const p of problems) {
      if (!byFarm.has(p.farm)) byFarm.set(p.farm, []);
      byFarm.get(p.farm).push(p);
    }
    for (const [farm, list] of byFarm) {
      console.log(`\n  ${farm}`);
      for (const p of list) console.log(`    ${p.kind.padEnd(18)} ${p.detail}`);
    }
    console.log(`\n  Total: ${problems.length} problems across ${byFarm.size} farms.`);
  }

  console.log('\n' + '='.repeat(78));
  console.log('PERSONAL ROADMAP vs ACTUAL EVENT REQUIREMENTS');
  console.log('='.repeat(78));
  const diff = diffAgainstGenerated(personal, generated);
  console.log(diff.length === 0 ? 'Identical.' : diff.join('\n'));

  await rm(TMP, { recursive: true, force: true });
}

main().catch(async (err) => {
  console.error(err);
  await rm(TMP, { recursive: true, force: true });
  process.exit(1);
});
