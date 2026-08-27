import { useCallback, useEffect, useState } from 'react';
import { fetchPlayerRoster } from '../services/swgohApi';
import { normalizeAllyCode } from '../utils/format';

function readAllyCodeFromUrl() {
  return new URLSearchParams(window.location.search).get('allycode') || '';
}

function writeAllyCodeToUrl(allyCode) {
  const next = new URL(window.location.href);
  next.searchParams.set('allycode', allyCode);
  window.history.pushState({ path: next.pathname + next.search }, '', next.pathname + next.search);
}

export function useRoster() {
  const [allyCode, setAllyCode] = useState(() => readAllyCodeFromUrl());
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncRoster = useCallback(async (rawCode = allyCode) => {
    const code = normalizeAllyCode(rawCode);
    setError('');
    setLoading(true);

    try {
      const data = await fetchPlayerRoster(code);
      setPlayerData(data);
      writeAllyCodeToUrl(code);
      setAllyCode(code);
    } catch (err) {
      setError(err.message || 'Unable to sync roster.');
    } finally {
      setLoading(false);
    }
  }, [allyCode]);

  useEffect(() => {
    const fromUrl = readAllyCodeFromUrl();
    if (fromUrl) {
      syncRoster(fromUrl);
    }
    // Load once from the URL on mount.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return {
    allyCode,
    setAllyCode,
    playerData,
    loading,
    error,
    clearError: () => setError(''),
    syncRoster
  };
}
