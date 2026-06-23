-- ==========================================
-- SUPABASE / POSTGRESQL SCHEMA MIGRATION
-- Use these statements in your Supabase SQL Editor
-- to add the necessary columns and set up storage policies
-- for Product Image links & uploads.
-- ==========================================

-- 1. Ensure 'image_urls' array column exists on 'products' table.
-- If the table already has a scalar column, we must safely add it.
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name='products' AND column_name='image_urls'
    ) THEN
        ALTER TABLE products ADD COLUMN image_urls text[] DEFAULT '{}'::text[];
    END IF;
END $$;

-- 2. Create the 'media' storage bucket if it doesn't already exist.
-- This bucket is used to host your uploaded product images.
INSERT INTO storage.buckets (id, name, public)
VALUES ('media', 'media', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- 3. Enable RLS (Row Level Security) on storage.objects if not already enabled.
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- 4. Create open security policies for the 'media' storage bucket.
-- These policies allow anyone to view files (public GET) and permit authenticated 
-- or general admins to upload/delete files. Tune these based on your auth rules.
DROP POLICY IF EXISTS "Public Select Policy" ON storage.objects;
CREATE POLICY "Public Select Policy" ON storage.objects
FOR SELECT USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Any Insert Policy" ON storage.objects;
CREATE POLICY "Any Insert Policy" ON storage.objects
FOR INSERT WITH CHECK (bucket_id = 'media');

DROP POLICY IF EXISTS "Any Update Policy" ON storage.objects;
CREATE POLICY "Any Update Policy" ON storage.objects
FOR UPDATE USING (bucket_id = 'media');

DROP POLICY IF EXISTS "Any Delete Policy" ON storage.objects;
CREATE POLICY "Any Delete Policy" ON storage.objects
FOR DELETE USING (bucket_id = 'media');
