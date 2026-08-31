import { MAX_RELIC_LEVEL, RELIC_COST_BY_LEVEL, RELIC_MATERIALS } from '../data/relicMaterials';
import { relicLevel } from './unitProgress';

export function addMaterialCounts(...counts) {
  return counts.reduce((total, entries) => {
    Object.entries(entries || {}).forEach(([id, amount]) => {
      total[id] = (total[id] || 0) + amount;
    });
    return total;
  }, {});
}

export function calculateRelicPlan(currentLevel, targetLevel) {
  const current = Math.max(0, Math.min(MAX_RELIC_LEVEL, Number(currentLevel) || 0));
  const target = Math.max(current, Math.min(MAX_RELIC_LEVEL, Number(targetLevel) || 0));
  const levels = [];

  for (let level = current + 1; level <= target; level += 1) {
    levels.push({ level, materials: { ...RELIC_COST_BY_LEVEL[level] } });
  }

  return {
    currentLevel: current,
    targetLevel: target,
    levels,
    totals: addMaterialCounts(...levels.map((entry) => entry.materials))
  };
}

export function materialRows(counts) {
  return RELIC_MATERIALS
    .filter((material) => counts?.[material.id] > 0)
    .map((material) => ({ ...material, amount: counts[material.id] }));
}

export function buildRosterCharacters(roster, catalog = []) {
  const catalogById = new Map(catalog.map((character) => [character.id, character]));

  return (roster?.units || [])
    .map((entry) => entry.data || entry)
    .filter((unit) => unit?.combat_type !== 2)
    .map((unit) => {
      const known = catalogById.get(unit.base_id) || {};
      return {
        id: unit.base_id,
        name: unit.name || known.name || unit.base_id,
        icon: unit.image || unit.avatar_url || known.icon || '',
        currentRelic: relicLevel(unit),
        gearLevel: unit.gear_level || 0,
        rarity: unit.rarity || 0,
        unit
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name));
}

export function calculateJourneyPlan(journey, roster) {
  const rosterById = new Map(
    (roster?.units || []).map((entry) => {
      const unit = entry.data || entry;
      return [unit.base_id, unit];
    })
  );

  const characters = (journey?.characters || [])
    .filter((character) => (character.targetR || 0) > 0)
    .map((character) => {
      const unit = rosterById.get(character.id);
      const currentRelic = relicLevel(unit);
      return {
        ...character,
        currentRelic,
        plan: calculateRelicPlan(currentRelic, character.targetR)
      };
    });

  return {
    characters,
    totals: addMaterialCounts(...characters.map((character) => character.plan.totals))
  };
}
