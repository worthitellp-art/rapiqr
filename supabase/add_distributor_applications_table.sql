-- ============================================================================
-- ADD: public.distributor_applications table (task.md #3 / #15 / #16 / #17)
-- ============================================================================
-- Distributor/partner applications were previously localStorage-only — every
-- "approval" only existed in the admin's own browser and vanished if storage
-- was cleared. This table backs it with real persistence. All reads/writes
-- go through the Express backend using the service-role key (Server/routes/
-- distributorRoutes.js), so RLS is intentionally left deny-all for the anon/
-- authenticated roles below — no policies are defined on purpose.
--
-- Run this once against your Supabase project (SQL Editor or `psql`).
-- Safe to re-run — every statement is idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.distributor_applications (
    id TEXT PRIMARY KEY, -- e.g. 'DIST-10234'
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    user_name TEXT NOT NULL,
    user_email TEXT NOT NULL,
    phone TEXT NOT NULL,
    city TEXT NOT NULL,
    business TEXT NOT NULL,
    tier TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending', -- 'pending' | 'approved' | 'rejected'
    notes TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    approved_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_distributor_apps_status ON public.distributor_applications(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_distributor_apps_user_email ON public.distributor_applications(user_email);
CREATE INDEX IF NOT EXISTS idx_distributor_apps_phone ON public.distributor_applications(phone);

ALTER TABLE public.distributor_applications ENABLE ROW LEVEL SECURITY;
