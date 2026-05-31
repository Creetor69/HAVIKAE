
export type Page = 'home' | 'shop' | 'product' | 'about' | 'recipes' | 'contact' | 'login' | 'signup' | 'profile' | 'checkout' | 'recipeDetail' | 'admin' | 'wishlist' | 'compare' | 'legal' | 'combos' | 'influencer' | 'partners' | 'applyInfluencer' | 'sitemap' | 'social' | 'notFound';
export type PageContext = { productId?: string; recipeId?: string; category?: string; documentId?: string; blogPostSlug?: string; };

export type StoreSettings = {
    id: number;
    shipping_rate: number;
    free_shipping_threshold: number;
    is_cod_enabled: boolean;
    visible_influencer_commission: number;
    actual_influencer_commission: number;
    influencer_discount_percentage: number;
    influencer_min_cart_value: number;
    shipping_tiers?: { min_cart_value: number; shipping_rate: number }[] | null;
    logo_url?: string | null;
    whatsapp_number?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    maps_embed_url?: string | null;
    carousel_theme?: 'green' | 'beige' | null;
    background_color?: string | null;
    carousel_background_color?: string | null;
    razorpay_key_id?: string | null;
    email?: string | null;
    mobile?: string | null;
};

export type NutritionInfo = { key: string; value: string; };

export type ProductVariant = {
    id: string;
    product_id: string;
    net_weight: string;
    price: number;
    mrp: number | null;
    stock_quantity: number;
    created_at: string;
};

// FIX: Added Category type which was missing.
export type Category = {
    id: string;
    name: string;
    image_url?: string | null;
    created_at: string;
};

export type Product = {
    id: string;
    created_at: string;
    name: string;
    tagline: string | null;
    description: string | null;
    gst_rate: number;
    image_urls: string[];
    categories: { id: string, name: string } | null;
    category_id: string | null;
    spice_level: 'Mild' | 'Medium' | 'Hot' | 'None' | null;
    is_vegan: boolean;
    is_sponsored: boolean;
    is_active: boolean; 
    ingredients: string[] | null;
    how_to_use: string | null;
    benefits: string | null;
    nutrition: NutritionInfo[] | null;
    pairs_well_with: string[] | null;
    average_rating: number | null;
    review_count: number | null;
    product_variants: ProductVariant[];
    meta_title: string | null;
    meta_description: string | null;
    meta_keywords: string | null;
    video_url: string | null;
    slug?: string | null;
};

export type ProductInsert = Omit<Product, 'id' | 'created_at' | 'categories' | 'product_variants' | 'average_rating' | 'review_count'> & { id?: string };
export type ProductUpdate = Partial<ProductInsert>;

export type CartItem = {
    productId: string;
    variantId: string;
    name: string;
    imageUrl: string;
    net_weight: string;
    price: number;
    mrp: number | null;
    gst_rate: number;
    quantity: number;
    stock_quantity: number;
};

// FIX: Added OrderItem type which was missing as an explicit export.
export type OrderItem = {
    product_id: string;
    variant_id: string;
    name: string;
    price: number;
    image_url: string;
    quantity: number;
    net_weight: string;
};

export type Order = {
    id: string; 
    order_number: number;
    created_at: string; 
    user_id: string; 
    items: OrderItem[];
    total: number; 
    status: 'Processing' | 'Payment Received' | 'Shipped' | 'Delivered' | 'Cancelled'; 
    points_redeemed: number | null; 
    payment_method: 'Card' | 'UPI' | 'Cash on Delivery' | 'Razorpay' | null; 
    payment_id: string | null; 
    coupon_code: string | null;
    discount_amount: number | null;
    shipping_amount: number | null;
    shipping_address: any | null;
    commission_earned: number | null;
    shipped_at: string | null;
    tracking_id: string | null;
    tracking_link: string | null;
    courier_name: string | null;
};

