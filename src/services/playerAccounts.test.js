import { createMemorySupabase, MEMORY_USER_ID } from '../test/memorySupabase';
import {
  createPlayerAccount,
  deletePlayerAccount,
  listPlayerAccounts,
  updatePlayerAccount,
  validatePlayerAccount
} from './playerAccounts';

describe('player accounts', () => {
  it('requires a name and a 9-digit ally code', () => {
    const missing = validatePlayerAccount({ name: '   ', description: '', allyCode: '123' });
    expect(missing.ok).toBe(false);
    expect(missing.errors.name).toMatch(/required/i);
    expect(missing.errors.allyCode).toMatch(/9 digits/i);

    const valid = validatePlayerAccount({
      name: ' Main ',
      description: ' Arena alt ',
      allyCode: '123-456-789'
    });
    expect(valid.ok).toBe(true);
    expect(valid.value).toEqual({
      name: 'Main',
      description: 'Arena alt',
      allyCode: '123456789'
    });
  });

  it('stores, updates, and deletes accounts for one login', async () => {
    const client = createMemorySupabase();

    await createPlayerAccount(client, {
      name: 'Alt',
      description: 'Fleet',
      allyCode: '964559642'
    });
    await createPlayerAccount(client, {
      name: 'Main',
      description: 'Arena',
      allyCode: '497825748'
    });

    expect(client.inserts[0]).toEqual({
      name: 'Alt',
      description: 'Fleet',
      ally_code: '964559642'
    });
    expect(client.inserts[0]).not.toHaveProperty('user_id');

    const saved = await listPlayerAccounts(client);
    expect(saved.map((account) => account.name)).toEqual(['Alt', 'Main']);

    await expect(createPlayerAccount(client, {
      name: 'Copy',
      description: '',
      allyCode: '497825748'
    })).rejects.toThrow(/already saved/i);

    const updated = await updatePlayerAccount(client, MEMORY_USER_ID, saved[1].id, {
      name: 'Main',
      description: 'Grand arena',
      allyCode: '497825748'
    });
    expect(updated.description).toBe('Grand arena');

    await deletePlayerAccount(client, MEMORY_USER_ID, saved[0].id);
    const remaining = await listPlayerAccounts(client);
    expect(remaining).toHaveLength(1);
    expect(remaining[0].name).toBe('Main');
  });

  it('does not send a query for an id that is not a uuid', async () => {
    const client = {
      from() {
        throw new Error('query should not run');
      }
    };

    await expect(deletePlayerAccount(
      client,
      MEMORY_USER_ID,
      '1; drop table player_accounts'
    )).rejects.toThrow(/could not be found/i);
  });

  it('hides raw database errors', async () => {
    const builder = {
      select() { return builder; },
      order() { return builder; },
      then(resolve) {
        return resolve({
          data: null,
          error: {
            code: '42601',
            message: 'syntax error at or near "drop table player_accounts"'
          }
        });
      }
    };

    await expect(listPlayerAccounts({ from: () => builder }))
      .rejects.toThrow('Could not load saved accounts.');
  });

  it('explains a missing accounts table', async () => {
    const builder = {
      select() { return builder; },
      order() { return builder; },
      then(resolve) {
        return resolve({
          data: null,
          error: {
            code: 'PGRST205',
            message: "Could not find the table 'public.player_accounts' in the schema cache"
          }
        });
      }
    };

    await expect(listPlayerAccounts({ from: () => builder }))
      .rejects.toThrow(/player_accounts\.sql/);
  });
});
