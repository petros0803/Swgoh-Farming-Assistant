import { allFarmsRoadmap } from '../data/allFarmsRoadmap';
import { storeCurrency } from '../data/alternateFarmingSources';
import { isBountyHunterFleet } from '../data/factionPools';
import { lightspeedTokenCovers } from '../data/gameRules';
import { getRecommendedSquad } from '../data/recommendedSquads';
import { buildRosterMap } from './dashboard';
import { buildFarmingEstimate } from './farmingEstimates';
import { evaluateUnit } from './unitProgress';

const POOL_SIZES = {
  'Contact Protocol': 5,
  'One Famous Wookiee': 5,
  'Daring Droid': 5,
  'Flight of the Falcon': 4
};

function unitsOf(farm) {
  return [
    ...(farm.characters ?? []).map((unit) => ({ ...unit, kind: 'character' })),
    ...(farm.ships ?? []).map((unit) => ({ ...unit, kind: 'ship' }))
  ];
}

function normalizedName(value) {
  return value?.trim().toLowerCase() ?? '';
}

/**
 * Combines the same unit's requirements from different farms.
 *
 * Relic and star gates are maxed independently so neither is lost: Chief Chirpa
 * needs relic 3 for Leia and seven stars for the C-3PO event, and the merged
 * requirement has to carry both.
 */
function mergeTargets(current, candidate) {
  if (!current) return { ...candidate };

  return {
    ...current,
    targetR: Math.max(current.targetR ?? 0, candidate.targetR ?? 0),
    targetStars: Math.max(current.targetStars ?? 0, candidate.targetStars ?? 0)
  };
}

/**
 * Independent energy pools. The first open unit in each track is the refresh
 * priority, while limited hard nodes farther down can also be simmed each day
 * when that pool has spare energy.
 */
export const FARMING_TRACKS = [
  {
    id: 'fleet-node',
    label: 'Fleet energy',
    hint: 'Run beside every other track; prioritize the first open fleet node'
  },
  {
    id: 'hard-node',
    label: 'Light / Dark Side energy',
    hint: 'Sim the listed limited-attempt nodes daily, top priority first'
  },
  {
    id: 'cantina-node',
    label: 'Cantina energy',
    hint: 'One shared pool: finish these one at a time in this order'
  }
];

function laneOf(unit) {
  if (unit.kind === 'ship') return 'ship';
  return lightspeedTokenCovers(unit.kind, unit.target) ? 'token' : 'character';
}

/** Bounty Hunter ships open their goal's fleet block; other ships follow. */
function fleetRank(unit) {
  return unit.bountyHunterFleet ? 0 : 1;
}

/** Repeatable shard income: a node to battle or a shipment to buy from. */
function isFarmable(acquisition) {
  return acquisition.sources.some(
    (source) => source.type.endsWith('-node') || source.type === 'store'
  );
}

/**
 * Whether shards are still owed. A 7★ Scout Trooper who only lacks Leia's
 * relic 7 has no shards left to win, so spending energy on his node buys
 * nothing: that work belongs to gear and relic materials instead.
 */
function needsShards(unit) {
  return unit.acquisition.remainingShards > 0;
}

/** Rank inside a single lane: shard risk, reuse, progress, plus bottlenecks. */
function queueScore(unit) {
  return unit.priorityScore + unit.criticalFor.length * 3000;
}

function compareFarmPriority(a, b) {
  return (
    Number(a.progress.isComplete) - Number(b.progress.isComplete) ||
    a.goalRank - b.goalRank ||
    Number(a.lane === 'token') - Number(b.lane === 'token') ||
    fleetRank(a) - fleetRank(b) ||
    a.farmRank - b.farmRank ||
    queueScore(b) - queueScore(a) ||
    a.name.localeCompare(b.name)
  );
}

function farmIsPool(farm) {
  return Boolean(POOL_SIZES[farm.event]);
}

function buildRewardIdMap(farms) {
  const idsByName = new Map();
  farms.forEach((farm) => {
    unitsOf(farm).forEach((unit) => idsByName.set(normalizedName(unit.name), unit.id));
  });
  return idsByName;
}

