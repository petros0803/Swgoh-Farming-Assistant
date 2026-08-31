/**
 * Downloads the reward artwork used by Assault Battles from the SWGOH Wiki.
 *
 * Files are stored locally so the app never hotlinks Wiki images at runtime.
 * Run with: npm run build:assault-icons
 */
import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { assaultBattles } from '../src/data/assaultBattles.js';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const OUT_DIR = path.join(ROOT, 'public', 'assets', 'reward-icons');
const WIKI_API = 'https://swgoh.wiki/api.php';
const BATCH_SIZE = 40;

const MOD_SET_NAMES = {
  1: 'Health',
  2: 'Offense',
  3: 'Defense',
  4: 'Speed',
  5: 'Critical Chance',
  6: 'Critical Damage',
  7: 'Potency',
  8: 'Tenacity'
};

const MOD_SLOT_NAMES = {
  2: 'Transmitter',
  3: 'Receiver',
  4: 'Processor',
  5: 'Holo-Array',
  6: 'Data-Bus',
  7: 'Multiplexer'
};

function fileStem(id) {
  return id.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function wikiTitle(value) {
  return `File:${value}`;
}

function titleKey(value) {
  return value.replace(/_/g, ' ').toLowerCase();
}

function rewardCandidates(reward, mysteryMods) {
  const name = reward.name.replace(/ (shards|blueprints)$/, '');

  if (reward.kind === 'character') {
    return [wikiTitle(`Unit-Character-${name}-portrait.png`)];
  }
  if (reward.kind === 'ship') {
    return [wikiTitle(`Unit-Ship-${name}-portrait.png`)];
  }
  if (reward.kind === 'mod') {
    const definition = mysteryMods.get(reward.id);
    const set = MOD_SET_NAMES[definition?.setId] ?? name.replace(/ mod$/, '');
    const grade = String.fromCharCode(64 + (definition?.minTier || 1));
    const slots = definition?.slot ?? [];

    if (slots.length === 1) {
      return [
        wikiTitle(`Mod-${set}-${MOD_SLOT_NAMES[slots[0]]}-${grade}.png`),
        wikiTitle(`Mod-Set-${set}.png`)
      ];
    }
    return [
      wikiTitle(`Mod-Mystery-${set}-${grade}.png`),
      wikiTitle(`Mod-Set-${set}.png`)
    ];
  }

  const wikiName = reward.name
    .replaceAll('A/KT', 'A-KT')
    .replace(/^Crystals$/, 'Crystal');
  return [
    wikiTitle(`Gear-${wikiName}.png`),
    wikiTitle(`Game-Icon-${wikiName}.png`)
  ];
}

async function resolveImages(rewards, mysteryMods) {
  const candidatesById = new Map(
    rewards.map((reward) => [reward.id, rewardCandidates(reward, mysteryMods)])
  );
  const allTitles = [...new Set([...candidatesById.values()].flat())];
  const imageByTitle = new Map();

  for (let index = 0; index < allTitles.length; index += BATCH_SIZE) {
    const params = new URLSearchParams({
      action: 'query',
      format: 'json',
      formatversion: '2',
      prop: 'imageinfo',
      iiprop: 'url',
      titles: allTitles.slice(index, index + BATCH_SIZE).join('|'),
      origin: '*'
    });
    const response = await fetch(`${WIKI_API}?${params}`);
    if (!response.ok) throw new Error(`Wiki API returned ${response.status}.`);
    const result = await response.json();

    for (const page of result.query?.pages ?? []) {
      const url = page.imageinfo?.[0]?.url;
      if (url) imageByTitle.set(titleKey(page.title), url);
    }
  }

  return rewards.map((reward) => {
    const title = candidatesById.get(reward.id)
      .find((candidate) => imageByTitle.has(titleKey(candidate)));
    if (!title) {
      throw new Error(`No SWGOH Wiki icon found for ${reward.id}: ${reward.name}.`);
    }
    return {
      id: reward.id,
      name: reward.name,
      source: imageByTitle.get(titleKey(title)),
      file: `${fileStem(reward.id)}.png`
    };
  });
}

async function downloadIcons(images) {
  const manifest = {};

  for (let index = 0; index < images.length; index += 10) {
    const batch = images.slice(index, index + 10);
    await Promise.all(batch.map(async (image) => {
      const response = await fetch(image.source);
      if (!response.ok) {
        throw new Error(`${response.status} while downloading ${image.source}.`);
      }
      const bytes = Buffer.from(await response.arrayBuffer());
      if (bytes[0] !== 0x89 || bytes.toString('ascii', 1, 4) !== 'PNG') {
        throw new Error(`${image.source} did not return a PNG.`);
      }
      await writeFile(path.join(OUT_DIR, image.file), bytes);
      manifest[image.id] = {
        name: image.name,
        file: image.file,
        source: image.source
      };
    }));
  }

  await writeFile(
    path.join(OUT_DIR, 'sources.json'),
    `${JSON.stringify(manifest, null, 2)}\n`,
    'utf8'
  );
}

async function main() {
  const mysteryStatMods = await fetch(
    'https://raw.githubusercontent.com/swgoh-utils/gamedata/main/mysteryStatMod.json'
  ).then((response) => response.json());
  const mysteryMods = new Map(
    (mysteryStatMods.data ?? mysteryStatMods).map((mod) => [mod.id, mod])
  );
  const rewards = [...new Map(
    assaultBattles
      .flatMap((event) => event.tiers)
      .flatMap((tier) => [
        ...tier.firstTimeRewards,
        ...tier.rewards.guaranteed,
        ...tier.rewards.groups.flatMap((group) => group.rewards)
      ])
      .map((reward) => [reward.id, reward])
  ).values()];

  await mkdir(OUT_DIR, { recursive: true });
  const images = await resolveImages(rewards, mysteryMods);
  await downloadIcons(images);
  console.log(`Downloaded ${images.length} reward icons to ${path.relative(ROOT, OUT_DIR)}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
