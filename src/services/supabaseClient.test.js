import { normalizeSupabaseUrl } from './supabaseClient';

describe('normalizeSupabaseUrl', () => {
  it('keeps the project root and drops a copied REST path', () => {
    expect(normalizeSupabaseUrl(' https://demo.supabase.co/rest/v1/ ')).toBe('https://demo.supabase.co');
    expect(normalizeSupabaseUrl('https://demo.supabase.co/')).toBe('https://demo.supabase.co');
  });
});