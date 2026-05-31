
-- 0. Ensure UUID extension is available
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. Atomic functions for stock updates
-- Prevents overselling by ensuring quantity only drops if stock is available
CREATE OR REPLACE FUNCTION decrement_stock(p_variant_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity - p_quantity
  WHERE id = p_variant_id AND stock_quantity >= p_quantity;
END;
$$ LANGUAGE plpgsql;

-- Restores stock if an order is cancelled
CREATE OR REPLACE FUNCTION increment_stock(p_variant_id UUID, p_quantity INT)
RETURNS VOID AS $$
BEGIN
  UPDATE product_variants
  SET stock_quantity = stock_quantity + p_quantity
  WHERE id = p_variant_id;
END;
$$ LANGUAGE plpgsql;

-- 2. Detailed product fields for SEO, Video, and Health Info
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS meta_title TEXT,
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
ADD COLUMN IF NOT EXISTS video_url TEXT,
ADD COLUMN IF NOT EXISTS benefits TEXT,
ADD COLUMN IF NOT EXISTS how_to_use TEXT,
ADD COLUMN IF NOT EXISTS nutrition JSONB DEFAULT '[]',
ADD COLUMN IF NOT EXISTS ingredients TEXT[];

-- 3. Bundle System: Table for creating product combos
CREATE TABLE IF NOT EXISTS product_combos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    items JSONB NOT NULL DEFAULT '[]' -- Stores array of {variant_id, quantity}
);

-- 4. Store settings & Analytics enhancements
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS carousel_background_color TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS razorpay_key_id TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS commission_earned NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_amount NUMERIC DEFAULT 0;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC DEFAULT 0;

-- 5. RLS policies (Fixed syntax: Added 'FOR' keyword before 'ALL')
ALTER TABLE product_combos ENABLE ROW LEVEL SECURITY;

-- Clean up existing policies if any
DROP POLICY IF EXISTS "Combos are viewable by everyone" ON product_combos;
DROP POLICY IF EXISTS "Combos manageable by admins" ON product_combos;

CREATE POLICY "Combos are viewable by everyone" 
ON product_combos FOR SELECT 
USING (true);

CREATE POLICY "Combos manageable by admins" 
ON product_combos FOR ALL 
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);
