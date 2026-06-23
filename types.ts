

export type StoreSettings = {
    id: number;
    shipping_rate: number;
    free_shipping_threshold: number;
    is_cod_enabled: boolean;
    visible_influencer_commission: number;
    actual_influencer_commission: number;
    influencer_discount_percentage: number;
    influencer_min_cart_value: number;
    shipping_tiers?: ShippingTier[] | null;
    logo_url?: string | null;
    whatsapp_number?: string | null;
    instagram_url?: string | null;
    facebook_url?: string | null;
    maps_embed_url?: string | null;
    carousel_theme?: 'green' | 'beige' | null;
    background_color?: string | null;
    carousel_background_color?: string | null;
    razorpay_key_id?: string | null;
    whatsapp_phone_number_id?: string | null;
    whatsapp_access_token?: string | null;
    whatsapp_template_name?: string | null;
    whatsapp_recipient_numbers?: string | null;
};

export type StoreSettingsUpdate = Partial<Omit<StoreSettings, 'id'>>;

export type Page = 'home' | 'shop' | 'product' | 'about' | 'recipes' | 'contact' | 'login' | 'signup' | 'profile' | 'checkout' | 'cart' | 'recipeDetail' | 'admin' | 'wishlist' | 'compare' | 'legal' | 'blog' | 'blogPost' | 'influencer' | 'sitemap' | 'social' | 'notFound';
export type PageContext = { productId?: string; recipeId?: string; category?: string; documentId?: string; blogPostSlug?: string; };

export type ContactMessage = {
    id: string;
    created_at: string;
    name: string;
    email: string;
    message: string;
    status: 'new' | 'read' | 'replied';
};

export type Database = {
  public: {
    Tables: {
      store_settings: {
        Row: StoreSettings;
        Insert: StoreSettings;
        Update: StoreSettingsUpdate;
      };
      contact_messages: {
        Row: ContactMessage;
        Insert: Omit<ContactMessage, 'id' | 'created_at' | 'status'>;
        Update: Partial<ContactMessage>;
      };
      products: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      product_variants: {
        Row: ProductVariant;
        Insert: any;
        Update: any;
      };
      categories: {
        Row: Category;
        Insert: { name: string; image_url?: string | null };
        Update: { name?: string; image_url?: string | null };
      };
      cart_items: {
        Row: CartItemDB;
        Insert: any;
        Update: any;
      };
      orders: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      profiles: {
        Row: Profile;
        Insert: ProfileInsert;
        Update: ProfileUpdate;
      };
      coupons: {
        Row: Coupon;
        Insert: CouponInsert;
        Update: CouponUpdate;
      };
      influencer_coupons: {
        Row: InfluencerCoupon;
        Insert: InfluencerCouponInsert;
        Update: any;
      };
      wishlist: {
        Row: WishlistItem;
        Insert: { user_id: string; product_id: string };
        Update: any;
      };
      promotional_content: {
        Row: PromotionalContent;
        Insert: PromotionalContentInsert;
        Update: PromotionalContentUpdate;
      };
      legal_documents: {
        Row: LegalDocument;
        Insert: any;
        Update: LegalDocumentUpdate;
      };
      sale_banners: {
        Row: SaleBanner;
        Insert: SaleBannerInsert;
        Update: SaleBannerUpdate;
      };
      blog_posts: {
        Row: BlogPost;
        Insert: BlogPostInsert;
        Update: BlogPostUpdate;
      };
      blog_comments: {
        Row: BlogComment;
        Insert: BlogCommentInsert;
        Update: any;
      };
      influencer_withdrawals: {
        Row: InfluencerWithdrawal;
        Insert: InfluencerWithdrawalInsert;
        Update: InfluencerWithdrawalUpdate;
      };
      page_content: {
        Row: PageContent;
        Insert: any;
        Update: any;
      };
      reviews: {
        Row: Review;
        Insert: ReviewInsert;
        Update: any;
      };
      addresses: {
        Row: Address;
        Insert: AddressInsert;
        Update: AddressUpdate;
      };
      order_analytics: {
        Row: OrderAnalyticsData;
      };
      sold_items_summary: {
        Row: SoldItemSummary;
      };
      product_combos: {
        Row: ProductCombo;
        Insert: ProductComboInsert;
        Update: ProductComboUpdate;
      };
      recipes: {
        Row: Recipe; 
        Insert: RecipeInsert;
        Update: RecipeUpdate;
      };
    };
    Functions: {
      decrement_stock: {
        Args: { p_variant_id: string; p_quantity: number };
        Returns: void;
      };
      increment_stock: {
        Args: { p_variant_id: string; p_quantity: number };
        Returns: void;
      };
      set_default_address: {
        Args: { p_user_id: string; p_address_id: string };
        Returns: void;
      };
    };
  };
};

