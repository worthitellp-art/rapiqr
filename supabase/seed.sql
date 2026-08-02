-- ============================================================================
-- NAMOQR DATABASE SEED SCRIPT (ADMIN AUTH & DEFAULT TEMPLATES)
-- Admin Account: worthitellp@gmail.com
-- Password: puYEJbTX%R2q!4qK7U8%
-- NOTE: This seed inserts a Supabase AUTH user + admin profile. The admin panel
-- login itself validates against ADMIN_EMAIL/ADMIN_PASSWORD env vars (server) or
-- VITE_ADMIN_EMAIL/VITE_ADMIN_PASSWORD (local dev) — NOT against this DB row.
-- ============================================================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SEED ADMIN USER IN AUTH.USERS (Real Supabase Auth Integration)
-- NOTE: instance_id is NULL (matches normal Supabase-created users; the all-zeros
-- instance_id used by older seeds can make GoTrue fail with "Database error querying
-- schema" during login). `confirmed_at` is the modern generated confirmation column.
-- If a broken row already exists, remove it first so the insert rebuilds it cleanly
-- (the profiles row below is re-upserted afterwards).
DELETE FROM auth.users WHERE id = 'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11';

-- NOTE: `confirmed_at` is a GENERATED ALWAYS column in modern Supabase auth schema
-- (derived from LEAST(email_confirmed_at, phone_confirmed_at)) — it must NOT be
-- inserted/updated explicitly or Postgres rejects the row. email_confirmed_at = NOW()
-- populates it automatically.
INSERT INTO auth.users (
    instance_id,
    id,
    aud,
    role,
    email,
    encrypted_password,
    email_confirmed_at,
    raw_app_meta_data,
    raw_user_meta_data,
    created_at,
    updated_at
) VALUES (
    NULL,
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'authenticated',
    'authenticated',
    'worthitellp@gmail.com',
    crypt('puYEJbTX%R2q!4qK7U8%', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "WorthIT Fleet Admin", "role": "admin"}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = 'worthitellp@gmail.com',
    encrypted_password = crypt('puYEJbTX%R2q!4qK7U8%', gen_salt('bf')),
    email_confirmed_at = NOW(),
    instance_id = NULL,
    updated_at = NOW();

-- 2. SEED ADMIN PROFILE IN PUBLIC.PROFILES
INSERT INTO public.profiles (
    id,
    email,
    full_name,
    role,
    subscription_plan,
    is_subscribed,
    created_at,
    updated_at
) VALUES (
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'worthitellp@gmail.com',
    'WorthIT Fleet Admin',
    'admin',
    'enterprise',
    true,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    subscription_plan = 'enterprise',
    is_subscribed = true,
    updated_at = NOW();

-- 3. SEED DEFAULT STICKER TEMPLATES & PLACEMENT
INSERT INTO public.templates (
    id,
    name,
    fg_color,
    bg_color,
    sticker_pos,
    is_default
) VALUES 
(
    '11111111-1111-1111-1111-111111111111',
    'Default',
    'D9581F',
    'FFFFFF',
    '{"x": 110, "y": 40, "w": 100, "h": 100}'::jsonb,
    true
),
(
    '22222222-2222-2222-2222-222222222222',
    'Midnight Stealth',
    '101828',
    'F8FAFC',
    '{"x": 110, "y": 40, "w": 100, "h": 100}'::jsonb,
    false
),
(
    '33333333-3333-3333-3333-333333333333',
    'Emergency Alert Red',
    'DC2626',
    'FEF2F2',
    '{"x": 110, "y": 40, "w": 100, "h": 100}'::jsonb,
    false
)
ON CONFLICT (name) DO UPDATE SET
    fg_color = EXCLUDED.fg_color,
    bg_color = EXCLUDED.bg_color,
    sticker_pos = EXCLUDED.sticker_pos;
