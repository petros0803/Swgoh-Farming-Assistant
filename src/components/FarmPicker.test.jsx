import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import FarmPicker from './FarmPicker';
import { allFarmsRoadmap } from '../data/allFarmsRoadmap';
import { renderWithTheme } from '../test/renderWithTheme';

function renderPicker({ farms = allFarmsRoadmap, value = '', onChange = () => {} } = {}) {
  return renderWithTheme(<FarmPicker farms={farms} value={value} onChange={onChange} />);
}

function optionNames() {
  return within(screen.getByRole('listbox', { name: 'Farms' }))
    .getAllByRole('option')
    .map((option) => option.textContent);
}

async function open(user) {
  await user.click(screen.getByRole('button', { name: 'Choose a farm' }));
}

describe('FarmPicker', () => {
  it('lists every farm alphabetically by the character it unlocks', async () => {
    const user = userEvent.setup();
    renderPicker();
    await open(user);

    const names = within(screen.getByRole('listbox', { name: 'Farms' }))
      .getAllByRole('option')
      .map((option) => option.querySelector('span > span')?.textContent);

    expect(names).toHaveLength(allFarmsRoadmap.length);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });

  it('shows the reward portrait, event and requirement hint for a faction pool', async () => {
    const user = userEvent.setup();
    renderPicker();
    await open(user);

    const option = within(screen.getByRole('listbox', { name: 'Farms' }))
      .getAllByRole('option')
      .find((candidate) => candidate.textContent.includes('Contact Protocol'));

    expect(option).toHaveTextContent('C-3PO');
    expect(option).toHaveTextContent('Pick 5 Ewoks');
    expect(option.querySelector('img')).toHaveAttribute('src', expect.stringContaining('C-3PO'));
  });

  it('filters on the character name, the event name and the category', async () => {
    const user = userEvent.setup();
    renderPicker();
    await open(user);

    const search = screen.getByRole('combobox', { name: 'Choose a farm' });

    await user.type(search, 'chirpa');
    expect(screen.getByText(/No farm matches/)).toBeInTheDocument();

    await user.clear(search);
    await user.type(search, 'contact protocol');
    expect(optionNames()).toHaveLength(1);

    await user.clear(search);
    await user.type(search, 'fleet unlock');
    expect(optionNames().length).toBeGreaterThan(1);
  });

  it('reports the chosen farm and shows it on the closed trigger', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    const { unmount } = renderPicker({ onChange });
    await open(user);

    await user.type(screen.getByRole('combobox', { name: 'Choose a farm' }), 'C-3PO');
    await user.click(within(screen.getByRole('listbox', { name: 'Farms' })).getAllByRole('option')[0]);

    expect(onChange).toHaveBeenCalledWith('Contact Protocol');
    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();

    unmount();
    renderPicker({ value: 'Contact Protocol' });
    const trigger = screen.getByRole('button', { name: 'Choose a farm' });

    expect(trigger).toHaveTextContent('C-3PO');
    expect(trigger).toHaveTextContent('Contact Protocol');
  });

  it('moves through the list and picks with the keyboard', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ onChange });
    await open(user);

    await user.type(screen.getByRole('combobox', { name: 'Choose a farm' }), 'pool');
    const [first, second] = optionNames();

    expect(second).toBeDefined();

    await user.keyboard('{ArrowDown}{Enter}');

    expect(onChange).toHaveBeenCalledTimes(1);
    expect(second).toContain(onChange.mock.calls[0][0]);
    expect(first).not.toContain(onChange.mock.calls[0][0]);
  });

  it('closes on Escape without choosing anything', async () => {
    const user = userEvent.setup();
    const onChange = vi.fn();
    renderPicker({ onChange });
    await open(user);

    await user.keyboard('{Escape}');

    expect(screen.queryByRole('listbox')).not.toBeInTheDocument();
    expect(onChange).not.toHaveBeenCalled();
    expect(screen.getByRole('button', { name: 'Choose a farm' })).toHaveFocus();
  });

  it('disables itself once every farm is on the roadmap', () => {
    renderPicker({ farms: [] });

    const trigger = screen.getByRole('button', { name: 'Choose a farm' });
    expect(trigger).toBeDisabled();
    expect(trigger).toHaveTextContent('All farms are already on your roadmap');
  });
});
