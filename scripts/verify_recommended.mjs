/**
 * Checks src/data/recommendedSquads.js against the roadmap data.
 *
 * The squads are curated by hand from swgoh.wiki prose, so this guards the two
 * ways that file can silently rot: an event key that no longer exists, and a
 * unit id that is not actually part of that farm.
 *
 * Run with: node scripts/verify_recommended.mjs
 */

import { readFile, writeFile, mkdir, rm } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const TMP = path.join(ROOT, '.recommended-tmp');

/** The data files reference import.meta.env, so stub it before importing. */
async function load(file, exportName) {
  const source = await readFile(path.join(ROOT, 'src', 'data', file), 'utf8');
  const out = path.join(TMP, file);
  await writeFile(out, source.replace(/import\.meta\.env\.BASE_URL/g, '""'), 'utf8');
  const mod = await import(`file://${out.replace(/\\/g, '/')}`);
  return mod[exportName];
}

await mkdir(TMP, { recursive: true });

const [allFarms, personal, squads] = await Promise.all([
  load('allFarmsRoadmap.js', 'allFarmsRoadmap'),
  load('farmingRoadmap.js', 'farmingRoadmap'),
  load('recommendedSquads.js', 'recommendedSquads')
]);

const farmsByEvent = new Map();
for (const farm of [...allFarms, ...personal]) {
  if (!farm.event) continue;
  if (!farmsByEvent.has(farm.event)) farmsByEvent.set(farm.event, []);
  farmsByEvent.get(farm.event).push(farm);
}

const problems = [];

for (const [event, entry] of Object.entries(squads)) {
  const farms = farmsByEvent.get(event);

  if (!farms) {
    problems.push(`"${event}": no farm uses this event key.`);
    continue;
  }

  if (!entry.source || !entry.sourceLabel) {
    problems.push(`"${event}": missing source attribution.`);
  }

  if (new Set(entry.units).size !== entry.units.length) {
    problems.push(`"${event}": duplicate unit ids.`);
  }

  for (const farm of farms) {
    const listed = new Set(
      [...(farm.characters ?? []), ...(farm.ships ?? [])].map((unit) => unit.id)
    );
    const missing = entry.units.filter((id) => !listed.has(id));

    if (missing.length > 0) {
      problems.push(
        `"${event}" (${farm.category}): recommended units not in this farm: ${missing.join(', ')}`
      );
    }
  }

  const names = farms[0];
  const lookup = new Map(
    [...(names.characters ?? []), ...(names.ships ?? [])].map((unit) => [unit.id, unit.name])
  );
  console.log(`${event}`);
  console.log(`  ${entry.units.length} units: ${entry.units.map((id) => lookup.get(id) ?? id).join(', ')}`);
  console.log(`  source: ${entry.sourceLabel} <${entry.source}>`);
  console.log(`  applies to ${farms.length} farm(s): ${farms.map((f) => f.category).join(' | ')}`);
  if (entry.caveat) console.log(`  caveat: ${entry.caveat}`);
  console.log();
}

const poolFarms = allFarms.filter((farm) => / pool\)/.test(farm.category));
const uncovered = poolFarms.filter((farm) => !squads[farm.event]);

console.log('='.repeat(70));
if (problems.length === 0) {
  console.log(`OK — ${Object.keys(squads).length} curated squads all resolve.`);
} else {
  console.log(`${problems.length} problem(s):`);
  problems.forEach((message) => console.log(`  ! ${message}`));
}

console.log(`\nPool farms with no published recommendation (${uncovered.length}/${poolFarms.length}):`);
uncovered.forEach((farm) => {
  const size = (farm.characters?.length ?? 0) + (farm.ships?.length ?? 0);
  console.log(`  - ${farm.category} — ${size} units listed`);
});

await rm(TMP, { recursive: true, force: true });
process.exit(problems.length === 0 ? 0 : 1);
