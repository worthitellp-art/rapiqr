-- ============================================================================
-- ADD: public.orders table (task.md #6)
-- ============================================================================
-- Checkout previously wrote order receipts to localStorage only — nothing
-- server-side, nothing linked to the account, gone if storage was cleared.
-- All reads/writes now go through the Express backend using the service-role
-- key (Server/routes/orderRoutes.js), so RLS is deny-all for anon/authenticated
-- on purpose — no policies are defined below.
--
-- Run this once against your Supabase project (SQL Editor or `psql`).
-- Safe to re-run — every statement is idempotent.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.orders (
    id TEXT PRIMARY KEY, -- e.g. '#NQ-123456'
    user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT NOT NULL,
    items JSONB NOT NULL DEFAULT '[]'::jsonb,
    subtotal NUMERIC NOT NULL DEFAULT 0,
    delivery_fee NUMERIC NOT NULL DEFAULT 0,
    total NUMERIC NOT NULL DEFAULT 0,
    payment_method TEXT NOT NULL DEFAULT 'upi',
    delivery_method TEXT NOT NULL DEFAULT 'standard',
    status TEXT NOT NULL DEFAULT 'placed', -- 'placed' | 'shipped' | 'delivered' | 'cancelled'
    shipping_address JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_orders_user_id ON public.orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orders_email ON public.orders(email);

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
