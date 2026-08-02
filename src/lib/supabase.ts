import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project-id.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.your-anon-key-here';

export const isSupabaseConfigured = Boolean(
  import.meta.env.VITE_SUPABASE_URL && 
  import.meta.env.VITE_SUPABASE_ANON_KEY &&
  !import.meta.env.VITE_SUPABASE_URL.includes('your-supabase-project-id')
);

export const SITE_URL = (import.meta.env.VITE_SITE_URL || 'https://rapiqr.worthitellp.workers.dev').replace(/\/+$/, '');

/**
 * Generates the OAuth and authentication callback URL for Google sign-in.
 * - When running in the browser, always uses window.location.origin so Google OAuth
 *   bounces back to the current active origin (localhost when running locally, live domain in production).
 * - Fallback to SITE_URL for SSR or non-browser environments.
 */
export function getAuthCallbackUrl(targetPath = '/auth/callback'): string {
  const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
    const activeOrigin = window.location.origin.replace(/\/+$/, '');
    return `${activeOrigin}${normalizedPath}`;
  }
  return `${SITE_URL}${normalizedPath}`;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
