import { filterPhases, unitMatchesFilter } from './filters';

const vader = { name: 'Darth Vader', progress: { isComplete: true } };
const piett = { name: 'Admiral Piett', progress: { isComplete: false } };

const phases = [
  {
    index: 0,
    sections: [{ title: 'CHARACTERS', units: [vader, piett] }]
  },
  {
    index: 1,
    sections: [{ title: 'CHARACTERS', units: [{ name: 'Han Solo', progress: { isComplete: false } }] }]
  }
];

describe('unitMatchesFilter', () => {
  it('matches by name and can hide completed units', () => {
    expect(unitMatchesFilter(vader, 'vader', false)).toBe(true);
    expect(unitMatchesFilter(vader, 'vader', true)).toBe(false);
    expect(unitMatchesFilter(piett, 'vader', false)).toBe(false);
  });
});

describe('filterPhases', () => {
  it('hides empty sections and phases', () => {
    const result = filterPhases(phases, 'vader', false);
    expect(result.visibleTotal).toBe(1);
    expect(result.phases).toHaveLength(1);
    expect(result.phases[0].sections[0].units[0].name).toBe('Darth Vader');
  });
});