export type Recipe = {
    id: string;
    name: string;
    description: string;
    imageUrl: string;
    videoUrl?: string;
    products: string[]; 
    ingredients: string[];
    instructions: string[];
};

export type NutritionInfo = {
    key: string;
    value: string;
};

export type Category = {
    id: string;
    name: string;
    image_url?: string | null;
    created_at: string;
};

export type ProductVariant = {
    id: string;
    product_id: string;
    net_weight: string;
    price: number;
    mrp: number | null;
    stock_quantity: number;
    created_at: string;
};

// FIX: Added missing properties to conform to data structure in data/products.ts
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
};

// FIX: Added missing properties to conform to data structure
export type ProductInsert = {
    id: string;
    name: string;
    tagline?: string | null;
    description?: string | null;
    gst_rate: number;
    image_urls: string[];
    category_id?: string | null;
    spice_level?: 'Mild' | 'Medium' | 'Hot' | 'None' | null;
    is_vegan: boolean;
    is_sponsored?: boolean;
    is_active?: boolean;
    ingredients?: string[] | null;
    how_to_use?: string | null;
    benefits?: string | null;
    nutrition?: NutritionInfo[] | null;
    pairs_well_with?: string[] | null;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
};

// FIX: Added missing properties to conform to data structure
export type ProductUpdate = {
    name?: string;
    tagline?: string | null;
    description?: string | null;
    gst_rate?: number;
    image_urls?: string[];
    category_id?: string | null;
    spice_level?: 'Mild' | 'Medium' | 'Hot' | 'None' | null;
    is_vegan?: boolean;
    is_sponsored?: boolean;
    is_active?: boolean;
    ingredients?: string[] | null;
    how_to_use?: string | null;
    benefits?: string | null;
    nutrition?: NutritionInfo[] | null;
    pairs_well_with?: string[] | null;
    meta_title?: string | null;
    meta_description?: string | null;
    meta_keywords?: string | null;
};

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

export type OrderItem = {
    product_id: string;
    variant_id: string;
    name: string;
    price: number;
    image_url: string;
    quantity: number;
    net_weight: string;
};

export type Address = {
    id: string;
    created_at: string;
    user_id: string;
    address_line_1: string;
    address_line_2: string | null;
    city: string;
    state: string;
    postal_code: string;
    country: string;
    is_default: boolean;
    name?: string;
    mobile?: string | null;
    email?: string | null;
};

export type AddressInsert = {
    user_id: string;
    address_line_1: string;
    address_line_2?: string | null;
    city: string;
    state: string;
    postal_code: string;
    country?: string;
    is_default?: boolean;
};

export type AddressUpdate = {
    address_line_1?: string;
    address_line_2?: string | null;
    city?: string;
    state?: string;
    postal_code?: string;
    country?: string;
    is_default?: boolean;
};

export type Order = {
    id: string; 
    order_number: number;
    created_at: string; 
    user_id: string; 
    items: OrderItem[]; 
    total: number; 
    status: 'Processing' | 'Payment Received' | 'Shipped' | 'Delivered' | 'Cancelled'; 
    points_redeemed: number; 
    payment_method: 'Card' | 'UPI' | 'Cash on Delivery' | 'Razorpay' | null; 
    payment_id: string | null; 
    coupon_code: string | null;
    discount_amount: number | null;
    shipping_address: Address | null;
    tracking_number: string | null;
    courier_name: string | null;
    transaction_id: string | null;
    commission_earned: number | null;
};