function selectPoolUnits(farm, rosterMap, rootUseCount) {
  const limit = POOL_SIZES[farm.event];
  const recommended = getRecommendedSquad(farm);
  const recommendedOrder = new Map(
    (recommended?.units ?? []).map((id, index, units) => [id, units.length - index])
  );

  return unitsOf(farm)
    .map((unit) => {
      const progress = evaluateUnit(unit, rosterMap[unit.id]);
      const score =
        (rootUseCount.get(unit.id) ?? 0) * 10000 +
        (recommended?.ids.has(unit.id) ? 1000 : 0) +
        (recommendedOrder.get(unit.id) ?? 0) * 10 +
        progress.progressPct;

      return { unit, score };
    })
    .sort((a, b) => b.score - a.score || a.unit.name.localeCompare(b.unit.name))
    .slice(0, limit)
    .map(({ unit }) => unit);
}

function collectRootUseCount(roadmap) {
  const counts = new Map();

  roadmap.forEach((farm) => {
    if (farmIsPool(farm)) return;
    unitsOf(farm).forEach((unit) => {
      counts.set(unit.id, (counts.get(unit.id) ?? 0) + 1);
    });
  });

  return counts;
}

/**
 * Builds a dependency-complete, roster-aware guide for a roadmap.
 *
 * "Fastest" means: clear prerequisite journeys, reuse units across goals, pick
 * the closest faction-pool squad, and start the longest or least predictable
 * shard farms early. Node ETAs use current game data and documented assumptions.
 */
