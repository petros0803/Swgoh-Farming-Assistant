import { createClient } from '@supabase/supabase-js';

export function normalizeSupabaseUrl(value) {
  return String(value || '')
    .trim()
    .replace(/\/rest\/v1\/?$/i, '')
    .replace(/\/+$/, '');
}

const url = normalizeSupabaseUrl(import.meta.env.VITE_SUPABASE_URL);
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

function createSupabaseClient() {
  if (import.meta.env.VITEST) return null;
  if (!url || !anonKey) return null;

  try {
    return createClient(url, anonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });
  } catch {
    return null;
  }
}

export const supabase = createSupabaseClient();
