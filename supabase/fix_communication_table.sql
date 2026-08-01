-- ============================================================================
-- NAMOQR DATABASE MIGRATION: CREATE 'communication' TABLE FOR HELPLINE NUMBERS
-- Execute this SQL script directly in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/flddzslryxphugbkktkr/sql/new
-- ============================================================================

-- 1. CREATE 'public.communication' TABLE
CREATE TABLE IF NOT EXISTS public.communication (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL DEFAULT 'Ambulance',
    label TEXT NOT NULL,
    phone TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Performance Index for Communication Categories
CREATE INDEX IF NOT EXISTS idx_communication_category ON public.communication(category);
CREATE INDEX IF NOT EXISTS idx_communication_created_at ON public.communication(created_at DESC);

-- 2. ENABLE ROW LEVEL SECURITY & POLICIES
ALTER TABLE public.communication ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Communication public select policy" ON public.communication;
CREATE POLICY "Communication public select policy" ON public.communication FOR SELECT USING (true);

DROP POLICY IF EXISTS "Communication public insert policy" ON public.communication;
CREATE POLICY "Communication public insert policy" ON public.communication FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Communication public update policy" ON public.communication;
CREATE POLICY "Communication public update policy" ON public.communication FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Communication public delete policy" ON public.communication;
CREATE POLICY "Communication public delete policy" ON public.communication FOR DELETE USING (true);

-- 3. SEED DEFAULT HELPLINE PROVIDERS
INSERT INTO public.communication (category, label, phone) VALUES
('Ambulance', 'National Emergency Ambulance', '108'),
('Police', 'Police Control Room', '112'),
('Towing', '24x7 Roadside Assistance', '+91 1800-102-4400'),
('Flat Tire', 'Emergency Puncture Assist', '+91 98765-43210')
ON CONFLICT DO NOTHING;

-- 4. VERIFICATION QUERY
SELECT 'SUCCESS: public.communication table created with RLS policies and initial helplines!' AS result;