export type OrderInsert = {
    user_id: string;
    items: OrderItem[];
    total: number;
    status: 'Processing' | 'Payment Received' | 'Shipped' | 'Delivered' | 'Cancelled';
    points_redeemed?: number | null;
    payment_method?: 'Card' | 'UPI' | 'Cash on Delivery' | 'Razorpay' | null;
    payment_id?: string | null;
    coupon_code?: string | null;
    discount_amount?: number | null;
    shipping_address?: Address | null;
    commission_earned?: number | null;
};

export type OrderUpdate = {
    status?: 'Processing' | 'Payment Received' | 'Shipped' | 'Delivered' | 'Cancelled';
    tracking_number?: string | null;
    courier_name?: string | null;
    transaction_id?: string | null;
};

export type Review = {
    id: string;
    created_at: string;
    user_id: string;
    product_id: string;
    rating: number;
    review_text: string | null;
    user_name: string;
};

export type ReviewInsert = {
    user_id: string;
    product_id: string;
    rating: number;
    review_text?: string | null;
    user_name: string;
};

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
    upi_details?: { upi_id: string; } | null;
    bank_details?: { account_holder_name: string; account_number: string; ifsc_code: string; bank_name: string; } | null;
};

export type ProfileInsert = {
    id: string;
    name: string;
    email?: string | null;
    mobile?: string | null;
    reward_points: number;
    is_admin: boolean;
    is_influencer: boolean;
};

export type ProfileUpdate = {
    reward_points?: number;
    upi_details?: { upi_id: string; } | null;
    bank_details?: { account_holder_name: string; account_number: string; ifsc_code: string; bank_name: string; } | null;
};

export type Coupon = {
    id: string;
    created_at: string;
    code: string;
    discount_type: 'percentage' | 'fixed' | 'free_shipping';
    discount_value: number;
    max_discount_amount: number | null;
    min_cart_value: number | null;
    is_active: boolean;
    usage_limit: number | null;
    times_used: number;
    user_id?: string | null;
    limit_per_customer?: number | null;
    applicable_for_new_customers?: boolean;
    min_order_count?: number;
    show_in_banner?: boolean;
};

export type CouponInsert = {
    code: string;
    discount_type: 'percentage' | 'fixed' | 'free_shipping';
    discount_value: number;
    max_discount_amount?: number | null;
    min_cart_value?: number | null;
    is_active?: boolean;
    usage_limit?: number | null;
    times_used?: number;
    limit_per_customer?: number | null;
    applicable_for_new_customers?: boolean;
    min_order_count?: number;
    show_in_banner?: boolean;
};

export type CouponUpdate = Partial<CouponInsert>;

export type WishlistItem = {
    id: string;
    user_id: string;
    product_id: string;
    created_at: string;
};

export type CartItemDB = {
    user_id: string;
    variant_id: string;
    quantity: number;
    created_at: string;
    updated_at: string;
};

export type User = Profile & {
    email: string;
};

export type AuthCredentials = {
    loginId: string; 
    password?: string;
};

export type NewUser = {
    name: string;
    email: string;
    mobile?: string;
    password?: string;
};

