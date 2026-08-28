import { allFarmsRoadmap } from './allFarmsRoadmap';

function farm(event) {
  return allFarmsRoadmap.find((entry) => entry.event === event);
}

function unit(event, id) {
  const entry = farm(event);
  return [...entry.characters, ...entry.ships].find((candidate) => candidate.id === id);
}

describe('generated event requirements', () => {
  it('uses relic rarity gates when a Galactic Legend quest does not specify stars', () => {
    expect(unit('Rebel with a cause', 'WICKET')).toMatchObject({
      targetR: 3,
      targetStars: 5
    });
    expect(unit('Rebel with a cause', 'ADMINISTRATORLANDO')).toMatchObject({
      targetR: 5,
      targetStars: 6
    });
  });

  it('preserves explicit stars alongside relic requirements', () => {
    expect(unit('Luke Skywalker The Journey Continues', 'WAMPA')).toMatchObject({
      targetR: 3,
      targetStars: 7
    });
    expect(unit('The Force Unleashed', 'MARAJADE')).toMatchObject({
      targetR: 5,
      targetStars: 7
    });
  });

  it('applies tier star gates only to units named in those tiers', () => {
    expect(unit('Discarded Doctrine', 'DENGAR')).toMatchObject({
      targetR: 5,
      targetStars: 6
    });
    expect(unit('Discarded Doctrine', 'RAZORCREST')).toMatchObject({
      targetStars: 7
    });
    expect(unit('Beset on all Sides', 'APPO')).toMatchObject({
      targetR: 5,
      targetStars: 6
    });
    expect(unit('Beset on all Sides', 'OPERATIVE')).toMatchObject({
      targetR: 5,
      targetStars: 7
    });
  });
});
