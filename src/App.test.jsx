import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import App from './App';
import { THEME_IDS, THEME_STORAGE_KEY } from './theme';

const playerPayload = {
  data: { name: 'Bogdan', galactic_power: 9123456 },
  units: [
    { data: { base_id: 'ADMIRALPIETT', rarity: 7, relic_tier: 10, gear_level: 13 } }
  ]
};

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', import.meta.env.BASE_URL);
    window.localStorage.clear();
    globalThis.fetch = vi.fn(async () => ({
      ok: true,
      json: async () => playerPayload
    }));
  });

  it('syncs a roster and shows dashboard stats', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Ally Code'), '123456789');
    await user.click(screen.getByRole('button', { name: /sync roster/i }));

    await waitFor(() => {
      expect(screen.getByText('Bogdan')).toBeInTheDocument();
    });

    expect(screen.getByText('9,123,456')).toBeInTheDocument();
    expect(screen.getByText('Admiral Piett')).toBeInTheDocument();
    expect(screen.getByPlaceholderText('Filter units by name…')).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recommended Farming Guide' })).toBeInTheDocument();
  });

  it('opens the interactive dependency map on the recommended roadmap', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Ally Code'), '123456789');
    await user.click(screen.getByRole('button', { name: /sync roster/i }));

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Recommended Farming Guide' })).toBeInTheDocument();
    });

    await user.click(screen.getByRole('tab', { name: /interactive dependency map/i }));

    expect(screen.getByRole('heading', { name: /everything connected/i })).toBeInTheDocument();

    // Completed events are hidden from the start, and the control stays usable
    // even when nothing is complete yet.
    const hideButton = screen.getByRole('button', { name: /show completed events/i });
    expect(hideButton).toBeEnabled();
    expect(hideButton).toHaveAttribute('aria-pressed', 'true');

    // Admiral Piett is ready in the fixture, so hiding completed units drops his
    // pill from the map without touching the roadmap cards further down.
    const guide = screen.getByRole('region', { name: 'Recommended Farming Guide' });

    expect(within(guide).getAllByText('Admiral Piett').length).toBeGreaterThan(0);
    await user.click(screen.getByRole('button', { name: /hide completed units/i }));
    expect(within(guide).queryAllByText('Admiral Piett')).toHaveLength(0);

    await user.click(screen.getByRole('button', { name: /show completed units/i }));
    expect(within(guide).getAllByText('Admiral Piett').length).toBeGreaterThan(0);

    expect(screen.getByText("Luke Skywalker Hero's Journey")).toBeInTheDocument();
    expect(screen.getByText('Personalized fast squad: 5 selected from 44 eligible units.'))
      .toBeInTheDocument();
  });

  it('shows every requirement without importing a roster', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /show requirements without a roster/i }));

    expect(screen.getByText('No roster imported')).toBeInTheDocument();
    expect(screen.getByText(/every requirement is listed as if you owned nothing/i)).toBeInTheDocument();
    expect(screen.getByText(/sync your ally code to track your own progress/i)).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Recommended Farming Guide' })).toBeInTheDocument();

    // Nothing is owned, so the counters read empty and Piett — the one unit the
    // fixture would have completed — is still listed as a farm.
    expect(screen.getByText('Units Ready').parentElement.textContent).toMatch(/Units Ready0 \/ \d+/);
    expect(screen.getAllByText('Admiral Piett').length).toBeGreaterThan(0);
    expect(globalThis.fetch).not.toHaveBeenCalled();
  });

  it('swaps between the synced roster and the roster-free preview', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Ally Code'), '123456789');
    await user.click(screen.getByRole('button', { name: /sync roster/i }));

    await waitFor(() => {
      expect(screen.getByText('Bogdan')).toBeInTheDocument();
    });

    const toggle = screen.getByLabelText('Browse without a roster');
    expect(toggle).not.toBeChecked();

    await user.click(toggle);

    expect(screen.queryByText('Bogdan')).not.toBeInTheDocument();
    expect(screen.getByText('No roster imported')).toBeInTheDocument();
    expect(screen.getByText(/untick .browse without a roster./i)).toBeInTheDocument();

    await user.click(toggle);

    expect(screen.getByText('Bogdan')).toBeInTheDocument();
    expect(screen.queryByText('No roster imported')).not.toBeInTheDocument();
  });

  it('drops the preview once a roster is synced', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('button', { name: /show requirements without a roster/i }));
    await user.type(screen.getByLabelText('Ally Code'), '123456789');
    await user.click(screen.getByRole('button', { name: /sync roster/i }));

    await waitFor(() => {
      expect(screen.getByText('Bogdan')).toBeInTheDocument();
    });

    expect(screen.getByLabelText('Browse without a roster')).not.toBeChecked();
  });

  it('loads a saved ally code from the header dropdown into the URL and search', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText('Saved ally codes'), '497825748');

    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('https://swgoh.gg/api/player/497825748/');
    });
    expect(screen.getByLabelText('Ally Code')).toHaveValue('497825748');
    expect(window.location.search).toContain('allycode=497825748');
    expect(screen.getByLabelText('Saved ally codes')).toHaveValue('497825748');
  });

  it('still lets a custom ally code replace a saved selection', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.selectOptions(screen.getByLabelText('Saved ally codes'), '964559642');
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('https://swgoh.gg/api/player/964559642/');
    });

    const field = screen.getByLabelText('Ally Code');
    await user.clear(field);
    await user.type(field, '123456789');
    expect(screen.getByLabelText('Saved ally codes')).toHaveValue('');

    await user.click(screen.getByRole('button', { name: /sync roster/i }));
    await waitFor(() => {
      expect(globalThis.fetch).toHaveBeenCalledWith('https://swgoh.gg/api/player/123456789/');
    });
    expect(window.location.search).toContain('allycode=123456789');
  });

  it('navigates to the all farms page and keeps the synced roster', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.type(screen.getByLabelText('Ally Code'), '123456789');
    await user.click(screen.getByRole('button', { name: /sync roster/i }));

    await waitFor(() => {
      expect(screen.getByText('Bogdan')).toBeInTheDocument();
    });

    await user.click(screen.getByRole('link', { name: /all farms/i }));

    await waitFor(() => {
      expect(screen.getByText(/Galactic Legend: Leia Organa/)).toBeInTheDocument();
    });

    // The roster survives the route change, so stats stay rendered.
    expect(screen.getByText('Bogdan')).toBeInTheDocument();
    expect(screen.getByText(/Journey: Grand Master Yoda/)).toBeInTheDocument();
  });

  it('builds and persists a custom ordered roadmap', async () => {
    const user = userEvent.setup();
    render(<App />);

    await user.click(screen.getByRole('link', { name: /my roadmap/i }));

    const picker = screen.getByLabelText('Choose a farm');
    await user.selectOptions(picker, 'Discarded Doctrine');
    await user.click(screen.getByRole('button', { name: /add farm/i }));
    await user.selectOptions(picker, 'Rebel with a cause');
    await user.click(screen.getByRole('button', { name: /add farm/i }));

    expect(screen.getByText('2 selected')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /move leia organa up/i })).toBeEnabled();

    await user.click(screen.getByRole('button', { name: /move leia organa up/i }));

    await waitFor(() => {
      const stored = JSON.parse(window.localStorage.getItem('swgoh-my-roadmap'));
      expect(stored.farmKeys).toEqual(['Rebel with a cause', 'Discarded Doctrine']);
    });
  });

  it('starts dark and persists a light theme choice', async () => {
    const user = userEvent.setup();
    render(<App />);

    const saber = screen.getByRole('button', { name: 'Light theme' });

    expect(saber).toHaveAttribute('aria-pressed', 'false');
    expect(saber).toHaveAttribute('title', 'Switch to light theme');
    await user.click(saber);

    await waitFor(() => {
      expect(window.localStorage.getItem(THEME_STORAGE_KEY)).toBe(THEME_IDS.GALACTIC_LIGHT);
    });
    expect(document.documentElement.dataset.theme).toBe('light');
    expect(saber).toHaveAttribute('aria-pressed', 'true');
    expect(saber).toHaveAttribute('title', 'Switch to dark theme');
  });

  it('restores a saved light theme', () => {
    window.localStorage.setItem(THEME_STORAGE_KEY, THEME_IDS.GALACTIC_LIGHT);
    render(<App />);

    expect(screen.getByRole('button', { name: 'Light theme' })).toHaveAttribute('aria-pressed', 'true');
  });
});
