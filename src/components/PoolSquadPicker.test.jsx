import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PoolSquadPicker from './PoolSquadPicker';
import { allFarmsRoadmap } from '../data/allFarmsRoadmap';
import { getFarmUnits, getPoolRequirement } from '../data/poolRequirements';
import { renderWithTheme } from '../test/renderWithTheme';

function renderPicker(event, selectedUnitIds = [], onToggle = () => {}) {
  const farm = allFarmsRoadmap.find((candidate) => candidate.event === event);

  return renderWithTheme(
    <PoolSquadPicker
      units={getFarmUnits(farm)}
      requirement={getPoolRequirement(farm)}
      rewardName={farm.reward.name}
      selectedUnitIds={selectedUnitIds}
      onToggle={onToggle}
    />
  );
}

describe('PoolSquadPicker', () => {
  it('reports how many units of the squad are still unchosen', () => {
    renderPicker('Contact Protocol', ['TEEBO', 'PAPLOO']);

    expect(screen.getByRole('group', { name: /choose 5 ewoks for c-3po/i })).toBeInTheDocument();
    expect(screen.getByText('2 / 5 selected')).toBeInTheDocument();
    expect(screen.getByLabelText('Teebo')).toBeChecked();
    expect(screen.getByLabelText('Wicket')).toBeEnabled();
  });

  it('locks the remaining units once the squad is full', () => {
    renderPicker('Contact Protocol', [
      'TEEBO',
      'PAPLOO',
      'LOGRAY',
      'WICKET',
      'CHIEFCHIRPA'
    ]);

    expect(screen.getByLabelText('Ewok Scout')).toBeDisabled();
    expect(screen.getByLabelText('Teebo')).toBeEnabled();
  });

  it('reports the toggled unit to its owner', async () => {
    const user = userEvent.setup();
    const onToggle = vi.fn();
    renderPicker('Contact Protocol', ['TEEBO'], onToggle);

    await user.click(screen.getByLabelText('Logray'));

    expect(onToggle).toHaveBeenCalledWith('LOGRAY');
  });

  it('filters a long pool so a small squad stays pickable', async () => {
    const user = userEvent.setup();
    // Empire lists dozens of eligible units, which is unusable unfiltered.
    renderPicker('Daring Droid');

    const filter = screen.getByRole('searchbox');
    await user.type(filter, 'thrawn');

    expect(screen.getByLabelText('Grand Admiral Thrawn')).toBeInTheDocument();
    expect(screen.queryByLabelText('Stormtrooper')).not.toBeInTheDocument();

    await user.clear(filter);
    await user.type(filter, 'nobody');

    expect(screen.getByText(/No eligible unit matches/)).toBeInTheDocument();
  });

  it('leaves a short pool without a filter box', () => {
    renderPicker('Contact Protocol');

    expect(screen.queryByRole('searchbox')).not.toBeInTheDocument();
  });
});
