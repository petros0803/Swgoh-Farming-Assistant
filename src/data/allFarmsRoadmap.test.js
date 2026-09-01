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

  it('uses live gamedata ids for the newer Journey Guide farms', () => {
    expect(unit('Jedi Knight Cal Kestis', 'MERRIN')).toMatchObject({
      alignment: 'dark',
      targetStars: 7
    });
    expect(unit('Bombad General', 'BOOMADIER')).toMatchObject({
      targetR: 5,
      targetStars: 6
    });
    expect(unit('The Price of Hope', 'DEDRAMEERO')).toMatchObject({
      targetR: 6,
      alignment: 'dark'
    });
    expect(unit('Web of Hate', 'VADERDUELSEND')).toMatchObject({
      targetR: 6,
      id: 'VADERDUELSEND'
    });
    expect(unit('One Must Destroy in Order to Create', 'SHINHATI')).toMatchObject({
      targetR: 7
    });
  });

  it('lists all five Relic 7 characters the Baylan Skoll event asks for', () => {
    expect(farm('One Must Destroy in Order to Create').characters.map((c) => c.id)).toEqual([
      'SHINHATI',
      'MARROK',
      'MORGANELSBETH',
      'GRANDADMIRALTHRAWN',
      'GREATMOTHERS'
    ]);
  });

  // "The Price of Hope" lends two extra KX Security Droids on top of the one it
  // requires, so being on the loan list cannot disqualify a unit on its own.
  it('keeps a required unit the event also lends copies of', () => {
    expect(unit('The Price of Hope', 'KXSECURITYDROID')).toMatchObject({
      targetR: 6,
      targetStars: 7
    });
  });

  // Rotta the Hutt and Darth Jar Jar unlock through fully loaned squads, so
  // there is nothing to farm for them.
  it('leaves out events that are won with loaned units', () => {
    const rewards = allFarmsRoadmap.map((entry) => entry.reward.name);
    expect(rewards).not.toContain('Rotta the Hutt');
    expect(rewards).not.toContain('Darth Jar Jar');
  });
});
