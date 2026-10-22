import { isValidAllyCode, normalizeAllyCode } from '../utils/format';

const ACCOUNT_COLUMNS = 'id, name, description, ally_code, created_at, updated_at';
const ACCOUNT_ID = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const SAFE_DATABASE_MESSAGES = {
  'Account limit reached': 'You can save up to 50 accounts on this login.',
  'Not authenticated': 'Sign in before saving an account.',
  'Cannot change account owner': 'That account could not be saved.'
};

export function isAccountId(value) {
  return ACCOUNT_ID.test(String(value || ''));
}

function assertAccountId(value) {
  if (!isAccountId(value)) throw new Error('That account could not be found.');
}

function cleanText(value) {
  return [...String(value ?? '')]
    .filter((char) => char.charCodeAt(0) !== 0)
    .join('')
    .trim();
}

export class AccountValidationError extends Error {
  constructor(fields) {
    super('Check the account details.');
    this.name = 'AccountValidationError';
    this.fields = fields;
  }
}

export function validatePlayerAccount({ name = '', description = '', allyCode = '' } = {}) {
  const trimmedName = cleanText(name);
  const trimmedDescription = cleanText(description);
  const code = normalizeAllyCode(allyCode);
  const errors = {};

  if (!trimmedName) errors.name = 'Name is required.';
  else if (trimmedName.length > 80) errors.name = 'Name must be 80 characters or fewer.';

  if (trimmedDescription.length > 500) {
    errors.description = 'Description must be 500 characters or fewer.';
  }

  if (!isValidAllyCode(code)) errors.allyCode = 'Ally code must be 9 digits.';

  return {
    ok: Object.keys(errors).length === 0,
    errors,
    value: {
      name: trimmedName,
      description: trimmedDescription,
      allyCode: code
    }
  };
}

export function mapPlayerAccount(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description ?? '',
    allyCode: row.ally_code,
    createdAt: row.created_at,
    updatedAt: row.updated_at
  };
}

function asError(error, fallback) {
  if (!error) return null;
  if (error.code === '23505') {
    return new Error('That ally code is already saved on this login.');
  }
  if (error.code === '23514') {
    return new Error('That account does not meet the save rules.');
  }
  const message = String(error.message || '');
  if (error.code === 'PGRST205' || error.code === '42P01' || /schema cache|does not exist/i.test(message)) {
    return new Error('Saved accounts are not set up yet. Run supabase/player_accounts.sql in the Supabase SQL editor.');
  }
  return new Error(SAFE_DATABASE_MESSAGES[message] || fallback);
}

export async function listPlayerAccounts(client) {
  const { data, error } = await client
    .from('player_accounts')
    .select(ACCOUNT_COLUMNS)
    .order('name', { ascending: true });

  const failure = asError(error, 'Could not load saved accounts.');
  if (failure) throw failure;
  return (data ?? []).map(mapPlayerAccount);
}

export async function createPlayerAccount(client, account) {
  const { data, error } = await client
    .from('player_accounts')
    .insert({
      name: account.name,
      description: account.description,
      ally_code: account.allyCode
    })
    .select(ACCOUNT_COLUMNS)
    .single();

  const failure = asError(error, 'Could not save the account.');
  if (failure) throw failure;
  return mapPlayerAccount(data);
}

export async function updatePlayerAccount(client, userId, id, account) {
  assertAccountId(userId);
  assertAccountId(id);

  const { data, error } = await client
    .from('player_accounts')
    .update({
      name: account.name,
      description: account.description,
      ally_code: account.allyCode
    })
    .eq('id', id)
    .eq('user_id', userId)
    .select(ACCOUNT_COLUMNS)
    .single();

  const failure = asError(error, 'Could not update the account.');
  if (failure) throw failure;
  return mapPlayerAccount(data);
}

export async function deletePlayerAccount(client, userId, id) {
  assertAccountId(userId);
  assertAccountId(id);

  const { error } = await client
    .from('player_accounts')
    .delete()
    .eq('id', id)
    .eq('user_id', userId);

  const failure = asError(error, 'Could not delete the account.');
  if (failure) throw failure;
}
