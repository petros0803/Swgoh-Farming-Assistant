import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { AuthContext } from './authContext';
import { supabase as defaultClient } from '../services/supabaseClient';
import { assertAuthCredentials, publicAuthMessage } from '../services/authCredentials';
import {
  AccountValidationError,
  createPlayerAccount,
  deletePlayerAccount,
  isAccountId,
  listPlayerAccounts,
  updatePlayerAccount,
  validatePlayerAccount
} from '../services/playerAccounts';

export default function AuthProvider({ client = defaultClient, children }) {
  const [session, setSession] = useState(null);
  const [ready, setReady] = useState(() => !client);
  const [accounts, setAccounts] = useState([]);
  const [accountsLoading, setAccountsLoading] = useState(false);
  const [accountsError, setAccountsError] = useState('');
  const accountsRequest = useRef(0);
  const userId = session?.user?.id ?? null;

  useEffect(() => {
    if (!client) return undefined;

    let active = true;

    client.auth.getSession()
      .then(({ data, error }) => {
        if (!active) return;
        if (error) setAccountsError(publicAuthMessage(error.message));
        setSession(data?.session ?? null);
        setReady(true);
      })
      .catch((error) => {
        if (!active) return;
        setAccountsError(publicAuthMessage(error.message));
        setReady(true);
      });

    const { data: { subscription } } = client.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setReady(true);
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, [client]);

  useEffect(() => {
    if (!client || !userId) {
      accountsRequest.current += 1;
      setAccounts([]);
      setAccountsLoading(false);
      return undefined;
    }

    const requestId = accountsRequest.current + 1;
    accountsRequest.current = requestId;
    setAccountsLoading(true);
    setAccountsError('');

    listPlayerAccounts(client)
      .then((next) => {
        if (accountsRequest.current !== requestId) return;
        setAccounts(next);
      })
      .catch((error) => {
        if (accountsRequest.current !== requestId) return;
        setAccounts([]);
        setAccountsError(error.message);
      })
      .finally(() => {
        if (accountsRequest.current === requestId) setAccountsLoading(false);
      });

    return undefined;
  }, [client, userId]);

  const signIn = useCallback(async ({ email, password }) => {
    const credentials = assertAuthCredentials({ email, password });
    const { error } = await client.auth.signInWithPassword(credentials);
    if (error) throw new Error(publicAuthMessage(error.message));
  }, [client]);

  const signUp = useCallback(async ({ email, password }) => {
    const credentials = assertAuthCredentials({ email, password });
    const { data, error } = await client.auth.signUp({
      ...credentials,
      options: {
        emailRedirectTo: 'https://petros0803.github.io/Swgoh-Farming-Assistant/'
      }
    });
    if (error) throw new Error(publicAuthMessage(error.message));
    return { needsConfirmation: !data.session };
  }, [client]);

  const signOut = useCallback(async () => {
    const { error } = await client.auth.signOut({ scope: 'global' });
    if (error) throw new Error(publicAuthMessage(error.message));
  }, [client]);

  const saveAccount = useCallback(async (input) => {
    const validated = validatePlayerAccount(input);
    if (!validated.ok) throw new AccountValidationError(validated.errors);
    if (!client || !isAccountId(userId)) throw new Error('Sign in before saving an account.');

    const saved = input.id
      ? await updatePlayerAccount(client, userId, input.id, validated.value)
      : await createPlayerAccount(client, validated.value);

    accountsRequest.current += 1;
    setAccountsLoading(false);
    setAccounts((current) => [...current.filter((account) => account.id !== saved.id), saved]
      .sort((left, right) => left.name.localeCompare(right.name)));
    return saved;
  }, [client, userId]);

  const removeAccount = useCallback(async (id) => {
    if (!client || !isAccountId(userId)) throw new Error('Sign in before deleting an account.');
    await deletePlayerAccount(client, userId, id);
    accountsRequest.current += 1;
    setAccountsLoading(false);
    setAccounts((current) => current.filter((account) => account.id !== id));
  }, [client, userId]);

  const value = useMemo(() => ({
    configured: Boolean(client),
    ready,
    user: session?.user ?? null,
    accounts,
    accountsLoading,
    accountsError,
    signIn,
    signUp,
    signOut,
    saveAccount,
    removeAccount
  }), [
    client,
    ready,
    session,
    accounts,
    accountsLoading,
    accountsError,
    signIn,
    signUp,
    signOut,
    saveAccount,
    removeAccount
  ]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
