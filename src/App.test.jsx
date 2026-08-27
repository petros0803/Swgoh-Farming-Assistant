import { render, screen, waitFor } from '@testing-library/react';
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
