-- ============================================================
-- TREK MOTORS CUBA - Supabase Storage Buckets Setup
-- Execute this SQL in your Supabase SQL Editor to create
-- the required storage buckets and policies
-- ============================================================

-- 1. PRODUCTS BUCKET (for product images)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'products',
  'products',
  true,
  5242880, -- 5MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- 2. AVATARS BUCKET (for user profile pictures)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'avatars',
  'avatars',
  true,
  2097152, -- 2MB limit
  ARRAY['image/jpeg', 'image/png', 'image/webp']::text[]
)
ON CONFLICT (id) DO NOTHING;

-- ============================================================
-- STORAGE RLS POLICIES
-- ============================================================

DO $$
BEGIN
  -- Products bucket: public read, authenticated upload/delete
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public read products bucket') THEN
    CREATE POLICY "Allow public read products bucket" ON storage.objects FOR SELECT USING (bucket_id = 'products');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated upload products') THEN
    CREATE POLICY "Allow authenticated upload products" ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'products' AND auth.role() IN ('authenticated', 'anon')
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated delete products') THEN
    CREATE POLICY "Allow authenticated delete products" ON storage.objects FOR DELETE USING (
      bucket_id = 'products' AND auth.role() IN ('authenticated', 'anon')
    );
  END IF;

  -- Avatars bucket: public read, authenticated upload/delete
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow public read avatars bucket') THEN
    CREATE POLICY "Allow public read avatars bucket" ON storage.objects FOR SELECT USING (bucket_id = 'avatars');
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated upload avatars') THEN
    CREATE POLICY "Allow authenticated upload avatars" ON storage.objects FOR INSERT WITH CHECK (
      bucket_id = 'avatars' AND auth.role() = 'authenticated'
    );
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE schemaname = 'storage' AND tablename = 'objects' AND policyname = 'Allow authenticated delete avatars') THEN
    CREATE POLICY "Allow authenticated delete avatars" ON storage.objects FOR DELETE USING (
      bucket_id = 'avatars' AND auth.role() = 'authenticated'
    );
  END IF;
END $$;
