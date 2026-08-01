-- ============================================================================
-- NAMOQR SUPABASE COMPLETE FIX MIGRATION SCRIPT
-- Execute this SQL script directly in your Supabase SQL Editor:
-- https://supabase.com/dashboard/project/flddzslryxphugbkktkr/sql/new
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================================
-- 2. STORAGE: STICKERS BUCKET & RLS POLICIES (Public Reads & Uploads)
-- ============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('Stickers', 'Stickers', true)
ON CONFLICT (id) DO UPDATE SET public = true;

DROP POLICY IF EXISTS "Stickers public read" ON storage.objects;
CREATE POLICY "Stickers public read" ON storage.objects
  FOR SELECT USING (bucket_id = 'Stickers');

DROP POLICY IF EXISTS "Stickers public insert" ON storage.objects;
CREATE POLICY "Stickers public insert" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'Stickers');

DROP POLICY IF EXISTS "Stickers public update" ON storage.objects;
CREATE POLICY "Stickers public update" ON storage.objects
  FOR UPDATE USING (bucket_id = 'Stickers') WITH CHECK (bucket_id = 'Stickers');

-- ============================================================================
-- 3. QR CODES TABLE & POLICIES (Allows QR code generation & updates)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive',
    scans_count INT NOT NULL DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    template_name TEXT DEFAULT 'Default',
    category TEXT DEFAULT 'car',
    fg_color TEXT DEFAULT 'D9581F',
    bg_color TEXT DEFAULT 'FFFFFF',
    activation_code TEXT,
    sticker_image TEXT,
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Ensure missing sticker_image column is added to existing qr_codes table
ALTER TABLE public.qr_codes 
ADD COLUMN IF NOT EXISTS sticker_image TEXT;

ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "QR codes are viewable by everyone" ON public.qr_codes;
DROP POLICY IF EXISTS "QR codes public select policy" ON public.qr_codes;
CREATE POLICY "QR codes public select policy" ON public.qr_codes FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "QR codes public insert policy" ON public.qr_codes;
CREATE POLICY "QR codes public insert policy" ON public.qr_codes FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Authenticated users can update QR codes" ON public.qr_codes;
DROP POLICY IF EXISTS "QR codes public update policy" ON public.qr_codes;
CREATE POLICY "QR codes public update policy" ON public.qr_codes FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "QR codes public delete policy" ON public.qr_codes;
CREATE POLICY "QR codes public delete policy" ON public.qr_codes FOR DELETE USING (true);

-- ============================================================================
-- 4. SERVER LOGS TABLE (Live Operational & HTTP Log Persistence)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.server_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    level TEXT NOT NULL DEFAULT 'INFO', -- 'DEBUG' | 'INFO' | 'SUCCESS' | 'HTTP' | 'EVENT' | 'WARN' | 'ERROR' | 'FATAL'
    category TEXT NOT NULL DEFAULT 'BUSINESS', -- 'HTTP' | 'AUTH' | 'USER' | 'BUSINESS' | 'DB' | 'EXTERNAL' | 'SECURITY' | 'ERROR' | 'SYSTEM'
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

-- Performance Indexes for Live Server Logs
CREATE INDEX IF NOT EXISTS idx_server_logs_created_at ON public.server_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_logs_level ON public.server_logs(level);
CREATE INDEX IF NOT EXISTS idx_server_logs_tag ON public.server_logs(tag);
CREATE INDEX IF NOT EXISTS idx_server_logs_category ON public.server_logs(category);
CREATE INDEX IF NOT EXISTS idx_server_logs_event ON public.server_logs(event);
CREATE INDEX IF NOT EXISTS idx_server_logs_request_id ON public.server_logs(request_id);
CREATE INDEX IF NOT EXISTS idx_server_logs_user_id ON public.server_logs(user_id);

-- Ensure missing structured columns exist on existing server_logs tables
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS category TEXT NOT NULL DEFAULT 'BUSINESS';
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS service TEXT NOT NULL DEFAULT 'namoqr-server';
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS event TEXT;
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS metadata JSONB DEFAULT '{}'::jsonb;
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS request_id TEXT;
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS user_id TEXT;
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS resource_id TEXT;
ALTER TABLE public.server_logs ADD COLUMN IF NOT EXISTS status TEXT;

-- Row Level Security (RLS) Policies for server_logs
ALTER TABLE public.server_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Server logs select policy" ON public.server_logs;
CREATE POLICY "Server logs select policy" ON public.server_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Server logs insert policy" ON public.server_logs;
CREATE POLICY "Server logs insert policy" ON public.server_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Server logs delete policy" ON public.server_logs;
CREATE POLICY "Server logs delete policy" ON public.server_logs FOR DELETE USING (true);

-- ============================================================================
-- 5. TEMPLATES TABLE & POLICIES (Ensures Unique Name Constraint & Access)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    fg_color TEXT NOT NULL DEFAULT 'D9581F',
    bg_color TEXT NOT NULL DEFAULT 'FFFFFF',
    sticker_pos JSONB NOT NULL DEFAULT '{"x":110,"y":40,"w":100,"h":100}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone can view templates" ON public.templates;
CREATE POLICY "Everyone can view templates" ON public.templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert templates" ON public.templates;
CREATE POLICY "Anyone can insert templates" ON public.templates FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update templates" ON public.templates;
CREATE POLICY "Anyone can update templates" ON public.templates FOR UPDATE USING (true) WITH CHECK (true);

-- ============================================================================
-- 6. VERIFICATION NOTICE
-- ============================================================================
SELECT 'Migration completed successfully! qr_codes table, server logs, stickers storage, and templates policies are active.' AS result;
