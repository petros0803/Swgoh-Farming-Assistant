import { farmingRoadmap } from '../data/farmingRoadmap';
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

function mapSection(title, unitsList, phase, phaseIndex, sharedMap, rosterMap) {
  if (!unitsList || unitsList.length === 0) return null;

  const units = unitsList.map((target) => {
    const targetId = target.id ? target.id.toUpperCase() : '';
    const unit = rosterMap[targetId];
    return {
      id: targetId,
      name: target.name,
      target,
      progress: evaluateUnit(target, unit),
      badge: resolveBadge(phase, targetId, phaseIndex, sharedMap),
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
    const sections = [
      mapSection('👤 CHARACTERS', phase.characters, phase, phaseIndex, sharedMap, rosterMap),
      mapSection('🛸 SHIPS', phase.ships, phase, phaseIndex, sharedMap, rosterMap)
    ].filter(Boolean);

    const allUnits = sections.flatMap((section) => section.units);
    const met = allUnits.filter((unit) => unit.progress.isComplete).length;
    totalRequirements += allUnits.length;
    totalMetRequirements += met;

    return {
      index: phaseIndex,
      category: phase.category,
      isC3po: phase.category.includes('C-3PO Event'),
      sections,
      met,
      total: allUnits.length,
      percent: percent(met, allUnits.length),
      done: allUnits.length > 0 && met === allUnits.length
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
