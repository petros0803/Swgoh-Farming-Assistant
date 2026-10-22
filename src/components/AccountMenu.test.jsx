import { useState } from 'react';
import { BrowserRouter } from 'react-router-dom';
import { screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import Header from './Header';
import AuthProvider from '../context/AuthProvider';
import { renderWithTheme } from '../test/renderWithTheme';
import { createMemorySupabase, MEMORY_USER_ID } from '../test/memorySupabase';

function Harness({ client, onSync }) {
  const [allyCode, setAllyCode] = useState('');

  return (
    <BrowserRouter>
      <AuthProvider client={client}>
        <Header
          allyCode={allyCode}
          onAllyCodeChange={setAllyCode}
          onSync={onSync}
          loading={false}
          previewMode={false}
          onPreviewModeChange={() => {}}
        />
      </AuthProvider>
    </BrowserRouter>
  );
}

describe('AccountMenu', () => {
  it('explains which Supabase values to add when auth is not configured', async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness client={null} onSync={() => {}} />);

    await user.click(screen.getByRole('button', { name: 'Sign in' }));

    const dialog = screen.getByRole('dialog', { name: 'Sign in' });
    expect(within(dialog).getByText('VITE_SUPABASE_URL')).toBeInTheDocument();
    expect(within(dialog).getByText('VITE_SUPABASE_ANON_KEY')).toBeInTheDocument();
    expect(within(dialog).getByText(/player_accounts\.sql/)).toBeInTheDocument();
  });

  it('saves a named account after sign-in and syncs it from the header', async () => {
    const user = userEvent.setup();
    const onSync = vi.fn();
    renderWithTheme(<Harness client={createMemorySupabase()} onSync={onSync} />);

    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    const dialog = screen.getByRole('dialog', { name: 'Sign in' });
    await user.type(within(dialog).getByLabelText('Email'), 'player@example.com');
    await user.type(within(dialog).getByLabelText('Password'), 'password123');
    await user.click(within(dialog).getByRole('button', { name: 'Sign in with email' }));

    expect(await screen.findByRole('dialog', { name: 'Your accounts' })).toBeInTheDocument();
    const accounts = screen.getByRole('dialog', { name: 'Your accounts' });
    await user.type(within(accounts).getByLabelText('Account name'), 'Main');
    await user.type(within(accounts).getByLabelText('Description'), 'Arena roster');
    await user.type(within(accounts).getByLabelText('Account ally code'), '497-825-748');
    await user.click(within(accounts).getByRole('button', { name: 'Save account' }));

    expect(await within(accounts).findByText('Arena roster')).toBeInTheDocument();
    await user.click(within(accounts).getByRole('button', { name: 'Sync Main' }));

    expect(onSync).toHaveBeenCalledWith('497825748');
    expect(screen.getByLabelText('Ally Code')).toHaveValue('497825748');
    const saved = screen.getByLabelText('Saved accounts');
    expect(saved).toHaveValue(within(saved).getByRole('option', { name: 'Main (497825748)' }).value);
    expect(saved.value).not.toBe('');
  });

  it('edits and deletes a saved account, then returns the built-in codes after sign-out', async () => {
    const user = userEvent.setup();
    const client = createMemorySupabase({
      accounts: [{
        id: '22222222-2222-4222-8222-000000000009',
        user_id: MEMORY_USER_ID,
        name: 'Main',
        description: 'Arena',
        ally_code: '497825748',
        created_at: '2026-01-01T00:00:00.000Z',
        updated_at: '2026-01-01T00:00:00.000Z'
      }]
    });
    renderWithTheme(<Harness client={client} onSync={() => {}} />);

    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    let dialog = screen.getByRole('dialog', { name: 'Sign in' });
    await user.type(within(dialog).getByLabelText('Email'), 'player@example.com');
    await user.type(within(dialog).getByLabelText('Password'), 'password123');
    await user.click(within(dialog).getByRole('button', { name: 'Sign in with email' }));

    dialog = await screen.findByRole('dialog', { name: 'Your accounts' });
    await user.click(await within(dialog).findByRole('button', { name: 'Edit Main' }));
    const description = within(dialog).getByLabelText('Description');
    await user.clear(description);
    await user.type(description, 'Grand arena');
    await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));
    expect(await within(dialog).findByText('Grand arena')).toBeInTheDocument();

    await user.click(within(dialog).getByRole('button', { name: 'Delete Main' }));
    await user.click(within(dialog).getByRole('button', { name: 'Confirm delete Main' }));
    await waitFor(() => {
      expect(within(dialog).getByText('No saved accounts yet.')).toBeInTheDocument();
    });

    await user.click(within(dialog).getByRole('button', { name: 'Sign out' }));
    await waitFor(() => {
      expect(screen.getByLabelText('Saved ally codes')).toBeInTheDocument();
    });
    expect(within(screen.getByLabelText('Saved ally codes')).getByRole('option', { name: '497825748' }))
      .toBeInTheDocument();
  });

  it('shows a login error and an email confirmation notice', async () => {
    const user = userEvent.setup();
    renderWithTheme(<Harness client={createMemorySupabase()} onSync={() => {}} />);

    await user.click(await screen.findByRole('button', { name: 'Sign in' }));
    const dialog = screen.getByRole('dialog', { name: 'Sign in' });
    await user.type(within(dialog).getByLabelText('Email'), 'player@example.com');
    await user.type(within(dialog).getByLabelText('Password'), 'wrong-password');
    await user.click(within(dialog).getByRole('button', { name: 'Sign in with email' }));
    expect(await within(dialog).findByRole('alert')).toHaveTextContent(/invalid login credentials/i);

    await user.click(within(dialog).getByRole('button', { name: /create one/i }));
    await user.clear(within(dialog).getByLabelText('Email'));
    await user.type(within(dialog).getByLabelText('Email'), 'confirm@example.com');
    await user.clear(within(dialog).getByLabelText('Password'));
    await user.type(within(dialog).getByLabelText('Password'), 'password123');
    await user.click(within(dialog).getByRole('button', { name: 'Create account' }));

    expect(await within(dialog).findByRole('status')).toHaveTextContent(/confirm the account/i);
  });
});
