import { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { fetchPlayerRoster } from '../services/swgohApi';
import { normalizeAllyCode } from '../utils/format';

/**
 * Stands in for a synced roster so every requirement can be browsed as if
 * nothing is owned. Named rather than blank so the stats row says why.
 */
const EMPTY_ROSTER = {
  data: { name: 'No roster imported', galactic_power: 0 },
  units: []
};

export function useRoster() {
  const [searchParams, setSearchParams] = useSearchParams();
  const allyCodeFromUrl = useRef(searchParams.get('allycode') || '');
  const hasAutoSynced = useRef(false);

  const [allyCode, setAllyCode] = useState(allyCodeFromUrl.current);
  const [playerData, setPlayerData] = useState(null);
  const [previewMode, setPreviewMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const syncRoster = useCallback(async (rawCode) => {
    const code = normalizeAllyCode(rawCode);
    setError('');
    setLoading(true);

    try {
      const data = await fetchPlayerRoster(code);
      setPlayerData(data);
      // Importing a roster is a clear signal the player wants their own numbers.
      setPreviewMode(false);
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
    previewMode,
    setPreviewMode,
    // What the pages should read: the synced roster, or an empty one while
    // previewing requirements without an ally code.
    roster: previewMode ? EMPTY_ROSTER : playerData,
    loading,
    error,
    clearError: () => setError(''),
    syncRoster
  };
}