// FIX: Added OrderInsert type which was missing.
export type OrderInsert = Omit<Order, 'id' | 'order_number' | 'created_at'>;

export type Coupon = {
    id: string;
    created_at: string;
    code: string;
    discount_type: 'percentage' | 'fixed' | 'free_shipping' | 'buy_x_get_y';
    discount_value: number;
    max_discount_amount: number | null;
    min_cart_value: number | null;
    is_active: boolean;
    usage_limit: number | null;
    times_used: number;
    user_id?: string | null;
    limit_per_customer?: number | null;
    applicable_for_new_customers: boolean;
    min_order_count: number;
    min_order_value_for_history: number | null;
    is_sponsored: boolean;
    show_in_banner: boolean;
    show_progress_bar: boolean;
    show_custom_message: boolean;
    buy_x_category_ids: string[];
    buy_x_product_ids: string[];
    buy_x_quantity: number | null;
    get_y_variant_ids: string[];
    get_y_quantity: number | null;
    get_y_variant_id?: string | null;
    display_message: string | null;
    banner_text?: string | null;
};

export type CouponInsert = Omit<Coupon, 'id' | 'created_at' | 'times_used'>;
export type CouponUpdate = Partial<CouponInsert>;

// FIX: Added Profile type which was missing.
export type Profile = {
    id: string;
    created_at: string;
    updated_at: string | null;
    name: string;
    email: string | null;
    mobile: string | null;
    reward_points: number;
    is_admin: boolean;
    is_influencer: boolean;
    upi_details?: any;
    bank_details?: any;
};

export type User = Profile & {
    email: string;
};

// FIX: Added AuthCredentials type which was missing.
export type AuthCredentials = {
    loginId: string;
    password?: string;
};

// FIX: Added NewUser type which was missing.
export type NewUser = {
    name: string;
    email: string;
    mobile?: string;
    password?: string;
};

export type PromotionalContent = {
    id: string;
    created_at: string;
    type: 'image_carousel' | 'text_carousel';
    is_active: boolean;
    sort_order: number;
    layout_style: 'side_by_side' | 'full_banner' | null;
    image_url: string | null;
    title: string | null;
    subtitle: string | null;
    text: string | null;
    button_text: string | null;
    button_link_page: string | null; 
    button_link_context: Record<string, any> | null;
    carousel_duration_seconds: number | null;
    color_scheme?: 'green' | 'beige' | null;
};

export type ProductCombo = {
    id: string;
    created_at: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_active: boolean;
    items: { variant_id: string; quantity: number; }[];
};

export type ProductComboInsert = Omit<ProductCombo, 'id' | 'created_at'>;

export type Recipe = {
    id: string;
    name: string;
    sub_heading?: string | null;
    description: string;
    imageUrl: string;
    videoUrl?: string;
    products: string[]; 
    ingredients: string[];
    instructions: string[];
    steps?: string[];
};

export type BlogPost = {
  id: string;
  created_at: string;
  updated_at: string;
  author_id: string;
  title: string;
  slug: string;
  content: string | null;
  featured_image_url: string | null;
  video_url: string | null; 
  is_published: boolean;
  published_at: string | null;
  post_type: 'article' | 'link';
  external_url: string | null;
  external_meta: { title?: string; description?: string; image?: string; site_name?: string; } | null;
  embed_code: string | null;
  profiles: { name: string; } | null;
};

// FIX: Added BlogPostInsert and BlogPostUpdate which were missing.
export type BlogPostInsert = Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'profiles'>;
export type BlogPostUpdate = Partial<BlogPostInsert>;

export type BlogComment = {
    id: string;
    created_at: string;
    post_id: string;
    user_id: string;
    parent_comment_id: string | null;
    content: string;
    profiles?: { name: string } | null;
};

export type BlogCommentInsert = Omit<BlogComment, 'id' | 'created_at' | 'profiles'>;

