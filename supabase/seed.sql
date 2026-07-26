-- ============================================================================
-- NAMOQR DATABASE SEED SCRIPT (ADMIN AUTH & DEFAULT TEMPLATES)
-- Admin Account: worthitellp@gmail.com
-- Password: NamoQR#WorthIT@2026!Secured
-- ============================================================================

-- Enable pgcrypto extension for password hashing
CREATE EXTENSION IF NOT EXISTS "pgcrypto";
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. SEED ADMIN USER IN AUTH.USERS (Real Supabase Auth Integration)
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
    '00000000-0000-0000-0000-000000000000',
    'a0eebc99-9c0b-4ef8-bb6d-6bb9bd380a11',
    'authenticated',
    'authenticated',
    'worthitellp@gmail.com',
    crypt('NamoQR#WorthIT@2026!Secured', gen_salt('bf')),
    NOW(),
    '{"provider": "email", "providers": ["email"]}'::jsonb,
    '{"full_name": "WorthIT Fleet Admin", "role": "admin"}'::jsonb,
    NOW(),
    NOW()
) ON CONFLICT (id) DO UPDATE SET
    email = 'worthitellp@gmail.com',
    encrypted_password = crypt('NamoQR#WorthIT@2026!Secured', gen_salt('bf')),
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
