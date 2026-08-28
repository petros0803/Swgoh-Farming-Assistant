import {
  alternateFarmingSources,
  isRareAppearance,
  storeCurrency
} from '../data/alternateFarmingSources';
import { FARMING_SOURCE_META, farmingSources } from '../data/farmingSources';

const SHARDS_AT_STAR = [0, 10, 25, 50, 80, 145, 230, 330];

function nodeDailyShards(source) {
  const attempts = source.attemptsPerDay ??
    Math.floor(
      (FARMING_SOURCE_META.naturalCantinaEnergyPerDay +
        FARMING_SOURCE_META.bonusCantinaEnergyPerDay) /
      source.energy
    );
  return attempts * FARMING_SOURCE_META.shardDropChance * source.shardsPerDrop;
}

function estimateNodeDays(sources, remainingShards) {
  const limitedNodes = sources.filter((source) => source.attemptsPerDay);
  const cantinaNodes = sources.filter((source) => source.type === 'cantina-node');
  const limitedRate = limitedNodes.reduce((total, source) => total + nodeDailyShards(source), 0);
  const cantinaRate = Math.max(0, ...cantinaNodes.map(nodeDailyShards));
  const dailyShards = limitedRate + cantinaRate;

  return dailyShards > 0 ? Math.ceil(remainingShards / dailyShards) : null;
}

function easeOf(estimatedDays, sources) {
  if (estimatedDays !== null) {
    if (estimatedDays <= 30) return 'Quick';
    if (estimatedDays <= 60) return 'Medium';
    return 'Long';
  }
  if (sources.some(isRareAppearance)) return 'Rare rotation';
  if (sources.some((source) => source.type === 'store')) return 'Currency farm';
  if (sources.some((source) => source.type === 'journey')) return 'Journey unlock';
  return 'Source untracked';
}

/**
 * Shard ETAs are conservative because the roster API reports attained stars,
 * not shards already banked toward the next star. Relic/gear time is separate.
 */
export function buildFarmingEstimate(unitId, targetStars = 7, currentStars = 0, journey = null) {
  const combinedSources = [
    ...(farmingSources[unitId] ?? []),
    ...(alternateFarmingSources[unitId] ?? [])
  ];
  const bySource = new Map();
  combinedSources.forEach((source) => {
    const key = `${source.type}:${source.label}`;
    const existing = bySource.get(key);
    if (!existing) {
      bySource.set(key, source);
    } else if (existing.offers?.length && !source.offers?.length) {
      // Parsed store inventory carries every current price tier. Keep it as the
      // authority while allowing curated records to fill any missing fields.
      bySource.set(key, { ...source, ...existing });
    } else if (source.offers?.length || existing.communityListed) {
      bySource.set(key, source);
    }
  });
  const sources = [...bySource.values()];

  if (journey && sources.length === 0) {
    sources.push({
      type: 'journey',
      label: `${journey.event} → ${journey.reward.name}`
    });
  }

  const safeTarget = Math.max(0, Math.min(7, targetStars));
  const safeCurrent = Math.max(0, Math.min(7, currentStars));
  const remainingShards = Math.max(
    0,
    SHARDS_AT_STAR[safeTarget] - SHARDS_AT_STAR[Math.min(safeCurrent, safeTarget)]
  );
  const nodeSources = sources.filter((source) => source.type.endsWith('-node'));
  const estimatedDays =
    remainingShards > 0 && nodeSources.length > 0
      ? estimateNodeDays(nodeSources, remainingShards)
      : null;
  // A rare shipment is only a risk when nothing else is reliable. For a unit
  // that also has a daily node it is pure upside, so it must not outrank a
  // genuine bottleneck that has no node at all.
  const rareRotation = estimatedDays === null && sources.some(isRareAppearance);
  const sourceRisk =
    remainingShards === 0 ? 0 :
      rareRotation ? 9000 :
        estimatedDays === null ? 6500 :
          Math.min(6000, estimatedDays * 60);

  return {
    sources,
    remainingShards,
    estimatedDays,
    etaLabel:
      remainingShards === 0 ? 'Shard target met' :
        estimatedDays !== null ? `Up to ~${estimatedDays} days` :
          sources.some((source) => source.type === 'store') ? 'Depends on currency income' :
            journey ? 'Complete the prerequisite journey' : 'ETA unavailable',
    ease: easeOf(estimatedDays, sources),
    sourceRisk
  };
}

export function sourceDetail(source) {
  if (source.type.endsWith('-node')) {
    const rate = source.accelerated ? '2 shards on a drop' : '1 shard on a drop';
    return `${source.label} · ${source.energy} energy · ${rate}`;
  }
  if (source.type === 'store') {
    const currency = storeCurrency(source);
    const price = source.quantity && source.cost && currency
      ? ` · ${source.quantity} for ${source.cost} ${currency}`
      : currency && currency !== source.label
        ? ` · spends ${currency}`
        : ' · rotating inventory';
    return source.label + price + (source.appearance ? ` · ${source.appearance} appearance` : '');
  }
  return source.label;
}