export type OrderAnalyticsData = {
    total_revenue: number; total_orders: number; cancelled_orders: number; delivered_orders: number; total_items_sold: number;
};
export type SoldItemSummary = { product_id: string; product_name: string; total_quantity_sold: number; };

export type Address = { id: string; user_id: string; address_line_1: string; address_line_2: string | null; city: string; state: string; postal_code: string; country: string; phone_number: string; is_default: boolean; };
export type AddressInsert = Omit<Address, 'id'>;

// FIX: Added AddressUpdate which was missing.
export type AddressUpdate = Partial<AddressInsert>;

// FIX: Added WishlistItem type which was missing.
export type WishlistItem = {
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
};

// FIX: Added LegalDocument type which was missing.
export type LegalDocument = {
    id: string;
    title: string;
    content: string | null;
    updated_at: string;
};

export type LegalDocumentUpdate = {
    content?: string | null;
};

// FIX: Added SaleBanner type which was missing.
export type SaleBanner = {
  id: string;
  created_at: string;
  title: string;
  sale_start: string | null;
  sale_end: string | null;
  is_active: boolean;
  button_text: string | null;
  button_link_page: string | null;
  button_link_context: Record<string, any> | null;
  background_css: string | null;
};

// FIX: Added PageContent type which was missing.
export type PageContent = {
    id: string;
    page_slug: string;
    content: Record<string, any>;
    updated_at: string;
};

// FIX: Added Review and ReviewInsert which were missing.
export type Review = {
    id: string;
    created_at: string;
    user_id: string;
    product_id: string;
    rating: number;
    review_text: string | null;
    user_name: string;
};

export type ReviewInsert = Omit<Review, 'id' | 'created_at'>;

// FIX: Added InfluencerApplication and InfluencerApplicationInsert which were missing.
export type InfluencerApplication = {
    id: string;
    created_at: string;
    name: string;
    platform_link: string;
    follower_count: string;
    audience_type: string;
    phone_number: string;
    email: string;
    reason_why: string;
    how_to_promote: string;
    status: 'pending' | 'reviewed' | 'contacted' | 'accepted' | 'rejected';
};

export type InfluencerApplicationInsert = Omit<InfluencerApplication, 'id' | 'created_at' | 'status'>;

export type AboutSection = {
    id: string;
    title: string;
    subtitle: string | null;
    content: string | null;
    image_url: string | null;
    video_url: string | null;
    layout_type: 'text_left' | 'text_right' | 'full_width';
    sort_order: number;
    is_active: boolean;
    created_at: string;
};

export type AboutSectionInsert = Omit<AboutSection, 'id' | 'created_at'>;
export type AboutSectionUpdate = Partial<AboutSectionInsert>;

export type OfflineCustomer = {
    id: string;
    created_at: string;
    name: string;
    mobile: string;
    is_store: boolean;
    balance_due: number;
    total_spent: number;
    last_order_date: string | null;
    order_count: number;
    top_product_id: string | null;
    top_product_name: string | null;
    address: string | null;
};

export type OfflineOrderItem = {
    product_id: string;
    variant_id: string;
    name: string;
    price: number;
    quantity: number;
    net_weight: string;
};

export type OfflineOrder = {
    id: string;
    created_at: string;
    customer_id: string;
    items: OfflineOrderItem[];
    subtotal: number;
    discount: number;
    total: number;
    amount_paid: number;
    balance_due: number;
    payment_method: 'Cash' | 'UPI' | 'Bank';
    payment_status: 'Paid Full' | 'Partial Payment' | 'Payment Pending';
    dispatch_status: 'Handed Over' | 'Yet to be Dispatched' | 'Shipped' | 'Delivered';
    notes: string | null;
};

export type AppNotification = {
    id: string;
    created_at: string;
    user_id: string;
    title: string;
    message: string;
    type: 'order_placed' | 'order_shipped' | 'order_delivered' | 'order_cancelled' | 'general';
    is_read: boolean;
    order_id?: string | null;
};
