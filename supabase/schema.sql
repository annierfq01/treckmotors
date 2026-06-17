-- ============================================================
-- TREK MOTORS CUBA - Supabase Database Schema
-- Execute this SQL in your Supabase SQL Editor
-- ============================================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL DEFAULT 'pieza' CHECK (type IN ('moto', 'pieza')),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL DEFAULT 0,
  image TEXT DEFAULT '',
  description TEXT DEFAULT '',
  category TEXT DEFAULT '',
  stock INTEGER DEFAULT 0,
  features JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
  id TEXT PRIMARY KEY,
  user_email TEXT NOT NULL,
  user_name TEXT NOT NULL,
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  total NUMERIC NOT NULL DEFAULT 0,
  payment_method TEXT DEFAULT '',
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'pagado', 'enviado', 'cancelado')),
  shipping_address TEXT DEFAULT '',
  phone TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. USERS TABLE (profiles with local auth)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  password TEXT DEFAULT '',
  salt TEXT DEFAULT '',
  role TEXT DEFAULT 'cliente' CHECK (role IN ('admin', 'cliente')),
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
  id TEXT PRIMARY KEY,
  product_id TEXT REFERENCES public.products(id) ON DELETE CASCADE,
  user_email TEXT DEFAULT '',
  user_name TEXT DEFAULT '',
  rating INTEGER DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  comment TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SETTINGS TABLE (singleton row with id='system')
CREATE TABLE IF NOT EXISTS public.settings (
  id TEXT PRIMARY KEY DEFAULT 'system',
  payments_enabled BOOLEAN DEFAULT true,
  payment_methods JSONB DEFAULT '[]'::jsonb,
  contact_phone TEXT DEFAULT '',
  contact_email TEXT DEFAULT '',
  shop_address TEXT DEFAULT '',
  shop_hours TEXT DEFAULT '',
  reservations_enabled BOOLEAN DEFAULT true,
  facebook_url TEXT DEFAULT '',
  instagram_url TEXT DEFAULT '',
  whatsapp_number TEXT DEFAULT '',
  facebook_page_id TEXT DEFAULT '',
  facebook_page_access_token TEXT DEFAULT '',
  facebook_page_name TEXT DEFAULT '',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================
CREATE INDEX IF NOT EXISTS idx_products_type ON public.products (type);
CREATE INDEX IF NOT EXISTS idx_products_category ON public.products (category);
CREATE INDEX IF NOT EXISTS idx_orders_user_email ON public.orders (user_email);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders (status);
CREATE INDEX IF NOT EXISTS idx_reviews_product_id ON public.reviews (product_id);
CREATE INDEX IF NOT EXISTS idx_users_email ON public.users (email);

-- ============================================================
-- AUTO UPDATE updated_at TRIGGER
-- ============================================================
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_products_updated_at') THEN
    CREATE TRIGGER set_products_updated_at BEFORE UPDATE ON public.products
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_users_updated_at') THEN
    CREATE TRIGGER set_users_updated_at BEFORE UPDATE ON public.users
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_trigger WHERE tgname = 'set_settings_updated_at') THEN
    CREATE TRIGGER set_settings_updated_at BEFORE UPDATE ON public.settings
      FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;

-- ============================================================
-- ROW LEVEL SECURITY (RLS)
-- ============================================================
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.settings ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  -- Allow public read access for products, reviews, settings
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Allow public read products') THEN
    CREATE POLICY "Allow public read products" ON public.products FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Allow public read reviews') THEN
    CREATE POLICY "Allow public read reviews" ON public.reviews FOR SELECT USING (true);
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'settings' AND policyname = 'Allow public read settings') THEN
    CREATE POLICY "Allow public read settings" ON public.settings FOR SELECT USING (true);
  END IF;

  -- Allow authenticated users to insert reviews
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Allow authenticated insert reviews') THEN
    CREATE POLICY "Allow authenticated insert reviews" ON public.reviews FOR INSERT WITH CHECK (auth.role() = 'authenticated' OR auth.role() = 'anon');
  END IF;

  -- Allow admin full access via service_role
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'products' AND policyname = 'Allow service_role all products') THEN
    CREATE POLICY "Allow service_role all products" ON public.products FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'orders' AND policyname = 'Allow service_role all orders') THEN
    CREATE POLICY "Allow service_role all orders" ON public.orders FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'users' AND policyname = 'Allow service_role all users') THEN
    CREATE POLICY "Allow service_role all users" ON public.users FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'reviews' AND policyname = 'Allow service_role all reviews') THEN
    CREATE POLICY "Allow service_role all reviews" ON public.reviews FOR ALL USING (auth.role() = 'service_role');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'settings' AND policyname = 'Allow service_role all settings') THEN
    CREATE POLICY "Allow service_role all settings" ON public.settings FOR ALL USING (auth.role() = 'service_role');
  END IF;
END $$;
