import { filterPhases, phaseMatchesQuery, unitMatchesFilter } from './filters';

const vader = { name: 'Darth Vader', progress: { isComplete: true } };
const piett = { name: 'Admiral Piett', progress: { isComplete: false } };

const phases = [
  {
    index: 0,
    category: '👑 Galactic Legend: Lord Vader',
    reward: { name: 'Lord Vader' },
    sections: [{ title: 'CHARACTERS', units: [vader, piett] }]
  },
  {
    index: 1,
    category: '⭐ Journey: Jar Jar Binks',
    reward: { name: 'Jar Jar Binks' },
    sections: [{ title: 'CHARACTERS', units: [{ name: 'Boss Nass', progress: { isComplete: false } }] }]
  }
];

describe('phaseMatchesQuery', () => {
  it('matches the journey by category or reward and ignores its units', () => {
    expect(phaseMatchesQuery(phases[0], 'lord vader')).toBe(true);
    expect(phaseMatchesQuery(phases[0], 'galactic legend')).toBe(true);
    expect(phaseMatchesQuery(phases[1], 'boss nass')).toBe(false);
    expect(phaseMatchesQuery(phases[1], '')).toBe(true);
  });
});

describe('unitMatchesFilter', () => {
  it('only drops units that are already done', () => {
    expect(unitMatchesFilter(vader, false)).toBe(true);
    expect(unitMatchesFilter(vader, true)).toBe(false);
    expect(unitMatchesFilter(piett, true)).toBe(true);
  });
});

describe('filterPhases', () => {
  it('keeps every unit of a matching journey', () => {
    const result = filterPhases(phases, 'vader', false);
    expect(result.phases).toHaveLength(1);
    expect(result.phases[0].sections[0].units.map((unit) => unit.name)).toEqual([
      'Darth Vader',
      'Admiral Piett'
    ]);
    expect(result.visibleTotal).toBe(2);
  });

  it('does not match a journey through the units inside it', () => {
    expect(filterPhases(phases, 'piett', false).phases).toHaveLength(0);
  });

  it('hides sections and phases left empty by "hide completed"', () => {
    const result = filterPhases([phases[0]], 'vader', true);
    expect(result.phases[0].sections[0].units.map((unit) => unit.name)).toEqual(['Admiral Piett']);
    expect(filterPhases([{ ...phases[0], sections: [{ title: 'C', units: [vader] }] }], '', true)
      .phases).toHaveLength(0);
  });
});
