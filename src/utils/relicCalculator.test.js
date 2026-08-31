import { describe, expect, it } from 'vitest';
import {
  addMaterialCounts,
  buildRosterCharacters,
  calculateJourneyPlan,
  calculateRelicPlan,
  materialRows
} from './relicCalculator';

describe('relic calculator', () => {
  it('breaks a relic upgrade into levels and totals', () => {
    const plan = calculateRelicPlan(3, 5);

    expect(plan.levels.map(({ level }) => level)).toEqual([4, 5]);
    expect(plan.totals).toMatchObject({
      credits: 175000,
      fragmentedSignalData: 40,
      incompleteSignalData: 50,
      flawedSignalData: 15,
      carboniteCircuitBoard: 60,
      chromiumTransistor: 70
    });
  });

  it('returns no costs when the target is already met', () => {
    expect(calculateRelicPlan(7, 5)).toEqual({
      currentLevel: 7,
      targetLevel: 7,
      levels: [],
      totals: {}
    });
  });

  it('supports all Relic 10 materials', () => {
    const plan = calculateRelicPlan(9, 10);

    expect(plan.totals).toMatchObject({
      credits: 2000000,
      corruptedSignalData: 15,
      coaxialServomotor: 20
    });
  });

  it('adds sparse material maps and displays them in catalog order', () => {
    const totals = addMaterialCounts(
      { credits: 10, flawedSignalData: 2 },
      { credits: 15, carboniteCircuitBoard: 3 }
    );

    expect(totals).toEqual({ credits: 25, flawedSignalData: 2, carboniteCircuitBoard: 3 });
    expect(materialRows(totals).map(({ id }) => id)).toEqual([
      'credits',
      'carboniteCircuitBoard',
      'flawedSignalData'
    ]);
  });

  it('normalizes and sorts roster characters', () => {
    const roster = {
      units: [
        { data: { base_id: 'B', name: 'Beta', combat_type: 1, relic_tier: 7, gear_level: 13 } },
        { data: { base_id: 'SHIP', name: 'Ship', combat_type: 2, relic_tier: 0 } },
        { data: { base_id: 'A', combat_type: 1, relic_tier: 2, gear_level: 12 } }
      ]
    };

    expect(buildRosterCharacters(roster, [{ id: 'A', name: 'Alpha', icon: 'alpha.png' }]))
      .toMatchObject([
        { id: 'A', name: 'Alpha', currentRelic: 0, icon: 'alpha.png' },
        { id: 'B', name: 'Beta', currentRelic: 5 }
      ]);
  });

  it('aggregates journey requirements from each roster starting point', () => {
    const journey = {
      characters: [
        { id: 'A', name: 'Alpha', targetR: 5 },
        { id: 'B', name: 'Beta', targetR: 3 },
        { id: 'C', name: 'No relic gate' }
      ]
    };
    const roster = {
      units: [{ data: { base_id: 'A', relic_tier: 5 } }]
    };

    const result = calculateJourneyPlan(journey, roster);

    expect(result.characters.map(({ currentRelic, targetR }) => [currentRelic, targetR]))
      .toEqual([[3, 5], [0, 3]]);
    expect(result.totals.credits).toBe(260000);
  });
});
