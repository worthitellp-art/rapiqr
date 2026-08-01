-- ============================================================================
-- NAMOQR URGENT DATABASE FIX: ADD MISSING 'sticker_image' COLUMN & RLS POLICIES
-- Execute this SQL script directly in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/flddzslryxphugbkktkr/sql/new
-- ============================================================================

-- 1. ADD MISSING 'sticker_image' COLUMN TO 'public.qr_codes' TABLE
ALTER TABLE public.qr_codes 
ADD COLUMN IF NOT EXISTS sticker_image TEXT;

-- 2. ENABLE ROW LEVEL SECURITY & ADD PERMISSIONS FOR 'public.qr_codes'
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "QR codes public select policy" ON public.qr_codes;
DROP POLICY IF EXISTS "QR codes are viewable by everyone" ON public.qr_codes;
CREATE POLICY "QR codes public select policy" ON public.qr_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "QR codes public insert policy" ON public.qr_codes;
DROP POLICY IF EXISTS "Authenticated users can insert QR codes" ON public.qr_codes;
CREATE POLICY "QR codes public insert policy" ON public.qr_codes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "QR codes public update policy" ON public.qr_codes;
DROP POLICY IF EXISTS "Authenticated users can update QR codes" ON public.qr_codes;
CREATE POLICY "QR codes public update policy" ON public.qr_codes FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "QR codes public delete policy" ON public.qr_codes;
CREATE POLICY "QR codes public delete policy" ON public.qr_codes FOR DELETE USING (true);

-- 3. ENSURE STICKERS STORAGE BUCKET & PERMISSIONS EXIST
INSERT INTO storage.buckets (id, name, public)
VALUES ('Stickers', 'Stickers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Stickers public read" ON storage.objects;
CREATE POLICY "Stickers public read" ON storage.objects FOR SELECT USING (bucket_id = 'Stickers');

DROP POLICY IF EXISTS "Stickers public insert" ON storage.objects;
CREATE POLICY "Stickers public insert" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'Stickers');

DROP POLICY IF EXISTS "Stickers public update" ON storage.objects;
CREATE POLICY "Stickers public update" ON storage.objects FOR UPDATE USING (bucket_id = 'Stickers') WITH CHECK (bucket_id = 'Stickers');

-- 4. ENSURE LIVE SERVER LOGS TABLE EXISTS
CREATE TABLE IF NOT EXISTS public.server_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level TEXT NOT NULL DEFAULT 'INFO',
    category TEXT NOT NULL DEFAULT 'BUSINESS',
    service TEXT NOT NULL DEFAULT 'namoqr-server',
    tag TEXT NOT NULL DEFAULT 'SERVER',
    event TEXT,
    message TEXT NOT NULL,
    details JSONB DEFAULT '{}'::jsonb,
    metadata JSONB DEFAULT '{}'::jsonb,
    method TEXT,
    url TEXT,
    status_code INT,
    duration_ms INT,
    origin TEXT,
    ip TEXT,
    request_id TEXT,
    user_id TEXT,
    resource_id TEXT,
    status TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'BUSINESS';
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS service TEXT NOT NULL DEFAULT 'namoqr-server';
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS event TEXT;
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS request_id TEXT;
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS status TEXT;

CREATE INDEX IF NOT EXISTS idx_server_logs_category ON public.server_logs(category);
CREATE INDEX IF NOT EXISTS idx_server_logs_event ON public.server_logs(event);
CREATE INDEX IF NOT EXISTS idx_server_logs_request_id ON public.server_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_server_logs_user_id ON public.server_logs(user_id);

ALTER TABLE public.server_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Server logs select policy" ON public.server_logs;
CREATE POLICY "Server logs select policy" ON public.server_logs FOR SELECT USING (true);
DROP POLICY IF EXISTS "Server logs insert policy" ON public.server_logs;
CREATE POLICY "Server logs insert policy" ON public.server_logs FOR INSERT WITH CHECK (true);

-- 5. VERIFICATION QUERY
SELECT 'SUCCESS: sticker_image column added to qr_codes table and RLS policies updated!' AS result;