export type ChatMessage = {
  role: 'user' | 'model';
  parts: { text: string }[];
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

export type PromotionalContentInsert = {
    type: 'image_carousel' | 'text_carousel';
    is_active?: boolean;
    sort_order?: number;
    layout_style?: 'side_by_side' | 'full_banner' | null;
    image_url?: string | null;
    title?: string | null;
    subtitle?: string | null;
    text?: string | null;
    button_text?: string | null;
    button_link_page?: string | null;
    button_link_context?: Record<string, any> | null;
    carousel_duration_seconds?: number | null;
    color_scheme?: 'green' | 'beige' | null;
};

export type PromotionalContentUpdate = {
    type?: 'image_carousel' | 'text_carousel';
    is_active?: boolean;
    sort_order?: number;
    layout_style?: 'side_by_side' | 'full_banner' | null;
    image_url?: string | null;
    title?: string | null;
    subtitle?: string | null;
    text?: string | null;
    button_text?: string | null;
    button_link_page?: string | null;
    button_link_context?: Record<string, any> | null;
    carousel_duration_seconds?: number | null;
    color_scheme?: 'green' | 'beige' | null;
};

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

export type SaleBannerInsert = {
  title: string;
  sale_start?: string | null;
  sale_end?: string | null;
  is_active?: boolean;
  button_text?: string | null;
  button_link_page?: string | null;
  button_link_context?: Record<string, any> | null;
  background_css?: string | null;
};

export type SaleBannerUpdate = Partial<SaleBannerInsert>;

export type OrderAnalyticsData = {
    total_revenue: number;
    total_orders: number;
    cancelled_orders: number;
    delivered_orders: number;
    total_items_sold: number;
};

export type SoldItemSummary = {
    product_id: string;
    product_name: string;
    total_quantity_sold: number;
};

export type LegalDocument = {
    id: string;
    title: string;
    content: string | null;
    updated_at: string;
};

export type LegalDocumentUpdate = {
    content?: string | null;
};

export type PageContent = {
    id: string;
    page_slug: string;
    content: Record<string, any>;
    updated_at: string;
};

export type ShippingTier = {
    min_cart_value: number;
    shipping_rate: number;
};

export type ExternalMeta = {
    title?: string;
    description?: string;
    image?: string;
    site_name?: string;
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
  external_meta: ExternalMeta | null;
  profiles: { name: string; } | null;
};

export type BlogPostInsert = Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'profiles' | 'author_id'> & { author_id?: string };
export type BlogPostUpdate = Partial<Omit<BlogPost, 'id' | 'created_at' | 'updated_at' | 'author_id' | 'profiles'>>;

export type BlogComment = {
  id: string;
  created_at: string;
  post_id: string;
  user_id: string;
  parent_comment_id: string | null;
  content: string;
  profiles: { name: string; } | null;
};

export type BlogCommentInsert = {
  post_id: string;
  user_id: string;
  parent_comment_id?: string | null;
  content: string;
};

export type InfluencerCouponUsage = {
    order_id: string;
    created_at: string;
    order_total: number;
    coupon_code: string;
    influencer_id: string;
};

export type LeaderboardEntry = {
    user_id: string;
    name: string;
    total_earnings: number;
};

export type InfluencerWithdrawal = {
    id: string;
    user_id: string;
    amount: number;
    status: 'pending' | 'completed' | 'rejected';
    created_at: string;
    updated_at: string;
    payment_details: Record<string, any>;
    admin_notes: string | null;
};

export type InfluencerWithdrawalInsert = {
    user_id: string;
    amount: number;
    status: 'pending';
    payment_details: Record<string, any>;
};

export type InfluencerWithdrawalUpdate = {
    status?: 'pending' | 'completed' | 'rejected';
    admin_notes?: string;
};

export type InfluencerCoupon = {
    id: string;
    user_id: string;
    code: string;
    times_used: number;
    is_active: boolean;
    created_at: string;
    profiles?: { name: string; } | null;
};

export type AdminWithdrawal = InfluencerWithdrawal & {
  profiles: { name: string; } | null;
};

export type InfluencerCouponInsert = {
    user_id: string;
    code: string;
};

export type ProductCombo = {
    id: string;
    created_at: string;
    name: string;
    description: string | null;
    price: number;
    image_url: string | null;
    is_active: boolean;
    items: ComboItem[];
};

export type ComboItem = {
    variant_id: string;
    quantity: number;
};

export type ProductComboInsert = Omit<ProductCombo, 'id' | 'created_at'>;
export type ProductComboUpdate = Partial<ProductComboInsert>;

export type RecipeInsert = Omit<Recipe, 'id' | 'imageUrl' | 'videoUrl'> & { image_url: string; video_url?: string };
export type RecipeUpdate = Partial<RecipeInsert>;
