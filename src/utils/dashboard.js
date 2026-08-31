import { farmingRoadmap } from '../data/farmingRoadmap';
import { getPoolRequirement, sanitizePoolChoices } from '../data/poolRequirements';
import { getRecommendedSquad } from '../data/recommendedSquads';
import { evaluateUnit, percent } from './unitProgress';
import { buildSharedUnitMap, resolveBadge } from './sharedUnits';

export function buildRosterMap(playerData) {
  const rosterMap = {};
  if (playerData?.units) {
    playerData.units.forEach((u) => {
      rosterMap[u.data.base_id] = u.data;
    });
  }
  return rosterMap;
}

function mapSection(title, unitsList, context) {
  const { phase, phaseIndex, sharedMap, rosterMap, recommended, selectedIds } = context;
  if (!unitsList || unitsList.length === 0) return null;

  const visibleUnits = selectedIds
    ? unitsList.filter((target) => selectedIds.has(target.id))
    : unitsList;
  if (visibleUnits.length === 0) return null;

  const units = visibleUnits.map((target) => {
    const targetId = target.id ? target.id.toUpperCase() : '';
    const unit = rosterMap[targetId];
    return {
      id: targetId,
      name: target.name,
      target,
      progress: evaluateUnit(target, unit),
      badge: resolveBadge(phase, targetId, phaseIndex, sharedMap),
      recommended: Boolean(recommended?.ids.has(targetId)),
      portrait: target.icon || unit?.image || ''
    };
  });

  return { title, units };
}

export function buildDashboard(playerData, roadmap = farmingRoadmap) {
  const rosterMap = buildRosterMap(playerData);
  const sharedMap = buildSharedUnitMap(roadmap);

  let totalRequirements = 0;
  let totalMetRequirements = 0;

  const phases = roadmap.map((phase, phaseIndex) => {
    const recommended = getRecommendedSquad(phase);
    const poolRequirement = getPoolRequirement(phase);
    // A faction-pool phase lists every eligible unit, so the player's own squad
    // choice is what the table reports on. Without a choice the whole pool shows.
    const hasPoolChoice = poolRequirement && Array.isArray(phase.selectedUnitIds);
    const selectedIds = hasPoolChoice
      ? new Set(sanitizePoolChoices(phase, phase.selectedUnitIds))
      : null;
    const context = { phase, phaseIndex, sharedMap, rosterMap, recommended, selectedIds };
    const sections = [
      mapSection('👤 CHARACTERS', phase.characters, context),
      mapSection('🛸 SHIPS', phase.ships, context)
    ].filter(Boolean);

    const allUnits = sections.flatMap((section) => section.units);
    const met = allUnits.filter((unit) => unit.progress.isComplete).length;
    // An unfinished choice still counts against the full squad size, so a
    // half-picked event cannot read as complete.
    const total = hasPoolChoice ? poolRequirement.count : allUnits.length;
    totalRequirements += total;
    totalMetRequirements += met;

    return {
      index: phaseIndex,
      category: phase.category,
      note: phase.note ?? null,
      reward: phase.reward ?? null,
      recommendation: recommended
        ? {
          count: recommended.ids.size,
          source: recommended.source,
          sourceLabel: recommended.sourceLabel,
          caveat: recommended.caveat
        }
        : null,
      isC3po: phase.category.includes('C-3PO Event'),
      poolChoice: hasPoolChoice
        ? {
          count: poolRequirement.count,
          selectedCount: selectedIds.size,
          label: poolRequirement.label
        }
        : null,
      sections,
      met,
      total,
      percent: percent(met, total),
      done: total > 0 && allUnits.length === total && met === total
    };
  });

  return {
    playerName: playerData?.data?.name || 'Unknown',
    galacticPower: playerData?.data?.galactic_power || 0,
    phases,
    totalRequirements,
    totalMetRequirements,
    overallPct: percent(totalMetRequirements, totalRequirements)
  };
}
