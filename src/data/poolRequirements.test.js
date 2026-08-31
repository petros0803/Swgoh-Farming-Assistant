import { allFarmsRoadmap } from './allFarmsRoadmap';
import {
  getDefaultPoolUnitIds,
  getFarmUnits,
  getPoolRequirement,
  POOL_REQUIREMENTS,
  sanitizePoolChoices
} from './poolRequirements';

const farmByEvent = new Map(allFarmsRoadmap.map((farm) => [farm.event, farm]));

describe('pool requirements', () => {
  it('names an event that exists and asks for fewer units than its pool holds', () => {
    Object.entries(POOL_REQUIREMENTS).forEach(([event, requirement]) => {
      const farm = farmByEvent.get(event);

      expect(farm, event).toBeDefined();
      expect(getFarmUnits(farm).length, event).toBeGreaterThan(requirement.count);
    });
  });

  it('has no requirement for a fixed-squad event', () => {
    expect(getPoolRequirement(farmByEvent.get('Star Forge Showdown'))).toBeNull();
    expect(getPoolRequirement(undefined)).toBeNull();
  });

  it('defaults to the community-recommended squad when one is published', () => {
    expect(getDefaultPoolUnitIds(farmByEvent.get('Contact Protocol'))).toEqual([
      'PAPLOO',
      'EWOKELDER',
      'WICKET',
      'LOGRAY',
      'CHIEFCHIRPA'
    ]);
  });

  it('defaults to the first eligible units when no squad is published', () => {
    const farm = farmByEvent.get('Pieces and Plans');
    const requirement = getPoolRequirement(farm);
    const defaults = getDefaultPoolUnitIds(farm);

    expect(defaults).toHaveLength(requirement.count);
    expect(defaults).toEqual(
      getFarmUnits(farm).slice(0, requirement.count).map((unit) => unit.id)
    );
  });

  it('drops ineligible or duplicated picks and caps the squad size', () => {
    const farm = farmByEvent.get('Contact Protocol');

    expect(sanitizePoolChoices(farm, ['TEEBO', 'VADER', 'TEEBO', 42])).toEqual(['TEEBO']);
    expect(
      sanitizePoolChoices(farm, [
        'TEEBO',
        'PAPLOO',
        'WICKET',
        'LOGRAY',
        'CHIEFCHIRPA',
        'EWOKSCOUT'
      ])
    ).toHaveLength(5);
    expect(sanitizePoolChoices(farm, 'TEEBO')).toEqual([]);
  });
});
