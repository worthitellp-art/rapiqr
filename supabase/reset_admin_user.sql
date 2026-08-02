-- ============================================================================
-- RESET: clear out any stale/broken profile or auth user tied to the admin
-- email, in case a previous signup or the old adminSignIn bug left a
-- conflicting row behind.
-- ============================================================================
-- NOTE: admin login does NOT require any row here anymore. adminSignIn()
-- validates purely against ADMIN_EMAIL / ADMIN_PASSWORD in Server/.env (or
-- Render's env vars) and constructs the admin profile in memory if no real
-- Supabase Auth account exists for that email. Nothing needs to be "seeded"
-- after running this — the next successful admin login recreates what it
-- needs on its own.
-- ============================================================================

-- 1. See what's currently there (run this first, just to look)
select id, email, role, created_at from public.profiles where email = 'worthitellp@gmail.com';
select id, email, created_at, confirmed_at from auth.users where email = 'worthitellp@gmail.com';

-- 2. Delete the profile row (harmless if nothing matches)
delete from public.profiles where email = 'worthitellp@gmail.com';

-- 3. Delete the auth user, if one exists (this is what actually matters —
--    profiles cascades from this via ON DELETE CASCADE, so step 2 is
--    redundant once this runs, but safe to keep for clarity/order)
delete from auth.users where email = 'worthitellp@gmail.com';
