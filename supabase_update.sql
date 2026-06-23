
-- 1. Advanced Coupon System Updates
ALTER TABLE coupons 
ADD COLUMN IF NOT EXISTS limit_per_customer INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS applicable_for_new_customers BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS min_order_count INT DEFAULT 0,
ADD COLUMN IF NOT EXISTS min_order_value_for_history NUMERIC DEFAULT NULL,
ADD COLUMN IF NOT EXISTS buy_x_category_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS buy_x_product_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS buy_x_quantity INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS get_y_variant_ids UUID[] DEFAULT '{}',
ADD COLUMN IF NOT EXISTS get_y_quantity INT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS display_message TEXT DEFAULT NULL,
ADD COLUMN IF NOT EXISTS max_discount_amount NUMERIC DEFAULT NULL;

-- 2. Recipe Enhancements
ALTER TABLE recipes
ADD COLUMN IF NOT EXISTS sub_heading TEXT,
ADD COLUMN IF NOT EXISTS ingredients_list JSONB DEFAULT '[]', -- Structured ingredients
ADD COLUMN IF NOT EXISTS instructions_list JSONB DEFAULT '[]', -- Structured steps
ADD COLUMN IF NOT EXISTS linked_product_ids UUID[] DEFAULT '{}';

-- 3. About Page Section-based Editing
CREATE TABLE IF NOT EXISTS about_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    sort_order INT DEFAULT 0,
    title TEXT,
    subtitle TEXT,
    content TEXT,
    image_url TEXT,
    video_url TEXT,
    layout_type TEXT DEFAULT 'text_left', -- e.g., 'text_left', 'text_right', 'full_width'
    is_active BOOLEAN DEFAULT TRUE
);

-- 4. Ensure Product SEO fields & offline publishing
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS meta_description TEXT,
ADD COLUMN IF NOT EXISTS meta_keywords TEXT,
ADD COLUMN IF NOT EXISTS is_offline_only BOOLEAN DEFAULT FALSE;

-- 5. RLS for about_sections
ALTER TABLE about_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "About sections are viewable by everyone" ON about_sections;
DROP POLICY IF EXISTS "About sections manageable by admins" ON about_sections;

CREATE POLICY "About sections are viewable by everyone" 
ON about_sections FOR SELECT 
USING (true);

CREATE POLICY "About sections manageable by admins" 
ON about_sections FOR ALL 
TO authenticated
USING (
  EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true)
);

-- 6. Cart and Wishlist Persistence
CREATE TABLE IF NOT EXISTS cart_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    variant_id UUID NOT NULL REFERENCES product_variants(id) ON DELETE CASCADE,
    quantity INT NOT NULL DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, variant_id)
);

CREATE TABLE IF NOT EXISTS wishlist_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    product_id UUID NOT NULL REFERENCES products(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, product_id)
);

-- 7. Influencer Applications
CREATE TABLE IF NOT EXISTS influencer_applications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone_number TEXT NOT NULL,
    platform_link TEXT NOT NULL,
    follower_count TEXT NOT NULL,
    audience_type TEXT NOT NULL,
    reason_why TEXT NOT NULL,
    how_to_promote TEXT NOT NULL,
    status TEXT DEFAULT 'Pending'
);

-- RLS for Cart and Wishlist
ALTER TABLE cart_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE wishlist_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE influencer_applications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can manage their own cart" ON cart_items;
CREATE POLICY "Users can manage their own cart" ON cart_items
    FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage their own wishlist" ON wishlist_items;
CREATE POLICY "Users can manage their own wishlist" ON wishlist_items
    FOR ALL TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Anyone can apply to be an influencer" ON influencer_applications;
CREATE POLICY "Anyone can apply to be an influencer" ON influencer_applications
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view applications" ON influencer_applications;
CREATE POLICY "Admins can view applications" ON influencer_applications
    FOR SELECT TO authenticated
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- 8. Notifications
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    order_id UUID REFERENCES orders(id) ON DELETE SET NULL
);

ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own notifications" ON notifications;
CREATE POLICY "Users can view their own notifications" ON notifications
    FOR SELECT TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own notifications" ON notifications;
CREATE POLICY "Users can update their own notifications" ON notifications
    FOR UPDATE TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "System/Admins can insert notifications" ON notifications;
CREATE POLICY "System/Admins can insert notifications" ON notifications
    FOR INSERT TO authenticated WITH CHECK (true); -- Simplified for now, usually handled by triggers or admin

-- 9. Store settings WhatsApp Cloud API Configuration columns
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS whatsapp_phone_number_id TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS whatsapp_access_token TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS whatsapp_template_name TEXT;
ALTER TABLE store_settings ADD COLUMN IF NOT EXISTS whatsapp_recipient_numbers TEXT;

-- 10. Promotional Content Table and Permissions
CREATE TABLE IF NOT EXISTS promotional_content (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    type TEXT NOT NULL CHECK (type IN ('image_carousel', 'text_carousel')),
    is_active BOOLEAN DEFAULT TRUE,
    sort_order INT DEFAULT 0,
    layout_style TEXT CHECK (layout_style IN ('side_by_side', 'full_banner', NULL)),
    image_url TEXT,
    title TEXT,
    subtitle TEXT,
    text TEXT,
    button_text TEXT,
    button_link_page TEXT,
    button_link_context JSONB DEFAULT '{}'::jsonb,
    carousel_duration_seconds INT DEFAULT 7,
    color_scheme TEXT CHECK (color_scheme IN ('green', 'beige', NULL))
);

-- Enable RLS
ALTER TABLE promotional_content ENABLE ROW LEVEL SECURITY;

-- Select policies (Allow everyone to view active slides)
DROP POLICY IF EXISTS "Anyone can view active promotional content" ON promotional_content;
CREATE POLICY "Anyone can view active promotional content" ON promotional_content
    FOR SELECT USING (is_active = true);

-- Select policies for Admins (Allow viewing all template banners)
DROP POLICY IF EXISTS "Admins can view all promotional content" ON promotional_content;
CREATE POLICY "Admins can view all promotional content" ON promotional_content
    FOR SELECT TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Admin insert, update, delete permissions
DROP POLICY IF EXISTS "Admins can insert promotional content" ON promotional_content;
CREATE POLICY "Admins can insert promotional content" ON promotional_content
    FOR INSERT TO authenticated 
    WITH CHECK (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins can update promotional content" ON promotional_content;
CREATE POLICY "Admins can update promotional content" ON promotional_content
    FOR UPDATE TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

DROP POLICY IF EXISTS "Admins can delete promotional content" ON promotional_content;
CREATE POLICY "Admins can delete promotional content" ON promotional_content
    FOR DELETE TO authenticated 
    USING (EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND is_admin = true));

-- Create helpful indexes for performance
CREATE INDEX IF NOT EXISTS idx_promotional_content_sort ON promotional_content(sort_order);
