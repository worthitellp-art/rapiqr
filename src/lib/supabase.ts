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
 * - When the app runs locally (localhost / 127.0.0.1 / .local) it keeps the
 *   current local origin, so the OAuth flow continues on localhost.
 * - Anywhere else (hosted preview, production) it always uses the configured
 *   hosting URL (VITE_SITE_URL), so Google always bounces back to the real
 *   live dashboard and never to a stray localhost / preview origin.
 */
export function getAuthCallbackUrl(targetPath = '/auth/callback'): string {
  const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  const hostname = typeof window !== 'undefined' ? window.location?.hostname || '' : '';
  const isLocalHost =
    hostname === '' ||
    hostname === 'localhost' ||
    hostname === '127.0.0.1' ||
    hostname === '::1' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local');

  if (isLocalHost && typeof window !== 'undefined' && window.location?.origin) {
    return `${window.location.origin.replace(/\/+$/, '')}${normalizedPath}`;
  }
  return `${SITE_URL}${normalizedPath}`;
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});
