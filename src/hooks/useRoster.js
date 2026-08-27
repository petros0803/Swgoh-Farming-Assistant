import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPlayerRoster } from '../services/swgohApi';
import { normalizeAllyCode } from '../utils/format';

export function useRoster() {
  const [searchParams, setSearchParams] = useSearchParams();
  const allyCodeFromUrl = useRef(searchParams.get('allycode') || '');
  const hasAutoSynced = useRef(false);

  const [allyCode, setAllyCode] = useState(allyCodeFromUrl.current);
  const [playerData, setPlayerData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncRoster = useCallback(async (rawCode) => {
    const code = normalizeAllyCode(rawCode);
    setError('');
    setLoading(true);

    try {
      const data = await fetchPlayerRoster(code);
      setPlayerData(data);
      setAllyCode(code);
      setSearchParams(
        (current) => {
          const next = new URLSearchParams(current);
          next.set('allycode', code);
          return next;
        },
        { replace: true }
      );
    } catch (err) {
      setError(err.message || 'Unable to sync roster.');
    } finally {
      setLoading(false);
    }
  }, [setSearchParams]);

  useEffect(() => {
    if (hasAutoSynced.current) return;
    hasAutoSynced.current = true;

    if (allyCodeFromUrl.current) {
      syncRoster(allyCodeFromUrl.current);
    }
  }, [syncRoster]);

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
