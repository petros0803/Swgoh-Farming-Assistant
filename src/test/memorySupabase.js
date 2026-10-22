export const MEMORY_USER_ID = '11111111-1111-4111-8111-111111111111';

/**
 * Just enough of the Supabase client for auth and player_accounts tests.
 * Password `password123` signs in. `confirm@example.com` signs up without a session.
 */
export function createMemorySupabase({ accounts = [] } = {}) {
  let session = null;
  const listeners = new Set();
  const rows = accounts.map((account) => ({ ...account }));
  const inserts = [];

  function emit(event, nextSession) {
    listeners.forEach((listener) => listener(event, nextSession));
  }

  return {
    rows,
    inserts,
    auth: {
      async getSession() {
        return { data: { session }, error: null };
      },
      onAuthStateChange(callback) {
        listeners.add(callback);
        return {
          data: {
            subscription: {
              unsubscribe() {
                listeners.delete(callback);
              }
            }
          }
        };
      },
      async signInWithPassword({ email, password }) {
        if (password !== 'password123') {
          return {
            data: { user: null, session: null },
            error: { message: 'Invalid login credentials' }
          };
        }

        session = { user: { id: MEMORY_USER_ID, email: email.trim() } };
        emit('SIGNED_IN', session);
        return { data: { user: session.user, session }, error: null };
      },
      async signUp({ email, password }) {
        if (String(password).length < 6) {
          return {
            data: { user: null, session: null },
            error: { message: 'Password should be at least 6 characters.' }
          };
        }

        const user = { id: MEMORY_USER_ID, email: email.trim() };
        if (email.trim() === 'confirm@example.com') {
          return { data: { user, session: null }, error: null };
        }

        session = { user };
        emit('SIGNED_IN', session);
        return { data: { user, session }, error: null };
      },
      async signOut() {
        session = null;
        emit('SIGNED_OUT', null);
        return { error: null };
      }
    },
    from() {
      return createBuilder(rows, inserts);
    }
  };
}

function createBuilder(rows, inserts) {
  const query = {
    action: 'select',
    values: null,
    filters: []
  };
  let result = null;

  function run() {
    if (!result) result = Promise.resolve(execute(rows, query, inserts));
    return result;
  }

  const builder = {
    select() {
      return builder;
    },
    order() {
      return builder;
    },
    insert(values) {
      query.action = 'insert';
      query.values = values;
      return builder;
    },
    update(values) {
      query.action = 'update';
      query.values = values;
      return builder;
    },
    delete() {
      query.action = 'delete';
      return builder;
    },
    eq(column, value) {
      query.filters.push({ column, value });
      return builder;
    },
    single() {
      return builder;
    },
    then(onFulfilled, onRejected) {
      return run().then(onFulfilled, onRejected);
    }
  };

  return builder;
}

function matches(row, filters) {
  return filters.every((filter) => row[filter.column] === filter.value);
}

function duplicateAllyCode(rows, userId, allyCode, ignoreId) {
  return rows.some((row) => (
    row.user_id === userId
    && row.ally_code === allyCode
    && row.id !== ignoreId
  ));
}

function execute(rows, query, inserts) {
  if (query.action === 'select') {
    const data = rows
      .filter((row) => matches(row, query.filters))
      .sort((left, right) => left.name.localeCompare(right.name));
    return { data, error: null };
  }

  if (query.action === 'insert') {
    inserts.push({ ...query.values });
    const userId = query.values.user_id || MEMORY_USER_ID;
    if (duplicateAllyCode(rows, userId, query.values.ally_code)) {
      return { data: null, error: { code: '23505', message: 'duplicate key' } };
    }

    const suffix = String(rows.length + 1).padStart(12, '0');
    const row = {
      id: `22222222-2222-4222-8222-${suffix}`,
      created_at: '2026-01-01T00:00:00.000Z',
      updated_at: '2026-01-01T00:00:00.000Z',
      description: '',
      ...query.values,
      user_id: userId
    };
    rows.push(row);
    return { data: row, error: null };
  }

  if (query.action === 'update') {
    const row = rows.find((item) => matches(item, query.filters));
    if (!row) return { data: null, error: { message: 'Account not found.' } };
    if (duplicateAllyCode(rows, row.user_id, query.values.ally_code, row.id)) {
      return { data: null, error: { code: '23505', message: 'duplicate key' } };
    }
    Object.assign(row, query.values, { updated_at: '2026-01-02T00:00:00.000Z' });
    return { data: { ...row }, error: null };
  }

  for (let index = rows.length - 1; index >= 0; index -= 1) {
    if (matches(rows[index], query.filters)) rows.splice(index, 1);
  }
  return { data: null, error: null };
}
