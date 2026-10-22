import { useEffect, useState } from 'react';
import styled from 'styled-components';
import ErrorBanner from '../components/ErrorBanner';
import { installCatalog } from '../data/catalogState';
import { catalogLoadError, loadGameCatalog } from '../services/gameCatalog';
import { supabase } from '../services/supabaseClient';

export default function CatalogProvider({ children }) {
  const [status, setStatus] = useState(supabase ? 'loading' : 'ready');
  const [notice, setNotice] = useState('');

  useEffect(() => {
    if (!supabase) return undefined;

    let cancelled = false;
    loadGameCatalog(supabase)
      .then((snapshot) => {
        if (cancelled) return;
        installCatalog(snapshot);
        setStatus('ready');
      })
      .catch((error) => {
        if (cancelled) return;
        setNotice(catalogLoadError(error));
        setStatus('ready');
      });

    return () => {
      cancelled = true;
    };
  }, []);

  if (status === 'loading') {
    return <Loading>Loading characters, farms, and relic data…</Loading>;
  }

  return (
    <>
      {notice ? <ErrorBanner message={notice} /> : null}
      {children}
    </>
  );
}

const Loading = styled.p`
  margin: 0;
  color: ${({ theme }) => theme.colors.muted};
  font-size: ${({ theme }) => theme.fontSizes.md};
`;
