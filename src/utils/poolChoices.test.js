import { allFarmsRoadmap } from '../data/allFarmsRoadmap';
import { buildDashboard } from './dashboard';
import { buildFarmingGuide } from './farmingGuide';

const contactProtocol = allFarmsRoadmap.find((farm) => farm.event === 'Contact Protocol');
const chosenSquad = ['TEEBO', 'PRINCESSKNEESAA', 'EWOKSCOUT', 'PAPLOO', 'LOGRAY'];

function roadmapWith(selectedUnitIds) {
  return [{ ...contactProtocol, selectedUnitIds }];
}

describe('player-picked faction-pool squads', () => {
  const emptyRoster = { data: { name: 'Test' }, units: [] };

  it('lists only the chosen units in the roadmap table', () => {
    const dashboard = buildDashboard(emptyRoster, roadmapWith(chosenSquad));
    const [phase] = dashboard.phases;
    const names = phase.sections.flatMap((section) => section.units.map((unit) => unit.id));

    expect(names.sort()).toEqual([...chosenSquad].sort());
    expect(phase.total).toBe(5);
    expect(phase.poolChoice).toEqual({
      count: 5,
      selectedCount: 5,
      label: 'Ewoks'
    });
  });

  it('counts the full squad size while a choice is incomplete', () => {
    const roster = {
      data: { name: 'Test' },
      units: [{ data: { base_id: 'TEEBO', rarity: 7, relic_tier: 0, gear_level: 12 } }]
    };
    const [phase] = buildDashboard(roster, roadmapWith(['TEEBO', 'PAPLOO'])).phases;

    expect(phase.met).toBe(1);
    expect(phase.total).toBe(5);
    expect(phase.percent).toBe(20);
    expect(phase.done).toBe(false);
  });

  it('shows the whole pool when the player has made no choice', () => {
    const [phase] = buildDashboard(emptyRoster, [contactProtocol]).phases;

    expect(phase.poolChoice).toBeNull();
    expect(phase.total).toBe(contactProtocol.characters.length);
  });

  it('farms the chosen units in the guide instead of the automatic squad', () => {
    const guide = buildFarmingGuide(emptyRoster, roadmapWith(chosenSquad));
    const farm = guide.farmByEvent.get('Contact Protocol');

    expect([...farm.selectedIds].sort()).toEqual([...chosenSquad].sort());
    expect(farm.poolChoiceIsUserPicked).toBe(true);
    expect(guide.queue.map((unit) => unit.id).sort()).toEqual([...chosenSquad].sort());
    expect(guide.unitById.get('CHIEFCHIRPA').selected).toBe(false);
  });

  it('keeps an event open until the squad is fully picked', () => {
    const roster = {
      data: { name: 'Test' },
      units: ['TEEBO', 'PAPLOO'].map((id) => ({
        data: { base_id: id, rarity: 7, relic_tier: 0, gear_level: 12 }
      }))
    };
    const farm = buildFarmingGuide(roster, roadmapWith(['TEEBO', 'PAPLOO']))
      .farmByEvent.get('Contact Protocol');

    expect(farm.readyCount).toBe(2);
    expect(farm.selectedCount).toBe(2);
    expect(farm.readyToRun).toBe(false);
  });

  it('falls back to the automatic squad when no choice is stored', () => {
    const farm = buildFarmingGuide(emptyRoster, [contactProtocol])
      .farmByEvent.get('Contact Protocol');

    expect(farm.selectedIds.size).toBe(5);
    expect(farm.poolChoiceIsUserPicked).toBe(false);
  });
});
