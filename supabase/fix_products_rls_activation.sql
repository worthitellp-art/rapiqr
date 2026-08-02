-- ============================================================================
-- FIX: public.products RLS was blocking sticker activation writes
-- ============================================================================
-- Root cause: activateQrInDb() (src/lib/supabaseService.ts) upserts into
-- public.products using the anonymous Supabase client, because sticker
-- activation is a public flow — a customer scans a fresh sticker and
-- activates it directly, often without ever logging in (same design as
-- public.qr_codes, which already has public insert/update policies below).
--
-- But public.products' INSERT/UPDATE policies required
-- (select auth.uid()) = user_id. For an anonymous activation user_id is
-- NULL, and auth.uid() is also NULL for an anon request — NULL = NULL is
-- NULL (not true) in Postgres, so RLS silently rejected the write. The
-- upsert's error was swallowed by a try/catch that only logs a console
-- warning, so activation *looked* successful in the UI while nothing was
-- actually persisted — this is why owner name/phone, blood group,
-- allergies, address, and the new emergencyContacts data never showed up
-- in the products table.
--
-- Run this once against your Supabase project (SQL Editor or `psql`).
-- Safe to re-run — every statement is idempotent (DROP ... IF EXISTS then
-- CREATE), matching the style of the other supabase/fix_*.sql files.
-- ============================================================================

-- Allow anonymous + authenticated inserts (mirrors public.qr_codes policy).
-- Client code still sets user_id when the activator is logged in
-- (ScanPage passes profile?.id through to activateQrInDb), so per-user
-- product ownership is preserved whenever we actually have an account to
-- attach it to; this policy just stops RLS from blocking the anonymous case.
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Products public insert policy" ON public.products;
CREATE POLICY "Products public insert policy" ON public.products FOR INSERT WITH CHECK (true);

-- Same reasoning for UPDATE — activateQrInDb() uses an upsert
-- (INSERT ... ON CONFLICT (qr_code_id) DO UPDATE), so the UPDATE path hits
-- this policy on every re-activation / re-scan of an existing sticker.
DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Products public update policy" ON public.products;
CREATE POLICY "Products public update policy" ON public.products FOR UPDATE USING (true) WITH CHECK (true);

-- SELECT and DELETE are intentionally left as-is (owner-only via
-- auth.uid() = user_id, or status = 'active' for public viewing) — reading
-- and deleting are not part of the anonymous activation flow, so they stay
-- restrictive.

-- ============================================================================
-- Sanity check: confirm the policies now in place on public.products
-- ============================================================================
-- SELECT policyname, cmd, qual, with_check
-- FROM pg_policies
-- WHERE schemaname = 'public' AND tablename = 'products';
