import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { renderWithTheme } from '../test/renderWithTheme';
import { characterCatalog, shipCatalog } from '../utils/unitCatalog';
import CharactersPage from './CharactersPage';

describe('CharactersPage', () => {
  it('lists the complete canonical character catalog and its acquisition sources', () => {
    renderWithTheme(<CharactersPage />);

    expect(screen.getByLabelText(
      `Showing ${characterCatalog.length} of ${characterCatalog.length} characters`
    )).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: '0-0-0' })).toBeInTheDocument();
    expect(screen.getAllByText(/Dark Side 2-A/).length).toBeGreaterThan(0);
  });

  it('searches by farming location and filters by source type', async () => {
    const user = userEvent.setup();
    renderWithTheme(<CharactersPage />);

    await user.type(
      screen.getByRole('searchbox', { name: /search characters or farming locations/i }),
      'Dark Side 2-A'
    );

    expect(screen.getByRole('heading', { name: '0-0-0' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: '4-LOM' })).not.toBeInTheDocument();

    await user.clear(screen.getByRole('searchbox'));
    await user.click(screen.getByRole('button', { name: 'Stores' }));
    expect(screen.getByLabelText(/Showing \d+ of \d+ characters/)).toBeInTheDocument();
  });

  it('uses the same directory for every obtainable ship', () => {
    renderWithTheme(<CharactersPage kind="ship" />);

    expect(screen.getByRole('heading', { name: 'Where to farm every ship' })).toBeInTheDocument();
    expect(screen.getByLabelText(
      `Showing ${shipCatalog.length} of ${shipCatalog.length} ships`
    )).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'Imperial TIE Bomber' })).toBeInTheDocument();
  });
});