export function buildFarmingGuide(playerData, roadmap, catalog = allFarmsRoadmap) {
  const rosterMap = buildRosterMap(playerData);
  const rootUseCount = collectRootUseCount(roadmap);
  const catalogByEvent = new Map(catalog.map((farm) => [farm.event, farm]));
  const rewardIds = buildRewardIdMap([...catalog, ...roadmap]);
  const rewardFarmById = new Map();

  catalog.forEach((farm) => {
    const rewardId = rewardIds.get(normalizedName(farm.reward?.name));
    if (rewardId) rewardFarmById.set(rewardId, farm);
  });

  const rootEvents = roadmap.map((farm) => farm.event).filter(Boolean);
  const rootOrder = new Map(rootEvents.map((event, index) => [event, index]));
  const farms = new Map();
  const visiting = new Set();

  function addFarm(event, isRoot = false) {
    if (!event || visiting.has(event)) return;

    const roadmapFarm = roadmap.find((farm) => farm.event === event);
    const catalogFarm = catalogByEvent.get(event);
    // Preserve the Recommended Roadmap's intentional end-state targets (for
    // example Executor's R8 Boba). Open faction pools are the exception: use
    // the catalog's minimum event gate and select only the required squad.
    const source =
      isRoot && roadmapFarm && !farmIsPool(roadmapFarm)
        ? roadmapFarm
        : catalogFarm ?? roadmapFarm;
    if (!source) return;

    const existing = farms.get(event);
    if (existing) {
      existing.isRoot ||= isRoot;
      return;
    }

    visiting.add(event);
    const allUnits = unitsOf(source);
    const selected = farmIsPool(source)
      ? selectPoolUnits(source, rosterMap, rootUseCount)
      : allUnits;
    const selectedIds = new Set(selected.map((unit) => unit.id));

    const model = {
      event,
      category: source.category,
      reward: {
        ...source.reward,
        id: rewardIds.get(normalizedName(source.reward?.name)) ?? `reward:${event}`
      },
      isRoot,
      isPool: farmIsPool(source),
      poolSize: POOL_SIZES[event] ?? null,
      units: allUnits,
      selectedIds,
      dependencies: []
    };
    farms.set(event, model);

    selected.forEach((unit) => {
      const dependency = rewardFarmById.get(unit.id);
      if (!dependency || dependency.event === event) return;
      // Unlocked journeys stay on the map so the chain is always complete.
      // The "hide completed" toggle is what removes them from view.
      model.dependencies.push(dependency.event);
      addFarm(dependency.event, false);
    });

    model.dependencies = [...new Set(model.dependencies)];
    visiting.delete(event);
  }

  rootEvents.forEach((event) => addFarm(event, true));

  const depthMemo = new Map();
  function depthOf(event, stack = new Set()) {
    if (depthMemo.has(event)) return depthMemo.get(event);
    if (stack.has(event)) return 0;

    const nextStack = new Set(stack).add(event);
    const dependencyDepths = (farms.get(event)?.dependencies ?? []).map((dependency) =>
      depthOf(dependency, nextStack)
    );
    const depth = dependencyDepths.length ? Math.max(...dependencyDepths) + 1 : 0;
    depthMemo.set(event, depth);
    return depth;
  }

  // Which roadmap goal a farm belongs to. A prerequisite journey inherits the
  // earliest goal that consumes it, so Executor and everything feeding it come
  // before Jabba's chain instead of being interleaved by depth alone.
  const consumersByEvent = new Map();
  farms.forEach((farm) => {
    farm.dependencies.forEach((dependency) => {
      const consumers = consumersByEvent.get(dependency) ?? [];
      consumers.push(farm.event);
      consumersByEvent.set(dependency, consumers);
    });
  });

  const unplannedGoal = rootEvents.length;
  const goalMemo = new Map();
  function goalRankOf(event, stack = new Set()) {
    if (goalMemo.has(event)) return goalMemo.get(event);
    if (stack.has(event)) return unplannedGoal;

    const nextStack = new Set(stack).add(event);
    const ranks = (consumersByEvent.get(event) ?? []).map((consumer) =>
      goalRankOf(consumer, nextStack)
    );
    if (rootOrder.has(event)) ranks.push(rootOrder.get(event));

    const rank = ranks.length > 0 ? Math.min(...ranks) : unplannedGoal;
    goalMemo.set(event, rank);
    return rank;
  }

  const orderedFarms = [...farms.values()]
    .map((farm) => ({ ...farm, depth: depthOf(farm.event), goalRank: goalRankOf(farm.event) }))
    // Depth keeps prerequisites ahead of their consumers inside a goal, and a
    // dependency shared with an earlier goal is pulled forward with that goal.
    .sort((a, b) =>
      a.goalRank - b.goalRank ||
      a.depth - b.depth ||
      (rootOrder.get(a.event) ?? 999) - (rootOrder.get(b.event) ?? 999) ||
      a.category.localeCompare(b.category)
    );

  const farmRank = new Map(orderedFarms.map((farm, index) => [farm.event, index]));

  const unitModels = new Map();
  orderedFarms.forEach((farm) => {
    farm.units.forEach((target) => {
      const selected = farm.selectedIds.has(target.id);
      const current = unitModels.get(target.id) ?? {
        id: target.id,
        name: target.name,
        icon: target.icon,
        alignment: target.alignment,
        kind: target.kind,
        target: null,
        neededFor: [],
        alternativeFor: [],
        selected: false
      };

      if (selected) {
        current.selected = true;
        current.target = mergeTargets(current.target, target);
        current.neededFor.push(farm.event);
      } else {
        current.alternativeFor.push(farm.event);
      }
      unitModels.set(target.id, current);
    });
  });

  const units = [...unitModels.values()].map((unit) => {
    const progress = evaluateUnit(unit.target ?? { targetStars: 7 }, rosterMap[unit.id]);
    const leverage = unit.neededFor.length;
    const grantedBy = rewardFarmById.get(unit.id) ?? null;
    const acquisition = buildFarmingEstimate(
      unit.id,
      unit.target?.targetStars ?? 7,
      progress.currentStars,
      grantedBy
    );
    // A unit an event hands over is not a farm: Han's Millennium Falcon arrives
    // from the Bounty Hunter fleet that Executor already asks for. Its work sits
    // in that event's own requirements, so it is reported separately.
    const unlockEvent = grantedBy && !isFarmable(acquisition) ? grantedBy.event : null;
    // Ranks work inside a lane, so this only weighs shard risk, reuse and how
    // far along the unit already is. Lane and goal ordering happen in the sort.
    const priorityScore =
      acquisition.sourceRisk +
      leverage * 1800 +
      (100 - progress.progressPct);

    return {
      ...unit,
      neededFor: [...new Set(unit.neededFor)],
      alternativeFor: [...new Set(unit.alternativeFor)],
      progress,
      acquisition,
      criticalFor: [],
      lane: laneOf(unit),
      unlockEvent,
      bountyHunterFleet: isBountyHunterFleet(unit.kind, unit.id),
      goalRank: unplannedGoal,
      goalEvent: null,
      farmRank: Number.MAX_SAFE_INTEGER,
      priorityScore
    };
  });

  const unitById = new Map(units.map((unit) => [unit.id, unit]));

  // Farm readiness uses each farm's own targets, not the merged maximum, so an
  // event is not reported as open because a later farm wants more relics.
  const farmsWithProgress = orderedFarms.map((farm) => {
    // Each row carries the progress for *this* event's requirement. Princess
    // Kneesaa is done for the C-3PO event at seven stars even though Leia
    // separately wants relic 7 from her.
    const unitRows = farm.units.map((unit) => ({
      ...unit,
      selected: farm.selectedIds.has(unit.id),
      progress: evaluateUnit(unit, rosterMap[unit.id])
    }));

    const selected = unitRows.filter((unit) => unit.selected);
    const readyCount = selected.filter((unit) => unit.progress.isComplete).length;
    const requirementsReady = selected.length > 0 && readyCount === selected.length;
    const rewardOwned = Boolean(rosterMap[farm.reward.id]);

    // Unlocking is not the same as meeting the level a later farm asks for: an
    // owned 6-star Millennium Falcon still needs a seventh star for JKL.
    const rewardUnit = unitById.get(farm.reward.id);
    const rewardShortfall =
      rewardOwned && rewardUnit?.selected && !rewardUnit.progress.isComplete
        ? rewardUnit.progress.statusText
        : null;

    return {
      ...farm,
      units: unitRows,
      readyCount,
      selectedCount: selected.length,
      rewardOwned,
      rewardShortfall,
      // A prerequisite journey exists only to grant its reward, so owning the
      // unit finishes it. Roadmap targets also carry end-state relic goals, so
      // they stay open until those targets are met too.
      isComplete: farm.isRoot ? rewardOwned && requirementsReady : rewardOwned,
      readyToRun: !rewardOwned && requirementsReady
    };
  });

  const farmByEvent = new Map(farmsWithProgress.map((farm) => [farm.event, farm]));

  // A journey finishes when its slowest parallel requirement finishes. Mark
  // that critical path so a nearly-finished easy unit cannot outrank the real
  // calendar bottleneck.
  farmsWithProgress.filter((farm) => !farm.isComplete).forEach((farm) => {
    const openUnits = [...farm.selectedIds]
      .map((id) => unitById.get(id))
      // An event unlock has no shard clock of its own, so the bottleneck it
      // hides lives in that event's requirements instead.
      .filter((unit) => unit && !unit.progress.isComplete && !unit.unlockEvent);
    const highestRisk = Math.max(0, ...openUnits.map((unit) => unit.acquisition.sourceRisk));

    openUnits
      .filter((unit) => highestRisk > 0 && unit.acquisition.sourceRisk === highestRisk)
      .forEach((unit) => unit.criticalFor.push(farm.event));
  });

  // Place every unit against the earliest goal that still needs it. Work for a
  // finished event no longer pulls a unit forward.
  units.forEach((unit) => {
    const openFarms = unit.neededFor.filter((event) => !farmByEvent.get(event)?.isComplete);
    const scope = openFarms.length > 0 ? openFarms : unit.neededFor;
    const scopedFarms = scope.map((event) => farmByEvent.get(event)).filter(Boolean);
    if (scopedFarms.length === 0) return;

    unit.goalRank = Math.min(...scopedFarms.map((farm) => farm.goalRank));
    unit.farmRank = Math.min(...scopedFarms.map((farm) => farmRank.get(farm.event) ?? 0));
    unit.goalEvent = rootEvents[unit.goalRank] ?? scopedFarms[0].event;
  });

  // A unit whose every consumer is finished is not work any more, so the Empire
  // squad behind an already-unlocked R2-D2 drops out of the plan.
  const openWork = units
    .filter((unit) => unit.selected)
    .filter((unit) => unit.neededFor.some((event) => !farmByEvent.get(event)?.isComplete));

  const queue = openWork
    .filter((unit) => !unit.unlockEvent)
    // Preserve roadmap goal order. Token-coverable units are only deferred
    // inside their own goal: assuming an unowned token must never delay an
    // earlier unlock behind a later roadmap phase.
    .sort(compareFarmPriority);

  // Only units that still owe shards compete for energy and currency.
  const shardQueue = queue.filter(needsShards);

  const nodeTracks = FARMING_TRACKS.map((track) => ({
    ...track,
    entries: shardQueue
      .map((unit) => ({
        unit,
        sources: unit.acquisition.sources.filter((source) => source.type === track.id)
      }))
      .filter((entry) => entry.sources.length > 0)
  })).filter((track) => track.entries.length > 0);

  // Each store has its own inventory and currency, so it is its own budget. A
  // unit can appear in both an energy track and a store track because buying
  // its shipment accelerates the node farm rather than replacing it.
  const storeTracksByLabel = new Map();
  shardQueue.forEach((unit) => {
    unit.acquisition.sources
      .filter((source) => source.type === 'store')
      .forEach((source) => {
        const id = `store:${source.label}`;
        const currency = storeCurrency(source);
        const track = storeTracksByLabel.get(id) ?? {
          id,
          label: source.label,
          hint: currency && currency !== source.label
            ? `Spend ${currency} on the first listed unit`
            : 'Spend this store on the first listed unit',
          entriesByUnit: new Map()
        };
        const entry = track.entriesByUnit.get(unit.id) ?? { unit, sources: [] };
        entry.sources.push(source);
        track.entriesByUnit.set(unit.id, entry);
        storeTracksByLabel.set(id, track);
      });
  });
  const storeTracks = [...storeTracksByLabel.values()]
    .map(({ entriesByUnit, ...track }) => ({
      ...track,
      entries: [...entriesByUnit.values()].sort((a, b) =>
        compareFarmPriority(a.unit, b.unit)
      )
    }))
    .sort((a, b) => a.label.localeCompare(b.label));

  const untrackedEntries = shardQueue
    .filter((unit) => !isFarmable(unit.acquisition))
    .map((unit) => ({ unit, sources: unit.acquisition.sources }));
  const farmingTracks = [
    ...nodeTracks,
    ...storeTracks,
    ...(untrackedEntries.length > 0
      ? [{
          id: 'untracked',
          label: 'Other / untracked acquisition',
          hint: 'Check event availability before investing gear',
          entries: untrackedEntries
        }]
      : [])
  ];

  // Owned at the required stars but short of a relic or gear gate. No shard
  // source can move these, so they are reported apart from the energy tracks.
  const gearWork = queue
    .filter((unit) => !needsShards(unit) && !unit.progress.isComplete)
    .sort(compareFarmPriority);

  // Rewards of events already on the plan. They cost no energy of their own, so
  // they are listed as outcomes rather than competing for a farming slot.
  const eventUnlocks = openWork
    .filter((unit) => unit.unlockEvent)
    .sort((a, b) =>
      Number(a.progress.isComplete) - Number(b.progress.isComplete) ||
      a.goalRank - b.goalRank ||
      a.farmRank - b.farmRank ||
      a.name.localeCompare(b.name)
    );

  const connections = farmsWithProgress.flatMap((farm) => [
    ...[...farm.selectedIds].map((unitId) => ({
      from: unitId,
      to: farm.reward.id,
      type: 'requires',
      event: farm.event
    })),
    ...farm.dependencies.map((event) => ({
      from: farmByEvent.get(event)?.reward.id,
      to: farm.reward.id,
      type: 'unlocks',
      event
    }))
  ]).filter((connection) => connection.from);

  return {
    farms: farmsWithProgress,
    units,
    unitById,
    farmByEvent,
    queue,
    farmingTracks,
    gearWork,
    eventUnlocks,
    connections,
    // Readiness covers the whole plan, farms and event unlocks alike.
    completedCount: openWork.filter((unit) => unit.progress.isComplete).length,
    totalCount: openWork.length,
    completedFarmCount: farmsWithProgress.filter((farm) => farm.isComplete).length,
    rootEvents
  };
}

