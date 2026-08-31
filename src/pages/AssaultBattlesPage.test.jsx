import { screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import AssaultBattlesPage from './AssaultBattlesPage';

describe('AssaultBattlesPage', () => {
  it('renders all events without requiring a roster', () => {
    renderWithTheme(<AssaultBattlesPage />);

    expect(screen.getByRole('heading', {
      name: /requirements, rewards, and teams for every tier/i
    })).toBeInTheDocument();
    expect(screen.getByText('Showing 9 of 9 events')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Forest Moon' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Peridea Patrol' })).toBeInTheDocument();
    expect(screen.getByText('Veers Imperial Troopers')).toBeInTheDocument();
    expect(screen.getByText('Grievous Separatist Droids')).toBeInTheDocument();
  });

  it('filters by faction and opens a selected fixed-team event', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AssaultBattlesPage />);

    await user.type(screen.getByLabelText(/search events or factions/i), 'Nightsister');
    expect(screen.getByText('Showing 1 of 9 events')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Secrets and Shadows' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'Forest Moon' })).not.toBeInTheDocument();

    await user.clear(screen.getByLabelText(/search events or factions/i));
    await user.selectOptions(
      screen.getByLabelText('Event'),
      'NODE_EVENT_ASSAULT_DUEL_OF_THE_FATES'
    );

    expect(screen.getByText('Showing 1 of 9 events')).toBeInTheDocument();
    expect(screen.getByText('Duel duo')).toBeInTheDocument();
    expect(screen.getByText(/fixed composition; tier vi requires relic 9/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /first-look strategy guide/i }))
      .toHaveAttribute('href', 'https://www.youtube.com/watch?v=a3lY5vzMFO0');
  });

  it('lays every tier out with its requirements, recommendations and rewards', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AssaultBattlesPage />);

    await user.selectOptions(
      screen.getByLabelText('Event'),
      'NODE_EVENT_ASSAULT_PERIDEA_PATROL'
    );

    const tierSix = screen.getByRole('heading', { name: 'Tier VI' }).closest('article');

    expect(within(tierSix).getByText('Relic')).toBeInTheDocument();
    expect(within(tierSix).getByText('9+')).toBeInTheDocument();
    expect(within(tierSix).getByText('Complete')).toBeInTheDocument();
    expect(within(tierSix).getByText('Tier V')).toBeInTheDocument();
    expect(within(tierSix).getByText('Zeta ability upgrades')).toBeInTheDocument();
    expect(within(tierSix).getByText('Guaranteed every run')).toBeInTheDocument();
    expect(within(tierSix).getByLabelText('Crystals: 100')).toBeInTheDocument();
    expect(within(tierSix).getByText('Either of the following')).toBeInTheDocument();
    expect(within(tierSix).getByText('1 attempt per day')).toBeInTheDocument();
    expect(within(tierSix).getByText('999')).toBeInTheDocument();
    expect(within(tierSix).getAllByAltText('Crystals')).toHaveLength(1);
    expect(within(tierSix).queryByText('Enemies')).not.toBeInTheDocument();

    // Requirement gates stay separate from the softer in-game recommendations.
    expect(screen.getAllByText('Requirements').length).toBe(6);
    expect(screen.getAllByText('Recommended').length).toBe(6);
  });

  it('flags inferred pool rules only on the tiers without a published rule', async () => {
    const user = userEvent.setup();
    renderWithTheme(<AssaultBattlesPage />);

    await user.selectOptions(screen.getByLabelText('Event'), 'NODE_EVENT_ASSAULT_EWOK');

    const tierOne = screen.getByRole('heading', { name: 'Tier I' }).closest('article');
    const bonusTier = screen.getByRole('heading', { name: 'Bonus Tier' }).closest('article');
    const challengeThree = screen
      .getByRole('heading', { name: 'Challenge Tier III' }).closest('article');

    expect(within(tierOne).queryByText(/follow the usual/i)).not.toBeInTheDocument();
    expect(within(tierOne).getByText('225')).toBeInTheDocument();
    expect(within(tierOne).getByText('500')).toBeInTheDocument();
    expect(within(tierOne).getAllByAltText('Crystals')).toHaveLength(4);
    expect(within(bonusTier).getByText('Cannot be refreshed with crystals.')).toBeInTheDocument();
    expect(within(challengeThree).getByText(/follow the usual/i)).toBeInTheDocument();
  });
});
