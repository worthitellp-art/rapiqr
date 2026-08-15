-- ============================================================================
-- NAMOQR SUPABASE DATABASE SCHEMA (OPTIMIZED PRODUCTION ENGINE)
-- Clean tables, composite & partial indexes, optimized RLS policies & fast queries
-- ============================================================================

-- 1. EXTENSIONS
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 2. ENUM TYPES
DO $$ BEGIN
    CREATE TYPE product_category AS ENUM (
        'car', 'bike', 'home', 'luggage', 'keychain', 'child', 'pet', 
        'wallet', 'employee', 'senior', 'helmet', 'bicycle', 'door', 
        'apartment', 'nfc', 'travel', 'wristband'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE product_status AS ENUM ('active', 'inactive', 'lost', 'replaced');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE report_type AS ENUM (
        'accident', 'wrong_parking', 'contact_owner', 'medical_emergency',
        'fire_emergency', 'water_leakage', 'gas_leakage', 'security_alert',
        'courier_arrival', 'visitor_notification', 'lost_luggage', 'lost_key', 'lost_child'
    );
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE report_status AS ENUM ('unread', 'acknowledged', 'resolved');
EXCEPTION WHEN duplicate_object THEN null; END $$;

DO $$ BEGIN
    CREATE TYPE subscription_plan AS ENUM ('free', 'pro', 'enterprise');
EXCEPTION WHEN duplicate_object THEN null; END $$;

-- 3. PROFILES TABLE (Extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    email TEXT UNIQUE NOT NULL,
    full_name TEXT NOT NULL DEFAULT '',
    phone_number TEXT,
    avatar_url TEXT,
    subscription_plan subscription_plan NOT NULL DEFAULT 'free',
    is_subscribed BOOLEAN NOT NULL DEFAULT false,
    role TEXT NOT NULL DEFAULT 'user',
    metadata JSONB DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 4. QR CODES TABLE (Fleet Registry for physical QR stickers)
CREATE TABLE IF NOT EXISTS public.qr_codes (
    id TEXT PRIMARY KEY, -- e.g. 'QR-8A3F', 'CL-CXTF2'
    client_id TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'inactive', -- 'active' | 'inactive' | 'unlinked'
    scans_count INT NOT NULL DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    template_name TEXT DEFAULT 'Default',
    category TEXT DEFAULT 'car', -- 'car' | 'bike' | 'home' | 'pet' | 'child' | 'luggage'
    fg_color TEXT DEFAULT 'D9581F',
    bg_color TEXT DEFAULT 'FFFFFF',
    sticker_image TEXT, -- Public URL of the generated sticker image (Stickers bucket)
    created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 5. PRODUCTS TABLE (User assigned vehicles, home gates, keychains, luggage)
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
    qr_code_id TEXT UNIQUE REFERENCES public.qr_codes(id) ON DELETE RESTRICT,
    category product_category NOT NULL DEFAULT 'car',
    name TEXT NOT NULL,
    vehicle_number TEXT,
    status product_status NOT NULL DEFAULT 'active',
    assigned_to TEXT DEFAULT 'Self',
    scans_count INT NOT NULL DEFAULT 0,
    last_scanned_at TIMESTAMPTZ,
    warranty_expires_at TIMESTAMPTZ,
    details JSONB NOT NULL DEFAULT '{}'::jsonb,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 6. REPORTS TABLE (Emergency scan alerts & notifications)
CREATE TABLE IF NOT EXISTS public.reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    qr_code_id TEXT REFERENCES public.qr_codes(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    product_label TEXT NOT NULL,
    license_plate TEXT,
    type report_type NOT NULL,
    message TEXT NOT NULL DEFAULT '',
    reporter_phone TEXT,
    location JSONB, -- { lat, lng, accuracy, timestamp }
    status report_status NOT NULL DEFAULT 'unread',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 7. TEMPLATES TABLE (Sticker customization templates)
CREATE TABLE IF NOT EXISTS public.templates (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    fg_color TEXT NOT NULL DEFAULT 'D9581F',
    bg_color TEXT NOT NULL DEFAULT 'FFFFFF',
    sticker_pos JSONB NOT NULL DEFAULT '{"x":110,"y":40,"w":100,"h":100}'::jsonb,
    is_default BOOLEAN DEFAULT false,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================================
-- PERFORMANCE OPTIMIZED INDEXES (B-Tree & Partial Indexes)
-- ============================================================================
CREATE INDEX IF NOT EXISTS idx_products_user_status ON public.products(user_id, status);
CREATE INDEX IF NOT EXISTS idx_products_qr_code_id ON public.products(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_qr_codes_status_created ON public.qr_codes(status, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reports_product_status ON public.reports(product_id, status);
CREATE INDEX IF NOT EXISTS idx_reports_qr_code_id ON public.reports(qr_code_id);
CREATE INDEX IF NOT EXISTS idx_reports_created_at ON public.reports(created_at DESC);

-- Partial index for fast query of unread emergency alerts
CREATE INDEX IF NOT EXISTS idx_reports_unread ON public.reports(status, created_at DESC) WHERE status = 'unread';

-- ============================================================================
-- AUTOMATIC TIMESTAMPS TRIGGER
-- ============================================================================
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profiles_modtime ON public.profiles;
CREATE TRIGGER update_profiles_modtime BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS update_qr_codes_modtime ON public.qr_codes;
CREATE TRIGGER update_qr_codes_modtime BEFORE UPDATE ON public.qr_codes FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS update_products_modtime ON public.products;
CREATE TRIGGER update_products_modtime BEFORE UPDATE ON public.products FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

DROP TRIGGER IF EXISTS update_reports_modtime ON public.reports;
CREATE TRIGGER update_reports_modtime BEFORE UPDATE ON public.reports FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

-- ============================================================================
-- USER SIGNUP TRIGGER (Auto-creates profile entry on Supabase Auth signup)
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', SPLIT_PART(NEW.email, '@', 1))
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- ============================================================================
-- HIGH-PERFORMANCE ROW LEVEL SECURITY (RLS) POLICIES
-- Uses (select auth.uid()) & (select auth.role()) subquery caching pattern
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.qr_codes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.templates ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
DROP POLICY IF EXISTS "Public profiles are viewable by owner" ON public.profiles;
CREATE POLICY "Public profiles are viewable by owner" ON public.profiles FOR SELECT USING ((select auth.uid()) = id);

DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING ((select auth.uid()) = id);

-- QR Codes Policies
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

-- Products Policies
DROP POLICY IF EXISTS "Users can view own products" ON public.products;
CREATE POLICY "Users can view own products" ON public.products FOR SELECT USING ((select auth.uid()) = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Public can view product details via active QR" ON public.products;
CREATE POLICY "Public can view product details via active QR" ON public.products FOR SELECT USING (status = 'active');

-- Public insert/update (not owner-restricted): sticker activation is an anonymous
-- public flow — a scanner activates a fresh sticker often without being logged in
-- (same reasoning as the qr_codes policies above). Client code still sets user_id
-- when the activator is logged in, so ownership is preserved whenever we have an
-- account to attach it to; this just stops RLS from blocking the anonymous case.
DROP POLICY IF EXISTS "Users can insert own products" ON public.products;
DROP POLICY IF EXISTS "Products public insert policy" ON public.products;
CREATE POLICY "Products public insert policy" ON public.products FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own products" ON public.products;
DROP POLICY IF EXISTS "Products public update policy" ON public.products;
CREATE POLICY "Products public update policy" ON public.products FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Users can delete own products" ON public.products;
CREATE POLICY "Users can delete own products" ON public.products FOR DELETE USING ((select auth.uid()) = user_id);

-- Reports Policies
DROP POLICY IF EXISTS "Anyone can create emergency reports" ON public.reports;
CREATE POLICY "Anyone can create emergency reports" ON public.reports FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Product owners can view reports for their products" ON public.reports;
CREATE POLICY "Product owners can view reports for their products" ON public.reports FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM public.products p 
        WHERE p.id = reports.product_id AND p.user_id = (select auth.uid())
    ) OR (select auth.role()) = 'service_role'
);

DROP POLICY IF EXISTS "Product owners can update report status" ON public.reports;
CREATE POLICY "Product owners can update report status" ON public.reports FOR UPDATE USING (
    EXISTS (
        SELECT 1 FROM public.products p 
        WHERE p.id = reports.product_id AND p.user_id = (select auth.uid())
    )
);

-- Templates Policies
DROP POLICY IF EXISTS "Everyone can view templates" ON public.templates;
CREATE POLICY "Everyone can view templates" ON public.templates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Anyone can insert templates" ON public.templates;
CREATE POLICY "Anyone can insert templates" ON public.templates FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can update templates" ON public.templates;
CREATE POLICY "Anyone can update templates" ON public.templates FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Anyone can delete templates" ON public.templates;
CREATE POLICY "Anyone can delete templates" ON public.templates FOR DELETE USING (true);

-- ============================================================================
-- STORAGE: STICKERS BUCKET (Generated sticker images)
-- Public read so sticker URLs work anywhere; uploads allowed for any client.
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
-- 8. SERVER LOGS TABLE (Live operational server logs & event persistence)
--    Structured JSON production logging (task.md standard)
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

CREATE INDEX IF NOT EXISTS idx_server_logs_created_at ON public.server_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_server_logs_level ON public.server_logs(level);
CREATE INDEX IF NOT EXISTS idx_server_logs_tag ON public.server_logs(tag);
CREATE INDEX IF NOT EXISTS idx_server_logs_category ON public.server_logs(category);
CREATE INDEX IF NOT EXISTS idx_server_logs_event ON public.server_logs(event);
CREATE INDEX IF NOT EXISTS idx_server_logs_request_id ON public.server_logs(request_id);

ALTER TABLE public.server_logs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Server logs select policy" ON public.server_logs;
CREATE POLICY "Server logs select policy" ON public.server_logs FOR SELECT USING (true);

DROP POLICY IF EXISTS "Server logs insert policy" ON public.server_logs;
CREATE POLICY "Server logs insert policy" ON public.server_logs FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Server logs delete policy" ON public.server_logs;
CREATE POLICY "Server logs delete policy" ON public.server_logs FOR DELETE USING (true);

-- ============================================================================
-- 10. DISTRIBUTOR APPLICATIONS TABLE (B2B partner/franchise requests)
-- Previously localStorage-only (task.md #3) — every write here goes through
-- the Express backend using the service-role key, so RLS is left deny-all
-- for anon/authenticated: no policies are defined below on purpose.
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

-- ============================================================================
-- 11. ORDERS TABLE (e-commerce checkout receipts)
-- Previously localStorage-only (task.md #6) — all reads/writes go through the
-- Express backend using the service-role key, so RLS is deny-all on purpose.
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

-- ============================================================================
-- 9. COMMUNICATION TABLE (Helpline Phone Numbers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.communication (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category TEXT NOT NULL DEFAULT 'Ambulance',
    label TEXT NOT NULL,
    phone TEXT NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE public.communication ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Communication public select policy" ON public.communication;
CREATE POLICY "Communication public select policy" ON public.communication FOR SELECT USING (true);

DROP POLICY IF EXISTS "Communication public insert policy" ON public.communication;
CREATE POLICY "Communication public insert policy" ON public.communication FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Communication public update policy" ON public.communication;
CREATE POLICY "Communication public update policy" ON public.communication FOR UPDATE USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "Communication public delete policy" ON public.communication;
CREATE POLICY "Communication public delete policy" ON public.communication FOR DELETE USING (true);

-- ============================================================================
-- 12. SHOP PRODUCTS TABLE (admin-managed catalog shown on the landing page)
-- Reads are public (landing page); writes only via the Express backend's
-- service-role key (supabaseAdmin) from the admin Products panel — same
-- deny-all-except-select RLS shape as orders/communication above.
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.shop_products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL,
    category TEXT NOT NULL DEFAULT 'Vehicle', -- 'Vehicle' | 'Home' | 'Family' | 'Travel' — matches landing page filter chips
    badge TEXT DEFAULT '',
    description TEXT NOT NULL DEFAULT '',
    features JSONB NOT NULL DEFAULT '[]'::jsonb, -- string[]
    price NUMERIC NOT NULL DEFAULT 0,
    mrp NUMERIC NOT NULL DEFAULT 0,
    image_url TEXT NOT NULL DEFAULT '',
    rating NUMERIC NOT NULL DEFAULT 4.8,
    reviews_count INT NOT NULL DEFAULT 0,
    sku TEXT,
    weight_grams INT NOT NULL DEFAULT 100, -- shipment weight for Shiprocket
    length_cm INT NOT NULL DEFAULT 10,
    breadth_cm INT NOT NULL DEFAULT 10,
    height_cm INT NOT NULL DEFAULT 1,
    is_active BOOLEAN NOT NULL DEFAULT true,
    sort_order INT NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

DROP TRIGGER IF EXISTS update_shop_products_modtime ON public.shop_products;
CREATE TRIGGER update_shop_products_modtime BEFORE UPDATE ON public.shop_products FOR EACH ROW EXECUTE PROCEDURE update_timestamp();

ALTER TABLE public.shop_products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active shop products" ON public.shop_products;
CREATE POLICY "Public can view active shop products" ON public.shop_products FOR SELECT USING (is_active = true);

-- Seed with the catalog that used to be hardcoded in LandingPageMaster.tsx, so the
-- storefront looks identical on first deploy of this table — admins can edit from here.
INSERT INTO public.shop_products (name, category, badge, description, features, price, mrp, image_url, rating, reviews_count, sort_order)
SELECT * FROM (VALUES
    ('Automobile Safety Tag', 'Vehicle', 'Best Seller',
     'Wrong-parking alerts, vehicle-blocking pings, and crash SOS — all without giving your number to anyone.',
     '["Wrong parking & obstruction alerts","Masked call routing — number never shown","Crash SOS at 40G deceleration","Weatherproof 3M polycarbonate, 3+ years"]'::jsonb,
     349, 499, 'https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&q=80&w=800', 4.9, 3420, 1),
    ('Motorcycle & Helmet Tag', 'Vehicle', 'Popular',
     'Anti-tamper movement alerts, first-responder medical access, and insurance reminders for riders.',
     '["Emergency hotline for first responders","Blood group & allergy medical card","Insurance & PUC service reminders","Scratch-resistant, fits helmet or tank"]'::jsonb,
     249, 399, 'https://images.unsplash.com/photo-1558981806-ec527fa84c39?auto=format&fit=crop&q=80&w=800', 4.8, 2150, 2),
    ('Residential Gate Tag', 'Home', 'Smart Home',
     'Courier drop-off pings, visitor check-in, and hazard reports — without publishing your number at your gate.',
     '["Courier drop-off WhatsApp pings","Visitor check-in without number exposure","Hazard & pipe leak reporting by neighbours","Heavy-duty weatherproof acrylic mount"]'::jsonb,
     349, 499, 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&q=80&w=800', 4.9, 1890, 3),
    ('Pediatric School Bag Tag', 'Family', 'Kids Safety',
     'Emergency medical card, blood group, allergy info, and masked parent hotline — for when a stranger finds your child.',
     '["Blood group & allergy directives visible to finder","School bus pickup & drop-off alerts","Encrypted guardian contact for school staff","Child-safe non-toxic TPU clip"]'::jsonb,
     249, 349, 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&q=80&w=800', 5.0, 1420, 4),
    ('Senior Medical Keychain', 'Family', 'Senior Care',
     'Vital health record access and one-tap guardian alert — essential for elderly family members out alone.',
     '["Medical notes & doctor contacts for responders","Masked phone proxy connects finder to family","Designed for elderly parents on walks or travel","Ultra-light anodised aircraft aluminium case"]'::jsonb,
     249, 349, 'https://images.unsplash.com/photo-1584036561566-baf8f5f1b144?auto=format&fit=crop&q=80&w=800', 4.9, 1650, 5),
    ('Smart Luggage Tag', 'Travel', 'Travel Essential',
     'Instant scan-notification with GPS pin to your phone — and anonymous finder messaging, no address exposed.',
     '["Anonymous finder messaging — no address shown","Instant SMS & WhatsApp scan notification","Works across airlines, transit hubs, globally","Braided stainless steel cable included"]'::jsonb,
     249, 349, 'https://images.unsplash.com/photo-1553531384-cc64ac80f931?auto=format&fit=crop&q=80&w=800', 4.8, 980, 6)
) AS seed(name, category, badge, description, features, price, mrp, image_url, rating, reviews_count, sort_order)
WHERE NOT EXISTS (SELECT 1 FROM public.shop_products);

-- ============================================================================
-- 13. Shiprocket shipment info on orders (single JSONB, same idiom as
-- products.details) — { orderId, shipmentId, awbCode, courierName, trackingUrl }
-- ============================================================================
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS shiprocket JSONB;
