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
 * Generates the OAuth and authentication callback URL based on the current origin.
 * Dynamically uses window.location.origin so Google sign-in redirects back
 * seamlessly both on localhost and on hosted production backend/frontend domains.
 */
export function getAuthCallbackUrl(targetPath = '/auth/callback'): string {
  const normalizedPath = targetPath.startsWith('/') ? targetPath : `/${targetPath}`;
  if (typeof window !== 'undefined' && window.location?.origin) {
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
