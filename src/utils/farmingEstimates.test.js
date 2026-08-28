import { buildFarmingEstimate, sourceDetail } from './farmingEstimates';
import { currencyIcon } from '../data/alternateFarmingSources';
import { farmingSources } from '../data/farmingSources';

describe('buildFarmingEstimate', () => {
  it('estimates accelerated hard-node farms from current stars', () => {
    const estimate = buildFarmingEstimate('WICKET', 7, 5);

    expect(estimate.remainingShards).toBe(185);
    expect(estimate.estimatedDays).toBe(56);
    expect(estimate.sources[0]).toMatchObject({
      label: 'Dark Side 8-A',
      shardsPerDrop: 2,
      attemptsPerDay: 5
    });
  });

  it('marks low-appearance shipments as rare bottlenecks', () => {
    const estimate = buildFarmingEstimate('RAZORCREST', 7, 5);

    expect(estimate.ease).toBe('Rare rotation');
    expect(estimate.estimatedDays).toBeNull();
    expect(estimate.etaLabel).toBe('Depends on currency income');
  });

  it('treats a rare shipment on a unit that also has a node as upside', () => {
    // The Imperial TIE Bomber drops on Dark Side 5-A and also appears in the
    // Galactic War Store, so both sources are reported.
    const estimate = buildFarmingEstimate('TIEBOMBERIMPERIAL', 7, 5);
    const labels = estimate.sources.map((source) => source.label);

    expect(labels).toContain('Dark Side 5-A');
    expect(labels).toContain('Galactic War Store');

    // The node still drives the plan, so the rare store must not make this the
    // riskiest farm on the board.
    expect(estimate.estimatedDays).not.toBeNull();
    expect(estimate.ease).not.toBe('Rare rotation');
    expect(estimate.sourceRisk).toBeLessThan(
      buildFarmingEstimate('RAZORCREST', 7, 5).sourceRisk
    );
  });

  it('keeps the curated shipment details over the generated wiki entry', () => {
    const store = buildFarmingEstimate('TIEBOMBERIMPERIAL', 7, 5).sources.find(
      (source) => source.type === 'store'
    );

    expect(store.currency).toBe('Galactic War Tokens');
    expect(store.quantity).toBe(4);
    expect(store.cost).toBe(400);
    expect(store.appearance).toBe('Low');
    expect(currencyIcon(store)).toContain('/assets/currencies/galactic-war-token.png');
  });

  it('uses natural and bonus Cantina energy without assuming paid refreshes', () => {
    const estimate = buildFarmingEstimate('WAMPA', 7, 0);

    expect(estimate.sources[0].label).toBe('Cantina 9-A');
    expect(estimate.estimatedDays).toBe(62);
  });

  it('uses a prerequisite journey when no repeatable source exists', () => {
    const estimate = buildFarmingEstimate('C3POLEGENDARY', 7, 0, {
      event: 'Contact Protocol',
      reward: { name: 'C-3PO' }
    });

    expect(estimate.sources[0]).toMatchObject({
      type: 'event',
      label: 'Contact Protocol'
    });
    expect(estimate.etaLabel).toBe('Complete the prerequisite journey');
  });
});

describe('sourceDetail', () => {
  it('describes node and shipment costs', () => {
    expect(sourceDetail({
      type: 'hard-node',
      label: 'Dark Side 8-A',
      energy: 20,
      shardsPerDrop: 2,
      accelerated: true
    })).toContain('20 energy · 2 shards on a drop');
    expect(sourceDetail({
      type: 'store',
      label: 'Fleet Arena Store',
      quantity: 4,
      cost: 400,
      currency: 'Fleet Arena Tokens',
      appearance: 'Low'
    })).toContain('4 for 400 Fleet Arena Tokens · Low appearance');
  });
});

describe('generated store inventory', () => {
  const stores = Object.values(farmingSources)
    .flat()
    .filter((source) => source.type === 'store');

  it('has a price, quantity and currency for every store source', () => {
    expect(stores.length).toBeGreaterThan(0);
    stores.forEach((source) => {
      expect(source.offers?.length, source.label).toBeGreaterThan(0);
      source.offers.forEach((offer) => {
        expect(offer.quantity, `${source.label} quantity`).toBeGreaterThan(0);
        expect(offer.cost, `${source.label} cost`).toBeGreaterThan(0);
        expect(offer.currency, `${source.label} currency`).toBeTruthy();
      });
    });
  });

  it('has a local icon mapping for every currency used by a unit offer', () => {
    const currencies = new Set(
      stores.flatMap((source) => source.offers.map((offer) => offer.currency))
    );
    currencies.forEach((currency) => {
      expect(currencyIcon(currency), currency).toMatch(/assets\/currencies\/.+\.png$/);
    });
  });
});
