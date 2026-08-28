import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FarmingGuide from './FarmingGuide';
import { farmingRoadmap } from '../data/farmingRoadmap';
import { buildFarmingGuide } from '../utils/farmingGuide';
import { renderWithTheme } from '../test/renderWithTheme';

const emptyRoster = { data: { name: 'Test' }, units: [] };

function renderGuide(roster = emptyRoster) {
  return renderWithTheme(<FarmingGuide guide={buildFarmingGuide(roster, farmingRoadmap)} />);
}

function farmingOrderCard(name) {
  const cantina = screen.getByRole('heading', { name: 'Cantina energy' }).closest('section');
  return within(cantina).getAllByText(name)[0].closest('li');
}

async function openMap(user) {
  await user.click(screen.getByRole('tab', { name: /interactive dependency map/i }));
}

/** Currency icons are the only labelled images; portraits are decorative. */
const CURRENCY_ICON = 'img[alt]:not([alt=""])';

function priceRows(scope) {
  return [...scope.querySelectorAll('li')].filter((row) => row.querySelector(CURRENCY_ICON));
}

describe('FarmingGuide', () => {
  it('keeps a card\'s shipment prices on a single row', () => {
    renderGuide();

    // The TIE Fighter Pilot sells in three stores at once, which used to render
    // as three stacked rows of one pill each.
    const rows = priceRows(farmingOrderCard('TIE Fighter Pilot'));

    expect(rows).toHaveLength(1);
    expect(rows[0].querySelectorAll(CURRENCY_ICON).length).toBeGreaterThan(1);
  });

  it('never splits one source list into several price rows', () => {
    renderGuide();

    const rows = new Set(
      screen.getAllByRole('img')
        .filter((image) => image.getAttribute('alt'))
        .map((image) => image.closest('li'))
    );

    expect(rows.size).toBeGreaterThan(0);
    rows.forEach((row) => {
      expect(priceRows(row.parentElement)).toHaveLength(1);
    });
  });

  it('links each price to the store selling it', () => {
    renderGuide();

    const stores = [...priceRows(farmingOrderCard('TIE Fighter Pilot'))[0].querySelectorAll('a')];

    expect(stores.length).toBeGreaterThan(1);
    expect(new Set(stores.map((store) => store.getAttribute('href'))).size).toBe(stores.length);
    stores.forEach((store) => {
      expect(store.querySelector(CURRENCY_ICON)?.getAttribute('src')).toMatch(
        /assets\/currencies\/.+\.png$/
      );
    });
  });

  it('reports the relic held and the relic owed once stars are done', () => {
    // Seven stars but no relics, against Leia's relic 7 gate. Gear is short of
    // 13 too, so relics cannot even be applied yet.
    renderGuide({
      data: { name: 'Test' },
      units: [{ data: { base_id: 'SCOUTTROOPER_V3', rarity: 7, relic_tier: 2, gear_level: 12 } }]
    });

    const section = screen.getByRole('heading', { name: /stars already done/i })
      .closest('section');
    const card = within(section).getByText('Scout Trooper').closest('li');

    expect(card).toHaveTextContent('7★ owned');
    expect(card).toHaveTextContent('Relic 0 / 7');
    expect(card).toHaveTextContent('7 levels to go');
    expect(card).toHaveTextContent('Gear 12 / 13');
    expect(card).toHaveTextContent('relics unlock at G13');
  });

  it('drops the gear gate once a unit can already take relics', () => {
    renderGuide({
      data: { name: 'Test' },
      units: [{ data: { base_id: 'SCOUTTROOPER_V3', rarity: 7, relic_tier: 8, gear_level: 13 } }]
    });

    const section = screen.getByRole('heading', { name: /stars already done/i })
      .closest('section');
    const card = within(section).getByText('Scout Trooper').closest('li');

    expect(card).toHaveTextContent('Relic 6 / 7');
    expect(card).toHaveTextContent('1 level to go');
    expect(card).not.toHaveTextContent('relics unlock at G13');
  });

  it('previews the farming card when hovering a unit on the dependency map', async () => {
    const user = userEvent.setup();
    renderGuide();

    const expected = farmingOrderCard('TIE Fighter Pilot').textContent;
    await openMap(user);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();

    const node = screen.getAllByRole('button', { name: /TIE Fighter Pilot/ })[0];
    await user.hover(node);

    const preview = screen.getByRole('tooltip');

    // The node it drops from, its shipment prices and its ETA all carry over.
    expect(preview).toHaveTextContent('TIE Fighter Pilot');
    expect(preview).toHaveTextContent(/Cantina 4-B · 10 energy/);
    expect(preview).toHaveTextContent(/shards left/);
    expect(priceRows(preview)).toHaveLength(1);
    // The map is per event, so the preview names the gate this event asks for.
    expect(preview).toHaveTextContent(/needs \d★/);

    // Same wording as the farming order card, minus the event-specific note.
    expect(expected).toContain(preview.querySelector('a').textContent);

    await user.unhover(node);
    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });

  it('previews a unit the map lists only as an optional alternative', async () => {
    const user = userEvent.setup();
    // Unselected pool units have no goal of their own, so the card has to fall
    // back to the events they could stand in for instead of rendering a blank.
    const alternative = buildFarmingGuide(emptyRoster, farmingRoadmap)
      .units.find((unit) => !unit.selected);

    renderGuide();
    await openMap(user);
    await user.hover(screen.getAllByRole('button', { name: alternative.name })[0]);

    const preview = screen.getByRole('tooltip');

    expect(preview).toHaveTextContent(`Alternative for: `);
    expect(preview).toHaveTextContent('optional faction-pool alternative');
  });

  it('keeps a ready unit\'s preview opaque over the map', async () => {
    const user = userEvent.setup();
    // A ready card tints its background rather than filling it, which left the
    // floating preview see-through.
    const roster = {
      data: { name: 'Test' },
      units: [{ data: { base_id: 'ADMIRALPIETT', rarity: 7, relic_tier: 10, gear_level: 13 } }]
    };

    renderGuide(roster);
    await openMap(user);
    await user.hover(screen.getAllByRole('button', { name: /Admiral Piett/ })[0]);

    const preview = screen.getByRole('tooltip');
    const { backgroundColor } = getComputedStyle(preview);

    expect(preview).toHaveTextContent('Ready');
    expect(backgroundColor).toMatch(/^rgb\(/);
  });

  it('closes the preview when leaving the dependency map', async () => {
    const user = userEvent.setup();
    renderGuide();
    await openMap(user);

    await user.hover(screen.getAllByRole('button', { name: /TIE Fighter Pilot/ })[0]);
    expect(screen.getByRole('tooltip')).toBeInTheDocument();

    await user.click(screen.getByRole('tab', { name: /farming order/i }));
    await openMap(user);

    expect(screen.queryByRole('tooltip')).not.toBeInTheDocument();
  });
});
