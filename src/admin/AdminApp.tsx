
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { supabase } from './supabaseClient';
import { 
    Order, Product, ProductUpdate, Coupon, CouponInsert, ProductInsert, 
    PromotionalContent, PromotionalContentInsert, PromotionalContentUpdate, 
    LegalDocument, LegalDocumentUpdate, SaleBanner, SaleBannerInsert, SaleBannerUpdate, 
    StoreSettings, StoreSettingsUpdate, Category, ProductVariant, CouponUpdate, BlogPost, BlogPostInsert, BlogPostUpdate, 
    Profile, InfluencerCoupon, AdminWithdrawal, InfluencerWithdrawal, PageContent, ShippingTier, ProductCombo, ProductComboInsert, 
    RecipeInsert, Recipe, RecipeUpdate, OrderAnalyticsData, SoldItemSummary, ContactMessage, AboutSection, AboutSectionInsert, AboutSectionUpdate,
    AdminOrder, OrderUpdate
} from './types';
import AnalyticsVisuals from './components/AnalyticsVisuals';
import BlogEditorModal from './components/BlogEditorModal';
import LoadingSpinner from './components/LoadingSpinner';
import { XIcon, Lock, LogIn, AlertCircle, SearchIcon, ShoppingCartIcon, UserIcon } from './components/Icons';
import { EditProductModal, CouponModal, ItemsSoldModal, PromoContentModal, LegalDocumentEditor, SaleBannerModal, ComboModal, RecipeModal, AboutSectionModal, OrderDetailsModal, CreateProductModal, UserDetailModal } from './components/Modals';

type AdminView = 'analytics' | 'orders' | 'products' | 'combos' | 'coupons' | 'sale_banners' | 'promos' | 'legal' | 'recipes' | 'settings' | 'blog' | 'users' | 'commission' | 'withdrawals' | 'site_content' | 'category_images' | 'messages' | 'appearance';

const primaryButtonStyles = "bg-hav-forest text-hav-gold hover:bg-hav-forest/90 hover:shadow-lg border border-hav-gold/20 font-bold py-2 px-6 rounded-full transition-all duration-300";

const getStatusColor = (status: Order['status'] | InfluencerWithdrawal['status']) => {
    switch (status) {
      case 'Processing': return 'bg-blue-100 text-blue-800 border-blue-300';
      case 'Payment Received': return 'bg-purple-100 text-purple-800 border-purple-300';
      case 'Shipped': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'Delivered': return 'bg-green-100 text-green-800 border-green-300';
      case 'Cancelled': return 'bg-red-100 text-red-800 border-red-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 border-yellow-300';
      case 'completed': return 'bg-green-100 text-green-800 border-green-300';
      case 'rejected': return 'bg-red-100 text-red-800 border-red-300';
      default: return 'bg-gray-100 text-gray-800 border-gray-300';
    }
};

const uploadImage = async (file: File): Promise<string | null> => {
    if (!supabase) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
    const filePath = `site-assets/${fileName}`; 
    const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
    if (uploadError) {
        alert(`Error uploading image: ${uploadError.message}`);
        return null;
    }
    const { data } = supabase.storage.from('media').getPublicUrl(filePath);
    return data.publicUrl;
};

const AdminLogin: React.FC<{ onLoginSuccess: (profile: Profile) => void }> = ({ onLoginSuccess }) => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        try {
            const { data, error: authError } = await supabase.auth.signInWithPassword({ email, password });
            if (authError) throw authError;
            if (data.session) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', data.session.user.id).single();
                if (profile && profile.is_admin) onLoginSuccess(profile);
                else {
                    await supabase.auth.signOut();
                    setError("Access Denied: Admin privileges required.");
                }
            }
        } catch (err: any) {
            setError(err.message || "Failed to login");
        } finally {
            setLoading(false);
        }
    };

    const handleGoogleLogin = async () => {
        if (!supabase) return;
        try {
            const { error } = await supabase.auth.signInWithOAuth({
                provider: 'google',
                options: {
                    redirectTo: window.location.origin,
                },
            });
            if (error) throw error;
        } catch (err: any) {
            setError(err.message || "Failed to initiate Google login");
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-hav-cream p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl w-full max-w-md border border-hav-gold/20">
                <div className="text-center mb-8">
                    <div className="bg-hav-forest text-hav-gold w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"><Lock className="w-8 h-8" /></div>
                    <h1 className="text-3xl font-serif font-bold text-hav-forest">Admin Portal</h1>
                </div>
                
                <button 
                  onClick={handleGoogleLogin}
                  type="button"
                  className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-200 py-3 rounded-xl font-bold text-gray-700 hover:bg-gray-50 transition-all shadow-sm active:scale-95 mb-6"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 12-4.53z" />
                  </svg>
                  <span>Admin Google Login</span>
                </button>

                <div className="relative mb-6">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-gray-100"></div></div>
                  <div className="relative flex justify-center text-xs uppercase tracking-widest"><span className="bg-white px-4 text-gray-400 font-bold">Or use credentials</span></div>
                </div>

                {error && <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-6 flex items-start gap-3 text-sm"><AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" /><span>{error}</span></div>}
                <form onSubmit={handleLogin} className="space-y-5">
                    <div><label className="block text-sm font-bold text-hav-forest mb-1">Email</label><input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none" /></div>
                    <div><label className="block text-sm font-bold text-hav-forest mb-1">Password</label><input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-4 py-3 rounded-lg border border-gray-300 outline-none" /></div>
                    <button type="submit" disabled={loading} className="w-full bg-hav-forest text-hav-gold font-bold py-3 rounded-lg hover:bg-hav-forest/90 transition-all flex items-center justify-center gap-2">{loading ? 'Verifying...' : <><LogIn className="w-5 h-5" /> Login</>}</button>
                </form>
            </div>
        </div>
    );
};

const AdminApp: React.FC = () => {
    const [user, setUser] = useState<Profile | null>(null);
    const [authChecking, setAuthChecking] = useState(true);
    const [activeView, setActiveView] = useState<AdminView>('analytics');
    const [isLoading, setIsLoading] = useState(true);
    
    // Data State
    const [orders, setOrders] = useState<AdminOrder[]>([]);
    const [products, setProducts] = useState<Product[]>([]);
    const [categories, setCategories] = useState<Category[]>([]);
    const [saleBanners, setSaleBanners] = useState<SaleBanner[]>([]);
    const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
    const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
    const [analyticsData, setAnalyticsData] = useState<OrderAnalyticsData | null>(null);
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [influencerCoupons, setInfluencerCoupons] = useState<InfluencerCoupon[]>([]);
    const [withdrawals, setWithdrawals] = useState<AdminWithdrawal[]>([]);
    const [combos, setCombos] = useState<ProductCombo[]>([]);
    const [recipes, setRecipes] = useState<Recipe[]>([]);
    const [messages, setMessages] = useState<ContactMessage[]>([]);
    const [promotionalContent, setPromotionalContent] = useState<PromotionalContent[]>([]);
    const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
    const [aboutPageContent, setAboutPageContent] = useState<PageContent | null>(null);
    const [aboutSections, setAboutSections] = useState<AboutSection[]>([]);
    const [startDate, setStartDate] = useState<string>('');
    const [endDate, setEndDate] = useState<string>('');

    // Modal States
    const [isCreateProductModalOpen, setIsCreateProductModalOpen] = useState(false);
    const [isSaleBannerModalOpen, setIsSaleBannerModalOpen] = useState(false);
    const [editingSaleBanner, setEditingSaleBanner] = useState<SaleBanner | null>(null);
    const [isBlogEditorOpen, setIsBlogEditorOpen] = useState(false);
    const [editingBlogPost, setEditingBlogPost] = useState<BlogPost | null>(null);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [isCouponModalOpen, setIsCouponModalOpen] = useState(false);
    const [editingCoupon, setEditingCoupon] = useState<Coupon | null>(null);
    const [isItemsSoldModalOpen, setIsItemsSoldModalOpen] = useState(false);
    const [isPromoModalOpen, setIsPromoModalOpen] = useState(false);
    const [editingPromoContent, setEditingPromoContent] = useState<PromotionalContent | null>(null);
    const [editingLegalDoc, setEditingLegalDoc] = useState<LegalDocument | null>(null);
    const [isAboutSectionModalOpen, setIsAboutSectionModalOpen] = useState(false);
    const [editingAboutSection, setEditingAboutSection] = useState<AboutSection | null>(null);
    const [isComboModalOpen, setIsComboModalOpen] = useState(false);
    const [editingCombo, setEditingCombo] = useState<ProductCombo | null>(null);
    const [isRecipeModalOpen, setIsRecipeModalOpen] = useState(false);
    const [editingRecipe, setEditingRecipe] = useState<Recipe | null>(null);
    const [isOrderDetailsOpen, setIsOrderDetailsOpen] = useState(false);
    const [editingOrder, setEditingOrder] = useState<AdminOrder | null>(null);
    const [isUserDetailModalOpen, setIsUserDetailModalOpen] = useState(false);
    const [selectedUserForDetail, setSelectedUserForDetail] = useState<Profile | null>(null);

    // Other States
    const [newCategoryName, setNewCategoryName] = useState('');
    const [editingCategory, setEditingCategory] = useState<{ id: string; name: string; image_url?: string | null } | null>(null);
    const [userSearchTerm, setUserSearchTerm] = useState('');
    const [searchedUser, setSearchedUser] = useState<Profile | null>(null);
    const [userSearchLoading, setUserSearchLoading] = useState(false);
    const [userRoles, setUserRoles] = useState({ is_admin: false, is_influencer: false });
    const [commissionSettings, setCommissionSettings] = useState({ visible_influencer_commission: 10, actual_influencer_commission: 5 });
    const [shippingTiers, setShippingTiers] = useState<ShippingTier[]>([]);
    const [uploadingCatId, setUploadingCatId] = useState<string | null>(null);
    const [currentStoreSettings, setCurrentStoreSettings] = useState<StoreSettingsUpdate>({});

    const fetchData = useCallback(async () => {
        setIsLoading(true);
        try {
            const results = await Promise.allSettled([
                supabase.from('orders').select('*, profiles(name, email, mobile)').order('created_at', { ascending: false }),
                supabase.from('products').select('*, categories(id, name), product_variants(*)').order('name', { ascending: true }),
                supabase.from('categories').select('*').order('name'),
                supabase.from('store_settings').select('*').single(),
                supabase.from('order_analytics').select('*').single(),
                supabase.from('sale_banners').select('*').order('created_at', { ascending: false }),
                supabase.from('blog_posts').select('*, profiles(name)').order('created_at', { ascending: false }),
                supabase.from('coupons').select('*').order('created_at', { ascending: false }),
                supabase.from('influencer_coupons').select('*, profiles(name)').order('created_at', { ascending: false }),
                supabase.from('influencer_withdrawals').select('*, profiles(name)').order('created_at', { ascending: false }),
                supabase.from('product_combos').select('*').order('created_at', { ascending: false }),
                supabase.from('recipes').select('*').order('created_at', { ascending: false }),
                supabase.from('contact_messages').select('*').order('created_at', { ascending: false }),
                supabase.from('promotional_content').select('*').order('sort_order', { ascending: true }),
                supabase.from('legal_documents').select('*').order('title', { ascending: true }),
                supabase.from('page_content').select('*').eq('page_slug', 'about').maybeSingle(),
                supabase.from('about_sections').select('*').order('sort_order', { ascending: true })
            ]);

            const [
                ordersRes, productsRes, categoriesRes, settingsRes, analyticsRes, bannersRes, blogRes,
                couponsRes, influencerCouponsRes, withdrawalsRes, combosRes, recipesRes, messagesRes,
                promoRes, legalRes, aboutContentRes, aboutSectionsRes
            ] = results;

            if (ordersRes.status === 'fulfilled' && ordersRes.value.data) {
                setOrders(ordersRes.value.data.map((o: any) => {
                    const shippingPhone = o.shipping_address?.phone_number || o.shipping_address?.mobile || '';
                    return {
                        ...o,
                        userName: o.shipping_address?.name || o.profiles?.name || 'N/A',
                        userEmail: o.profiles?.email || 'N/A',
                        userMobile: shippingPhone || o.profiles?.mobile || 'N/A',
                    };
                })) as AdminOrder[];
            }
            if (productsRes.status === 'fulfilled' && productsRes.value.data) setProducts(productsRes.value.data as Product[]);
            if (categoriesRes.status === 'fulfilled' && categoriesRes.value.data) setCategories(categoriesRes.value.data as Category[]);
            if (settingsRes.status === 'fulfilled' && settingsRes.value.data) {
                setStoreSettings(settingsRes.value.data as StoreSettings);
                setCommissionSettings({
                    visible_influencer_commission: settingsRes.value.data.visible_influencer_commission,
                    actual_influencer_commission: settingsRes.value.data.actual_influencer_commission,
                });
                setShippingTiers(settingsRes.value.data.shipping_tiers || []);
                setCurrentStoreSettings(settingsRes.value.data);
            }
            if (analyticsRes.status === 'fulfilled' && analyticsRes.value.data) setAnalyticsData(analyticsRes.value.data);
            if (bannersRes.status === 'fulfilled' && bannersRes.value.data) setSaleBanners(bannersRes.value.data as SaleBanner[]);
            if (blogRes.status === 'fulfilled' && blogRes.value.data) setBlogPosts(blogRes.value.data as BlogPost[]);
            if (couponsRes.status === 'fulfilled' && couponsRes.value.data) setCoupons(couponsRes.value.data as Coupon[]);
            if (influencerCouponsRes.status === 'fulfilled' && influencerCouponsRes.value.data) setInfluencerCoupons(influencerCouponsRes.value.data as InfluencerCoupon[]);
            if (withdrawalsRes.status === 'fulfilled' && withdrawalsRes.value.data) setWithdrawals(withdrawalsRes.value.data as AdminWithdrawal[]);
            if (combosRes.status === 'fulfilled' && combosRes.value.data) setCombos(combosRes.value.data as ProductCombo[]);
            if (recipesRes.status === 'fulfilled' && recipesRes.value.data) {
                const mappedRecipes: Recipe[] = (recipesRes.value.data as any[]).map(r => ({
                    id: r.id,
                    name: r.name,
                    sub_heading: r.sub_heading,
                    description: r.description || '',
                    imageUrl: r.image_url || '',
                    videoUrl: r.video_url || '',
                    products: r.linked_products || [],
                    ingredients: r.ingredients || [],
                    instructions: r.instructions || [],
                }));
                setRecipes(mappedRecipes);
            }
            if (messagesRes.status === 'fulfilled' && messagesRes.value.data) setMessages(messagesRes.value.data as ContactMessage[]);
            if (promoRes.status === 'fulfilled' && promoRes.value.data) setPromotionalContent(promoRes.value.data as PromotionalContent[]);
            if (legalRes.status === 'fulfilled' && legalRes.value.data) setLegalDocuments(legalRes.value.data as LegalDocument[]);
            if (aboutContentRes.status === 'fulfilled' && aboutContentRes.value.data) setAboutPageContent(aboutContentRes.value.data as PageContent);
            if (aboutSectionsRes.status === 'fulfilled' && aboutSectionsRes.value.data) setAboutSections(aboutSectionsRes.value.data as AboutSection[]);
        } catch (error: any) {
            console.error('Error fetching data:', error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        const checkAuth = async () => {
            const { data: { session } } = await supabase.auth.getSession();
            if (session) {
                const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
                if (profile && profile.is_admin) {
                    setUser(profile);
                    fetchData();
                } else {
                    await supabase.auth.signOut();
                }
            }
            setAuthChecking(false);
        };
        checkAuth();
    }, []);

    useEffect(() => {
        if (!supabase || !user) return;

        const channel = supabase
            .channel('admin-orders-realtime')
            .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'orders' }, (payload) => {
                // Play notification sound
                const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
                audio.play().catch(e => console.log('Audio play failed', e));
                
                // Browser notification
                if (window.Notification && window.Notification.permission === 'granted') {
                    new window.Notification('New Order Received!', {
                        body: `Order #${payload.new.order_number} for ₹${payload.new.total}`,
                    });
                }
                
                // Refresh data to show new order
                fetchData();
            })
            .subscribe();

        if (window.Notification && window.Notification.permission === 'default') {
            window.Notification.requestPermission();
        }

        return () => {
            supabase.removeChannel(channel);
        };
    }, [user, fetchData]);

    // Derived State
    const filteredOrders = useMemo(() => {
        let result = orders;
        if (startDate) {
            const startStr = new Date(startDate);
            startStr.setHours(0, 0, 0, 0);
            result = result.filter(o => new Date(o.created_at) >= startStr);
        }
        if (endDate) {
            const endStr = new Date(endDate);
            endStr.setHours(23, 59, 59, 999);
            result = result.filter(o => new Date(o.created_at) <= endStr);
        }
        return result;
    }, [orders, startDate, endDate]);

    const calculatedSoldItems = useMemo(() => {
        const summary: Record<string, { name: string; quantity: number }> = {};
        filteredOrders.forEach(order => {
            if (order.status !== 'Cancelled') {
                order.items.forEach((item: any) => {
                    if (!summary[item.product_id]) summary[item.product_id] = { name: item.name, quantity: 0 };
                    summary[item.product_id].quantity += item.quantity;
                });
            }
        });
        return Object.entries(summary).map(([id, details]: any) => ({ product_id: id, product_name: details.name, total_quantity_sold: details.quantity })).sort((a, b) => b.total_quantity_sold - a.total_quantity_sold);
    }, [filteredOrders]);

    const calculatedAnalytics = useMemo(() => {
        let totalRevenue = 0;
        let deliveredOrders = 0;
        let cancelledOrders = 0;
        let totalItemsSold = 0;

        filteredOrders.forEach(order => {
            if (order.status !== 'Cancelled') {
                totalRevenue += (order.total || 0);
                order.items.forEach((item: any) => {
                    totalItemsSold += (item.quantity || 0);
                });
            } else {
                cancelledOrders += 1;
            }

            if (order.status === 'Delivered') {
                deliveredOrders += 1;
            }
        });

        return {
            total_revenue: totalRevenue,
            total_orders: filteredOrders.length,
            delivered_orders: deliveredOrders,
            cancelled_orders: cancelledOrders,
            total_items_sold: totalItemsSold
        };
    }, [filteredOrders]);

    // Handlers
    const adminCreateProduct = async (productData: ProductInsert, variantsData: any[]): Promise<boolean> => {
        try {
            // ALWAYS ensure we have a unique ID and a slug
            const pData = { ...productData };
            
            // Remove the blank id if it's there
            if (!pData.id || pData.id === '') {
                pData.id = crypto.randomUUID();
            }
            
            // Auto-generate slug if not present (helps with future SEO links)
            if (!pData.slug && pData.name) {
                pData.slug = pData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)+/g, '');
            }

            const { data, error } = await supabase.from('products').insert(pData).select().single();
            
            if (error) {
                console.error("Supabase Product Insert Error:", error);
                // Inform the user about the probable SQL fix needed
                if (error.message?.includes('null value') && error.message?.includes('id')) {
                    alert(`Database Error: The "id" column needs a default value. \n\nI've generated a unique ID on the browser for now, but you should run this SQL in Supabase SQL Editor for a permanent fix:\n\nALTER TABLE products ALTER COLUMN id SET DEFAULT uuid_generate_v4();`);
                    
                    // Retry with the generated ID if the first attempt failed (though the logic above already sends it)
                    // The error usually happens because the column is defined as NOT NULL but doesn't have a default.
                    // Providing a value from the client should satisfy it.
                } else {
                    alert(`Failed to add product: ${error.message} (${error.code || 'No code'})`);
                }
                return false;
            }
            
            if (!data) {
                alert("Product created but no data returned.");
                return false;
            }

            const { error: vError } = await supabase.from('product_variants').insert(
                variantsData.map(v => ({...v, product_id: data.id}))
            );
            
            if (vError) {
                console.error("Supabase Variant Insert Error:", vError);
                alert(`Product created, but failed to add variants: ${vError.message}`);
            } else {
                fetchData();
            }
            return !vError;
        } catch (err: any) {
            console.error("Unexpected error creating product:", err);
            alert(`An unexpected error occurred: ${err.message}`);
            return false;
        }
    };

    const adminUpdateProduct = async (id: string, data: ProductUpdate): Promise<boolean> => {
        const { error } = await supabase.from('products').update(data).eq('id', id);
        if (!error) fetchData();
        return !error;
    };

    const adminUpdateVariant = async (id: string, data: any): Promise<boolean> => {
        const { error } = await supabase.from('product_variants').update(data).eq('id', id);
        if (!error) fetchData();
        return !error;
    };

    const adminCreateVariant = async (data: any): Promise<boolean> => {
        try {
            const vData = { ...data };
            if (!vData.id) {
                vData.id = crypto.randomUUID();
            }
            const { error } = await supabase.from('product_variants').insert(vData);
            if (error) {
                console.error("Error creating product variant:", error);
                alert(`Failed to add variant: ${error.message}`);
                return false;
            }
            alert("Variant added successfully!");
            fetchData();
            return true;
        } catch (err: any) {
            console.error("Variant error:", err);
            alert(`Unexpected error: ${err.message}`);
            return false;
        }
    };

    const adminDeleteVariant = async (id: string): Promise<boolean> => {
        const { error } = await supabase.from('product_variants').delete().eq('id', id);
        if (!error) fetchData();
        return !error;
    };

    const handleDeleteProduct = async (id: string) => {
        if(window.confirm("Are you sure? This will delete the product and its variants.")){
            const {error} = await supabase.from('products').delete().eq('id', id);
            if(error) alert(error.message);
            else fetchData();
        }
    };

    const handleSaveCoupon = async (data: CouponInsert | CouponUpdate, id?: string) => {
        try {
            // Remove helper fields that are not in the database schema
            // banner_text is likely in the DB, but get_y_variant_id is a helper
            const { get_y_variant_id, ...cleanData } = data as any;
            
            // Always remove id and created_at from the payload to avoid Supabase errors
            delete cleanData.id;
            delete cleanData.created_at;

            let result;
            if (id) {
                result = await supabase.from('coupons').update(cleanData).eq('id', id);
            } else {
                result = await supabase.from('coupons').insert(cleanData);
            }
            
            if (result.error) {
                console.error("Error saving coupon:", result.error);
                alert("Error saving coupon: " + result.error.message);
                return false;
            }
            
            fetchData();
            return true;
        } catch (err) {
            console.error("Unexpected error saving coupon:", err);
            alert("An unexpected error occurred.");
            return false;
        }
    };

    const handleDeleteCoupon = async (id: string) => {
        if(window.confirm("Delete coupon?")) {
            await supabase.from('coupons').delete().eq('id', id);
            fetchData();
        }
    };

    const handleSaveSaleBanner = async (data: any, id?: string) => {
        const { error } = id 
            ? await supabase.from('sale_banners').update(data).eq('id', id)
            : await supabase.from('sale_banners').insert(data);
        if (!error) fetchData();
        return !error;
    };

    const handleDeleteSaleBanner = async (id: string) => {
        if(window.confirm("Delete banner?")) {
            await supabase.from('sale_banners').delete().eq('id', id);
            fetchData();
        }
    }

    const handleSaveBlogPost = async (data: BlogPostInsert | BlogPostUpdate, id?: string) => {
        const { error } = id
            ? await supabase.from('blog_posts').update(data).eq('id', id)
            : await supabase.from('blog_posts').insert(data);
        if (!error) fetchData();
        return !error;
    };

    const handleDeleteBlogPost = async (id: string) => {
        if(window.confirm("Delete post?")) {
            await supabase.from('blog_posts').delete().eq('id', id);
            fetchData();
        }
    };

    const handleSavePromoContent = async (data: any, id?: string) => {
        let success;
        if (id) success = !((await supabase.from('promotional_content').update(data).eq('id', id)).error);
        else success = !((await supabase.from('promotional_content').insert(data)).error);
        if(success) fetchData();
        return success;
    };

    const handleDeletePromoContent = async (id: string) => {
        if(window.confirm("Delete promo?")) {
            await supabase.from('promotional_content').delete().eq('id', id);
            fetchData();
        }
    };

    const adminUpdateLegalDocument = async (id: string, updates: LegalDocumentUpdate) => {
        const { error } = await supabase.from('legal_documents').update(updates).eq('id', id);
        if (!error) fetchData();
        return !error;
    };

    const adminUpdatePageContent = async (slug: string, content: any) => {
        const { error } = await supabase.from('page_content').upsert({ page_slug: slug, content }, { onConflict: 'page_slug' });
        if (!error) fetchData();
        return !error;
    };

    const handleSaveCombo = async (data: ProductComboInsert, id?: string) => {
        let success = false;
        if (id) success = !((await supabase.from('product_combos').update(data).eq('id', id)).error);
        else success = !((await supabase.from('product_combos').insert(data)).error);
        if (success) await fetchData();
        return success;
    };

    const handleDeleteCombo = async (id: string) => {
        if (window.confirm('Delete this combo?')) {
            await supabase.from('product_combos').delete().eq('id', id);
            await fetchData();
        }
    };

    const handleSaveRecipe = async (data: RecipeInsert, id?: string) => {
        let success = false;
        const payload = {
            name: data.name,
            sub_heading: data.sub_heading,
            description: data.description,
            image_url: (data as any).imageUrl,
            video_url: (data as any).videoUrl,
            products: data.products,
            ingredients: data.ingredients,
            instructions: data.instructions,
            ingredients_list: data.ingredients_list,
            instructions_list: data.instructions_list,
            linked_product_ids: data.linked_product_ids
        };
        if (id) success = !((await supabase.from('recipes').update(payload).eq('id', id)).error);
        else success = !((await supabase.from('recipes').insert(payload)).error);
        if (success) await fetchData();
        return success;
    };

    const handleSaveAboutSection = async (data: AboutSectionInsert | AboutSectionUpdate, id?: string) => {
        const { error } = id
            ? await supabase.from('about_sections').update(data).eq('id', id)
            : await supabase.from('about_sections').insert(data);
        if (!error) fetchData();
        return !error;
    };

    const handleDeleteAboutSection = async (id: string) => {
        if (window.confirm("Delete this section?")) {
            await supabase.from('about_sections').delete().eq('id', id);
            fetchData();
        }
    };

    const handleDeleteRecipe = async (id: string) => {
        if (window.confirm('Delete this recipe?')) {
            await supabase.from('recipes').delete().eq('id', id);
            await fetchData();
        }
    };

    const handleCreateCategory = async () => {
        const { error } = await supabase.from('categories').insert({ name: newCategoryName });
        if (!error) {
            setNewCategoryName('');
            fetchData();
        }
    };

    const handleSaveCategory = async () => {
        if(!editingCategory) return;
        const { error } = await supabase.from('categories').update({ name: editingCategory.name, image_url: editingCategory.image_url }).eq('id', editingCategory.id);
        if(!error) {
            setEditingCategory(null);
            fetchData();
        }
    };

    const handleDeleteCategory = async (id: string) => {
        if(window.confirm("Delete category?")) {
            await supabase.from('categories').delete().eq('id', id);
            fetchData();
        }
    };

    const handleCategoryImageUpload = async (e: React.ChangeEvent<HTMLInputElement>, categoryId: string) => {
        if (e.target.files && e.target.files[0]) {
            setUploadingCatId(categoryId);
            const url = await uploadImage(e.target.files[0]);
            if (url) {
                const cat = categories.find(c => c.id === categoryId);
                if (cat) await supabase.from('categories').update({ name: cat.name, image_url: url }).eq('id', categoryId);
                fetchData();
            }
            setUploadingCatId(null);
        }
    };

    const handleUserSearch = async () => {
        setUserSearchLoading(true);
        const isEmail = userSearchTerm.includes('@');
        const query = supabase.from('profiles').select('*');
        
        if (isEmail) {
            query.eq('email', userSearchTerm);
        } else {
            // Try searching by mobile number (handle with and without +91)
            const cleanPhone = userSearchTerm.replace(/\D/g, '');
            const phoneWithPrefix = cleanPhone.startsWith('91') ? `+${cleanPhone}` : `+91${cleanPhone}`;
            query.or(`mobile.eq.${userSearchTerm},mobile.eq.${cleanPhone},mobile.eq.${phoneWithPrefix}`);
        }

        const { data, error } = await query.maybeSingle();
        
        if(error) alert("Error searching user: " + error.message);
        else if (!data) alert("User not found.");
        else {
            setSearchedUser(data as Profile);
            setUserRoles({ is_admin: data.is_admin, is_influencer: data.is_influencer });
        }
        setUserSearchLoading(false);
    };

    const handleViewUserDetails = (profile: Profile) => {
        setSelectedUserForDetail(profile);
        setIsUserDetailModalOpen(true);
    };

    const handleRoleUpdate = async () => {
        if(!searchedUser) return;
        const { error } = await supabase.from('profiles').update(userRoles).eq('id', searchedUser.id);
        if(!error) alert("Roles updated");
    };

    const handleSaveCommissionSettings = async () => {
        await supabase.from('store_settings').update(commissionSettings).eq('id', 1);
        fetchData();
    };

    const handleSaveStoreSettings = async () => {
        const { id, created_at, ...settingsPayload } = currentStoreSettings as any;
        const { error } = await supabase.from('store_settings').update({ ...settingsPayload, shipping_tiers: shippingTiers }).eq('id', 1);
        if (error) alert("Failed to update settings.");
        else {
            alert("Settings updated!");
            fetchData();
        }
    };

    const handleUpdateTier = (index: number, field: keyof ShippingTier, value: number) => {
        const newTiers = [...shippingTiers];
        newTiers[index] = { ...newTiers[index], [field]: value };
        setShippingTiers(newTiers);
    };

    const handleRemoveTier = (index: number) => {
        setShippingTiers(prev => prev.filter((_, i) => i !== index));
    };

    const handleAddTier = () => {
        setShippingTiers(prev => [...prev, { min_cart_value: 0, shipping_rate: 0 }]);
    };

    const handleUpdateOrder = async (orderId: string, updates: OrderUpdate) => {
        const { error } = await supabase.from('orders').update(updates).eq('id', orderId);
        if (!error) {
            setOrders(prev => prev.map(o => o.id === orderId ? { ...o, ...updates } : o));
            if (editingOrder?.id === orderId) {
                setEditingOrder({ ...editingOrder, ...updates });
            }
        }
        return !error;
    };

    const handleOrderStatusChange = async (orderId: string, newStatus: string) => {
        const updates: OrderUpdate = { status: newStatus as Order['status'] };
        if (newStatus === 'Shipped') {
            updates.shipped_at = new Date().toISOString();
        }
        await handleUpdateOrder(orderId, updates);
        
        // Create notification for the user
        const order = orders.find(o => o.id === orderId);
        if (order) {
            let title = 'Order Update';
            let message = `Your order #${order.order_number} status has been updated to ${newStatus}.`;
            let type: any = 'general';

            if (newStatus === 'Shipped') {
                title = 'Order Shipped! 🚚';
                message = `Great news! Your order #${order.order_number} has been shipped and is on its way.`;
                type = 'order_shipped';
            } else if (newStatus === 'Delivered') {
                title = 'Order Delivered! 🎁';
                message = `Your order #${order.order_number} has been successfully delivered. Enjoy your Havikar flavors!`;
                type = 'order_delivered';
            } else if (newStatus === 'Cancelled') {
                title = 'Order Cancelled';
                message = `Your order #${order.order_number} has been cancelled.`;
                type = 'order_cancelled';
            }

            await supabase.from('notifications').insert([{
                user_id: order.user_id,
                title,
                message,
                type,
                order_id: orderId
            }]);
        }
    };

    const handleWithdrawalStatusChange = async (id: string, newStatus: InfluencerWithdrawal['status']) => {
        await supabase.from('influencer_withdrawals').update({ status: newStatus }).eq('id', id);
        fetchData();
    };

    const handleLogout = async () => {
        await supabase.auth.signOut();
        setUser(null);
    };

    if (authChecking) return <div className="min-h-screen flex items-center justify-center bg-hav-cream"><LoadingSpinner/></div>;
    if (!user) return <AdminLogin onLoginSuccess={(profile) => { setUser(profile); fetchData(); }} />;

    const SideNavLink: React.FC<{ view: AdminView; label: string }> = ({ view, label }) => (
        <button 
            onClick={() => setActiveView(view)} 
            className={`block w-full text-left px-4 py-2 rounded-md transition-colors ${activeView === view ? 'bg-hav-orange-200 text-hav-orange-900 font-bold' : 'hover:bg-hav-orange-100'}`}
        >
            {label}
        </button>
    );

    return (
        <div className="bg-hav-cream min-h-screen font-sans text-hav-olive">
            {isCreateProductModalOpen && <CreateProductModal categories={categories} onClose={() => setIsCreateProductModalOpen(false)} onSave={adminCreateProduct}/>}
            {editingProduct && <EditProductModal product={editingProduct} products={products} onClose={() => setEditingProduct(null)} onSaveProduct={adminUpdateProduct} onSaveVariant={adminUpdateVariant} onCreateVariant={adminCreateVariant} onDeleteVariant={adminDeleteVariant} categories={categories}/>}
            
            {isCouponModalOpen && <CouponModal categories={categories} products={products} coupon={editingCoupon} onClose={() => { setIsCouponModalOpen(false); setEditingCoupon(null); }} onSave={handleSaveCoupon} />}
            {isItemsSoldModalOpen && <ItemsSoldModal items={calculatedSoldItems} onClose={() => setIsItemsSoldModalOpen(false)} />}
            {isPromoModalOpen && <PromoContentModal 
                content={editingPromoContent} 
                onClose={() => { setIsPromoModalOpen(false); setEditingPromoContent(null); }} 
                onSave={handleSavePromoContent} 
                products={products} 
                categories={categories}
                recipes={recipes}
                blogPosts={blogPosts}
            />}
            {editingLegalDoc && <LegalDocumentEditor doc={editingLegalDoc} onClose={() => setEditingLegalDoc(null)} onSave={adminUpdateLegalDocument} />}
            {isSaleBannerModalOpen && <SaleBannerModal banner={editingSaleBanner} coupons={coupons} onClose={() => { setIsSaleBannerModalOpen(false); setEditingSaleBanner(null); }} onSave={handleSaveSaleBanner} products={products}/>}
            {isBlogEditorOpen && <BlogEditorModal post={editingBlogPost} onSave={handleSaveBlogPost} onClose={() => { setIsBlogEditorOpen(false); setEditingBlogPost(null); }} />}
            {isAboutSectionModalOpen && <AboutSectionModal section={editingAboutSection} onClose={() => { setIsAboutSectionModalOpen(false); setEditingAboutSection(null); }} onSave={handleSaveAboutSection} />}
            {isComboModalOpen && <ComboModal combo={editingCombo} products={products} categories={categories} onClose={() => { setIsComboModalOpen(false); setEditingCombo(null); }} onSave={handleSaveCombo} />}
            {isRecipeModalOpen && <RecipeModal recipe={editingRecipe} products={products} onClose={() => { setIsRecipeModalOpen(false); setEditingRecipe(null); }} onSave={handleSaveRecipe} />}
            {isOrderDetailsOpen && editingOrder && <OrderDetailsModal order={editingOrder} onClose={() => { setIsOrderDetailsOpen(false); setEditingOrder(null); }} onUpdateOrder={handleUpdateOrder} />}
            {isUserDetailModalOpen && selectedUserForDetail && <UserDetailModal user={selectedUserForDetail} orders={orders} onClose={() => { setIsUserDetailModalOpen(false); setSelectedUserForDetail(null); }} />}

            <header className="bg-hav-forest text-hav-gold p-4 shadow-md flex justify-between items-center sticky top-0 z-40">
                <div className="flex items-center gap-2"><h1 className="text-2xl font-serif font-bold">Havikar Admin Portal</h1></div>
                <div className="flex items-center gap-4"><span>Welcome, {user?.name}</span><button onClick={handleLogout} className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700">Logout</button></div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                    <aside className="lg:col-span-1 bg-white p-4 rounded-lg shadow-lg h-fit border border-hav-olive/10 sticky top-24">
                        <nav className="space-y-1">
                            <SideNavLink view="analytics" label="Analytics" />
                            <SideNavLink view="orders" label="Manage Orders" />
                            <SideNavLink view="messages" label="Messages" />
                            <SideNavLink view="withdrawals" label="Withdrawal Requests" />
                            <SideNavLink view="products" label="Manage Products" />
                            <SideNavLink view="combos" label="Manage Combos" />
                            <SideNavLink view="recipes" label="Manage Recipes" />
                            <SideNavLink view="category_images" label="Category Images" />
                            <SideNavLink view="site_content" label="Site Content" />
                            <SideNavLink view="blog" label="Manage Blog" />
                            <SideNavLink view="users" label="Manage Users" />
                            <SideNavLink view="coupons" label="Manage Coupons" />
                            <SideNavLink view="commission" label="Commission Settings" />
                            <SideNavLink view="promos" label="Promo Content" />
                            <SideNavLink view="sale_banners" label="Sale Banners" />
                            <SideNavLink view="legal" label="Legal Documents" />
                            <SideNavLink view="settings" label="Store Settings" />
                            <SideNavLink view="appearance" label="Color & Style" />
                        </nav>
                    </aside>

                    <main className="lg:col-span-3 bg-white p-6 rounded-lg shadow-lg border border-hav-olive/10 min-h-[80vh]">
                        {isLoading ? <div className="flex justify-center p-8"><LoadingSpinner /></div> : (
                            <>
                                {activeView === 'analytics' && (
                                    <>
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-2">
                                            <div>
                                                <h2 className="text-2xl font-serif font-bold text-hav-orange-800">Store Analytics</h2>
                                                <p className="text-xs text-hav-brown/70 mt-1">
                                                    {startDate || endDate 
                                                        ? `Showing data from ${startDate || 'beginning'} to ${endDate || 'today'}` 
                                                        : "Showing all-time data"}
                                                </p>
                                            </div>
                                            <button onClick={() => setIsItemsSoldModalOpen(true)} className="text-sm font-semibold text-hav-orange-600 hover:underline">View All Items Sold</button>
                                        </div>

                                        <div className="bg-hav-cream/30 p-6 rounded-3xl border border-hav-gold/15 mb-8">
                                            <h4 className="text-xs font-black uppercase text-hav-forest mb-4 tracking-wider">Date Filters</h4>
                                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">From Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={startDate} 
                                                        onChange={e => setStartDate(e.target.value)} 
                                                        className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-hav-brown focus:ring-2 focus:ring-hav-gold text-sm focus:outline-none" 
                                                    />
                                                </div>
                                                <div>
                                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">To Date</label>
                                                    <input 
                                                        type="date" 
                                                        value={endDate} 
                                                        onChange={e => setEndDate(e.target.value)} 
                                                        className="w-full border border-hav-orange-200 rounded-xl py-2 px-3 bg-white text-hav-brown focus:ring-2 focus:ring-hav-gold text-sm focus:outline-none" 
                                                    />
                                                </div>
                                                <div className="flex gap-2 flex-wrap pb-0.5">
                                                    <button 
                                                        onClick={() => {
                                                            const d = new Date();
                                                            d.setDate(d.getDate() - 7);
                                                            setStartDate(d.toISOString().split('T')[0]);
                                                            setEndDate(new Date().toISOString().split('T')[0]);
                                                        }} 
                                                        className="text-xs bg-hav-gold/20 hover:bg-hav-gold/30 text-hav-orange-900 px-3.5 py-2.5 rounded-xl font-bold transition-all"
                                                    >
                                                        Last 7 Days
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            const d = new Date();
                                                            d.setDate(d.getDate() - 30);
                                                            setStartDate(d.toISOString().split('T')[0]);
                                                            setEndDate(new Date().toISOString().split('T')[0]);
                                                        }} 
                                                        className="text-xs bg-hav-gold/20 hover:bg-hav-gold/30 text-hav-orange-900 px-3.5 py-2.5 rounded-xl font-bold transition-all"
                                                    >
                                                        Last 30 Days
                                                    </button>
                                                    <button 
                                                        onClick={() => {
                                                            setStartDate('');
                                                            setEndDate('');
                                                        }} 
                                                        className="text-xs bg-gray-200 hover:bg-gray-300 text-gray-700 px-3.5 py-2.5 rounded-xl font-bold transition-all"
                                                    >
                                                        Clear
                                                    </button>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-center mb-8">
                                            <div className="bg-hav-cream p-4 rounded-xl border border-hav-olive/10"><p className="text-2xl font-bold text-hav-orange-900">₹{(calculatedAnalytics.total_revenue ?? 0).toFixed(2)}</p><p className="text-xs text-hav-brown font-medium mt-1">Total Revenue</p></div>
                                            <div className="bg-blue-50 p-4 rounded-xl border border-blue-100"><p className="text-2xl font-bold text-blue-900">{calculatedAnalytics.total_orders}</p><p className="text-xs text-blue-800 font-medium mt-1">Orders</p></div>
                                            <div className="bg-green-50 p-4 rounded-xl border border-green-100"><p className="text-2xl font-bold text-green-900">{calculatedAnalytics.delivered_orders}</p><p className="text-xs text-green-800 font-medium mt-1">Delivered</p></div>
                                            <div className="bg-red-50 p-4 rounded-xl border border-red-100"><p className="text-2xl font-bold text-red-900">{calculatedAnalytics.cancelled_orders}</p><p className="text-xs text-red-800 font-medium mt-1">Cancelled</p></div>
                                            <div className="bg-purple-50 p-4 rounded-xl border border-purple-100"><p className="text-2xl font-bold text-purple-900">{calculatedAnalytics.total_items_sold}</p><p className="text-xs text-purple-800 font-medium mt-1">Sold Items</p></div>
                                        </div>
                                        <AnalyticsVisuals orders={filteredOrders} soldItems={calculatedSoldItems} />
                                    </>
                                )}
                                
                                {activeView === 'products' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold">Products</h2>
                                            <button onClick={() => setIsCreateProductModalOpen(true)} className={primaryButtonStyles}>+ Add Product</button>
                                        </div>
                                        <div className="space-y-2">
                                            {products.map(p => (
                                                <div key={p.id} className="p-3 border rounded flex justify-between items-center bg-gray-50">
                                                    <div><span className="font-bold">{p.name}</span><span className="text-sm text-gray-500 ml-2">{p.product_variants.length} variants</span></div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => setEditingProduct(p)} className="text-sm bg-blue-100 text-blue-700 px-3 py-1 rounded hover:bg-blue-200">Edit</button>
                                                        <button onClick={() => handleDeleteProduct(p.id)} className="text-sm bg-red-100 text-red-700 px-3 py-1 rounded hover:bg-red-200">Delete</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeView === 'sale_banners' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold">Sale Banners</h2>
                                            <button onClick={() => { setEditingSaleBanner(null); setIsSaleBannerModalOpen(true); }} className={primaryButtonStyles}>+ Add Banner</button>
                                        </div>
                                        <div className="space-y-4">
                                            {saleBanners.map(banner => (
                                                <div key={banner.id} className="p-4 border rounded bg-gray-50">
                                                    <div className="flex justify-between">
                                                        <h3 className="font-bold">{banner.title}</h3>
                                                        <button onClick={() => { setEditingSaleBanner(banner); setIsSaleBannerModalOpen(true); }} className="text-blue-600 hover:underline">Edit</button>
                                                        <button onClick={() => handleDeleteSaleBanner(banner.id)} className="text-red-600 hover:underline">Delete</button>
                                                    </div>
                                                    <p className="text-xs text-gray-500">{banner.is_active ? 'Active' : 'Inactive'}</p>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeView === 'blog' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold">Blog Posts</h2>
                                            <button onClick={() => { setEditingBlogPost(null); setIsBlogEditorOpen(true); }} className={primaryButtonStyles}>+ Add Post</button>
                                        </div>
                                        <div className="space-y-4">
                                            {blogPosts.map(post => (
                                                <div key={post.id} className="p-4 border rounded bg-gray-50 flex justify-between">
                                                    <div>
                                                        <h3 className="font-bold">{post.title}</h3>
                                                        <p className="text-xs text-gray-500">{post.is_published ? 'Published' : 'Draft'}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setEditingBlogPost(post); setIsBlogEditorOpen(true); }} className="text-blue-600 hover:underline">Edit</button>
                                                        <button onClick={() => handleDeleteBlogPost(post.id)} className="text-red-600 hover:underline">Delete</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeView === 'orders' && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">Orders</h2>
                                        <div className="space-y-4">
                                            {orders.map(order => (
                                                <div key={order.id} className={`p-4 border rounded ${getStatusColor(order.status)}`}>
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <p className="font-bold">Order #{order.order_number}</p>
                                                            <p className="text-sm">{new Date(order.created_at).toLocaleString()}</p>
                                                            <p className="text-xs text-gray-600 mt-1">Customer: <span className="font-semibold">{order.userName}</span> ({order.userMobile && order.userMobile !== 'N/A' ? order.userMobile : (order.shipping_address?.phone_number || order.shipping_address?.mobile || 'N/A')})</p>
                                                        </div>
                                                        <div className="text-right">
                                                            <p className="font-bold text-lg">₹{order.total}</p>
                                                            <span className="text-sm font-semibold">{order.status}</span>
                                                        </div>
                                                    </div>
                                                    <div className="mt-2 flex gap-2">
                                                        <select value={order.status} onChange={(e) => handleOrderStatusChange(order.id, e.target.value)} className="text-sm border rounded p-1">
                                                            <option>Processing</option><option>Payment Received</option><option>Shipped</option><option>Delivered</option><option>Cancelled</option>
                                                        </select>
                                                        <button onClick={() => { setEditingOrder(order); setIsOrderDetailsOpen(true); }} className="text-sm underline">Details</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeView === 'coupons' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Coupons</h2><button onClick={() => { setEditingCoupon(null); setIsCouponModalOpen(true); }} className={primaryButtonStyles}>+ Create Coupon</button></div>
                                        <div className="space-y-2">
                                            {coupons.map(c => (
                                                <div key={c.id} className="p-3 bg-white rounded border flex justify-between items-center">
                                                    <div><span className="font-bold text-green-700">{c.code}</span> <span className="text-xs text-gray-500">{c.discount_type}</span></div>
                                                    <div className="flex gap-2"><button onClick={() => { setEditingCoupon(c); setIsCouponModalOpen(true); }} className="text-blue-600 text-sm">Edit</button><button onClick={() => handleDeleteCoupon(c.id)} className="text-red-600 text-sm">Delete</button></div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeView === 'commission' && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">Commission Settings</h2>
                                        <div className="bg-white p-6 rounded shadow max-w-lg space-y-4">
                                            <div>
                                                <label className="block text-sm font-bold">Visible Commission % (Shown to Influencer)</label>
                                                <input type="number" value={commissionSettings.visible_influencer_commission} onChange={e => setCommissionSettings({...commissionSettings, visible_influencer_commission: Number(e.target.value)})} className="border p-2 w-full"/>
                                            </div>
                                            <div>
                                                <label className="block text-sm font-bold">Actual Commission % (Used for calculation)</label>
                                                <input type="number" value={commissionSettings.actual_influencer_commission} onChange={e => setCommissionSettings({...commissionSettings, actual_influencer_commission: Number(e.target.value)})} className="border p-2 w-full"/>
                                            </div>
                                            <button onClick={handleSaveCommissionSettings} className={primaryButtonStyles}>Save Settings</button>
                                        </div>
                                        <hr className="my-8" />
                                        <h2 className="text-2xl font-bold mb-4">Active Influencer Codes</h2>
                                        <div className="space-y-2">
                                            {influencerCoupons.map(ic => (
                                                <div key={ic.id} className="p-3 bg-gray-50 rounded border flex justify-between items-center">
                                                    <span className="font-mono bg-gray-200 px-2 py-1 rounded">{ic.code}</span>
                                                    <span>{ic.profiles?.name || 'Unknown User'}</span>
                                                    <span>Used: {ic.times_used} times</span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeView === 'withdrawals' && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">Withdrawal Requests</h2>
                                        <div className="space-y-4">
                                            {withdrawals.map(w => (
                                                <div key={w.id} className={`p-4 border rounded ${getStatusColor(w.status)}`}>
                                                    <div className="flex justify-between">
                                                        <div>
                                                            <p className="font-bold">₹{w.amount} - {w.profiles?.name}</p>
                                                            <p className="text-xs text-gray-500">{new Date(w.created_at).toLocaleString()}</p>
                                                        </div>
                                                        <span className="text-xs font-bold">{w.status}</span>
                                                    </div>
                                                    {w.payment_details && (
                                                        <div className="text-xs bg-black/5 p-2 mt-2 rounded">
                                                            <pre>{JSON.stringify(w.payment_details, null, 2)}</pre>
                                                        </div>
                                                    )}
                                                    {w.status === 'pending' && (
                                                        <div className="flex gap-2 mt-2">
                                                            <button onClick={() => handleWithdrawalStatusChange(w.id, 'completed')} className="bg-green-600 text-white px-2 py-1 rounded text-xs">Mark as Paid</button>
                                                            <button onClick={() => handleWithdrawalStatusChange(w.id, 'rejected')} className="bg-red-600 text-white px-2 py-1 rounded text-xs">Reject</button>
                                                        </div>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                                

                                {activeView === 'combos' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Combos</h2><button onClick={() => { setEditingCombo(null); setIsComboModalOpen(true); }} className={primaryButtonStyles}>+ Add Combo</button></div>
                                        <div className="space-y-2">{combos.map(c => (<div key={c.id} className="p-3 border rounded flex justify-between items-center bg-white"><div><span className="font-bold">{c.name}</span></div><div className="flex gap-2"><button onClick={() => { setEditingCombo(c); setIsComboModalOpen(true); }} className="text-blue-600 text-sm">Edit</button><button onClick={() => handleDeleteCombo(c.id)} className="text-red-600 text-sm">Delete</button></div></div>))}</div>
                                    </div>
                                )}

                                {activeView === 'recipes' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Recipes</h2><button onClick={() => { setEditingRecipe(null); setIsRecipeModalOpen(true); }} className={primaryButtonStyles}>+ Add Recipe</button></div>
                                        <div className="space-y-2">{recipes.map(r => (<div key={r.id} className="p-3 border rounded flex justify-between items-center bg-white"><div><span className="font-bold">{r.name}</span></div><div className="flex gap-2"><button onClick={() => { setEditingRecipe(r); setIsRecipeModalOpen(true); }} className="text-blue-600 text-sm">Edit</button><button onClick={() => handleDeleteRecipe(r.id)} className="text-red-600 text-sm">Delete</button></div></div>))}</div>
                                    </div>
                                )}

                                {activeView === 'category_images' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-4"><h2 className="text-2xl font-bold">Category Images</h2><div className="flex gap-2"><input value={newCategoryName} onChange={e => setNewCategoryName(e.target.value)} placeholder="New Category" className="border p-2 rounded text-sm"/><button onClick={handleCreateCategory} className="bg-green-600 text-white px-3 rounded text-sm">Create</button></div></div>
                                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                            {categories.map(c => (
                                                <div key={c.id} className="border p-4 rounded bg-white">
                                                    <h4 className="font-bold mb-2">{c.name}</h4>
                                                    <div className="w-full h-32 bg-gray-100 mb-2 flex items-center justify-center overflow-hidden">{c.image_url ? <img src={c.image_url} className="w-full h-full object-cover"/> : <span>No Image</span>}</div>
                                                    <input type="file" className="text-xs" onChange={(e) => handleCategoryImageUpload(e, c.id)} disabled={!!uploadingCatId} />
                                                    <div className="flex gap-2 mt-2"><button onClick={() => setEditingCategory(c)} className="text-blue-600 text-xs">Rename</button><button onClick={() => handleDeleteCategory(c.id)} className="text-red-600 text-xs">Delete</button></div>
                                                    {editingCategory?.id === c.id && <div className="flex gap-1 mt-1"><input value={editingCategory.name} onChange={e => setEditingCategory({...editingCategory, name: e.target.value})} className="border p-1 text-xs"/><button onClick={handleSaveCategory} className="bg-blue-500 text-white px-2 rounded text-xs">Save</button></div>}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeView === 'site_content' && (
                                    <div>
                                        <div className="flex justify-between items-center mb-6">
                                            <h2 className="text-2xl font-bold">About Page Sections</h2>
                                            <button onClick={() => { setEditingAboutSection(null); setIsAboutSectionModalOpen(true); }} className={primaryButtonStyles}>+ Add Section</button>
                                        </div>
                                        <div className="space-y-4">
                                            {aboutSections.map(section => (
                                                <div key={section.id} className="p-4 border rounded bg-gray-50 flex justify-between items-center">
                                                    <div>
                                                        <h3 className="font-bold">{section.title || 'Untitled Section'}</h3>
                                                        <p className="text-xs text-gray-500">Order: {section.sort_order} | {section.layout_type}</p>
                                                    </div>
                                                    <div className="flex gap-2">
                                                        <button onClick={() => { setEditingAboutSection(section); setIsAboutSectionModalOpen(true); }} className="text-blue-600 hover:underline">Edit</button>
                                                        <button onClick={() => handleDeleteAboutSection(section.id)} className="text-red-600 hover:underline">Delete</button>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {activeView === 'users' && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">Manage Users</h2>
                                        <div className="flex gap-2 mb-4"><input value={userSearchTerm} onChange={e => setUserSearchTerm(e.target.value)} placeholder="Email..." className="border p-2 rounded"/><button onClick={handleUserSearch} className="bg-blue-600 text-white px-4 rounded">Search</button></div>
                                        {searchedUser && (
                                            <div className="bg-white p-6 border rounded-2xl shadow-sm flex justify-between items-start">
                                                <div>
                                                    <p className="font-black text-xl text-hav-forest">{searchedUser.name}</p>
                                                    <p className="text-hav-olive">{searchedUser.email}</p>
                                                    <div className="flex gap-4 mt-4">
                                                        <label className="flex items-center gap-2 text-sm font-bold">
                                                            <input type="checkbox" checked={userRoles.is_admin} onChange={e => setUserRoles({...userRoles, is_admin: e.target.checked})} className="w-4 h-4 accent-hav-forest"/> Admin
                                                        </label>
                                                        <label className="flex items-center gap-2 text-sm font-bold">
                                                            <input type="checkbox" checked={userRoles.is_influencer} onChange={e => setUserRoles({...userRoles, is_influencer: e.target.checked})} className="w-4 h-4 accent-hav-forest"/> Influencer
                                                        </label>
                                                        <button onClick={handleRoleUpdate} className="bg-hav-forest text-hav-gold px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest hover:brightness-110 transition-all">Update Roles</button>
                                                    </div>
                                                </div>
                                                <button 
                                                    onClick={() => handleViewUserDetails(searchedUser)}
                                                    className="bg-hav-gold text-hav-forest px-6 py-2 rounded-full text-xs font-black uppercase tracking-widest hover:shadow-lg transition-all"
                                                >
                                                    View Full History
                                                </button>
                                            </div>
                                        )}
                                    </div>
                                )}

                                {activeView === 'messages' && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">Messages</h2>
                                        {messages.map(msg => <div key={msg.id} className="bg-white p-4 mb-2 rounded border"><p className="font-bold">{msg.name} ({msg.email})</p><p className="text-sm">{msg.message}</p><p className="text-xs text-gray-400">{new Date(msg.created_at).toLocaleString()}</p></div>)}
                                    </div>
                                )}

                                {activeView === 'promos' && (
                                    <div><div className="flex justify-between mb-4"><h2 className="text-2xl font-bold">Promos</h2><button onClick={() => setIsPromoModalOpen(true)} className={primaryButtonStyles}>+ Add</button></div><div className="space-y-2">{promotionalContent.map(p => (<div key={p.id} className="p-3 bg-white border rounded flex justify-between"><span>{p.title || p.text}</span><div><button onClick={() => { setEditingPromoContent(p); setIsPromoModalOpen(true); }} className="text-blue-600 text-sm mr-2">Edit</button><button onClick={() => handleDeletePromoContent(p.id)} className="text-red-600 text-sm">Del</button></div></div>))}</div></div>
                                )}

                                {activeView === 'legal' && (
                                    <div><h2 className="text-2xl font-bold mb-4">Legal Docs</h2><div className="space-y-2">{legalDocuments.map(d => (<div key={d.id} className="p-3 bg-white border rounded flex justify-between"><span>{d.title}</span><button onClick={() => setEditingLegalDoc(d)} className="text-blue-600 text-sm">Edit</button></div>))}</div></div>
                                )}

                                {activeView === 'settings' && storeSettings && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">Store Settings</h2>
                                        <div className="bg-white p-6 rounded shadow max-w-2xl space-y-4">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="text-sm font-bold">Support Email</label><input type="email" value={currentStoreSettings.email || ''} onChange={e => setCurrentStoreSettings({...currentStoreSettings, email: e.target.value})} className="border p-2 w-full rounded"/></div>
                                                <div><label className="text-sm font-bold">Contact Mobile</label><input type="text" value={currentStoreSettings.mobile || ''} onChange={e => setCurrentStoreSettings({...currentStoreSettings, mobile: e.target.value})} className="border p-2 w-full rounded"/></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="text-sm font-bold">WhatsApp Number</label><input type="text" value={currentStoreSettings.whatsapp_number || ''} onChange={e => setCurrentStoreSettings({...currentStoreSettings, whatsapp_number: e.target.value})} className="border p-2 w-full rounded"/></div>
                                                <div><label className="text-sm font-bold">Instagram URL</label><input type="text" value={currentStoreSettings.instagram_url || ''} onChange={e => setCurrentStoreSettings({...currentStoreSettings, instagram_url: e.target.value})} className="border p-2 w-full rounded"/></div>
                                            </div>
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                                <div><label className="text-sm font-bold">Facebook URL</label><input type="text" value={currentStoreSettings.facebook_url || ''} onChange={e => setCurrentStoreSettings({...currentStoreSettings, facebook_url: e.target.value})} className="border p-2 w-full rounded"/></div>
                                                <div><label className="text-sm font-bold">Razorpay Key ID</label><input type="text" value={currentStoreSettings.razorpay_key_id || ''} onChange={e => setCurrentStoreSettings({...currentStoreSettings, razorpay_key_id: e.target.value})} className="border p-2 w-full rounded"/></div>
                                            </div>

                                            <hr className="my-4" />
                                            
                                            <div className="grid grid-cols-2 gap-4">
                                                <div><label className="text-sm font-bold">Free Shipping Threshold (₹)</label><input type="number" value={currentStoreSettings.free_shipping_threshold ?? storeSettings.free_shipping_threshold} onChange={e => setCurrentStoreSettings({...currentStoreSettings, free_shipping_threshold: Number(e.target.value)})} className="border p-2 w-full rounded"/></div>
                                                <div><label className="text-sm font-bold">Standard Shipping Rate (₹)</label><input type="number" value={currentStoreSettings.shipping_rate ?? storeSettings.shipping_rate} onChange={e => setCurrentStoreSettings({...currentStoreSettings, shipping_rate: Number(e.target.value)})} className="border p-2 w-full rounded"/></div>
                                            </div>

                                            <div>
                                                <label className="text-sm font-bold block mb-2">Custom Shipping Tiers</label>
                                                <div className="space-y-2 bg-gray-50 p-4 rounded-xl border border-gray-100">
                                                    {shippingTiers.map((t, i) => (
                                                        <div key={i} className="flex gap-2 items-center bg-white p-2 rounded-lg border">
                                                            <div className="flex-1"><label className="text-[10px] uppercase font-bold text-gray-400">Min Cart ₹</label><input type="number" value={t.min_cart_value} onChange={e => handleUpdateTier(i, 'min_cart_value', Number(e.target.value))} className="border-none w-full p-1 focus:ring-0 font-bold"/></div>
                                                            <div className="flex-1"><label className="text-[10px] uppercase font-bold text-gray-400">Shipping ₹</label><input type="number" value={t.shipping_rate} onChange={e => handleUpdateTier(i, 'shipping_rate', Number(e.target.value))} className="border-none w-full p-1 focus:ring-0 font-bold"/></div>
                                                            <button onClick={() => handleRemoveTier(i)} className="p-2 text-red-500 hover:bg-red-50 rounded-full transition-colors"><XIcon className="w-5 h-5"/></button>
                                                        </div>
                                                    ))}
                                                    <button onClick={handleAddTier} className="w-full py-2 border-2 border-dashed border-gray-200 text-gray-400 font-bold rounded-lg hover:border-hav-forest hover:text-hav-forest transition-all">+ Add Shipping Rule</button>
                                                </div>
                                            </div>
                                            
                                            <div>
                                                <label className="block text-sm font-bold mb-1">Maps Embed URL (for Contact Page)</label>
                                                <textarea 
                                                    value={currentStoreSettings.maps_embed_url ?? storeSettings.maps_embed_url ?? ''} 
                                                    onChange={e => setCurrentStoreSettings({...currentStoreSettings, maps_embed_url: e.target.value})} 
                                                    className="border p-2 w-full rounded"
                                                    rows={3}
                                                    placeholder="<iframe src='...'...>"
                                                />
                                            </div>

                                            <label className="flex items-center gap-2 font-bold"><input type="checkbox" checked={currentStoreSettings.is_cod_enabled ?? storeSettings.is_cod_enabled} onChange={e => setCurrentStoreSettings({...currentStoreSettings, is_cod_enabled: e.target.checked})} className="w-5 h-5 accent-hav-forest"/> Enable Cash on Delivery</label>
                                            
                                            <div className="pt-4">
                                                <button onClick={handleSaveStoreSettings} className={primaryButtonStyles}>Apply All Settings</button>
                                            </div>
                                        </div>
                                    </div>
                                )}

                                {activeView === 'appearance' && storeSettings && (
                                    <div>
                                        <h2 className="text-2xl font-bold mb-4">Color & Style</h2>
                                        <div className="bg-white p-6 rounded shadow max-w-lg space-y-6">
                                            <div>
                                                <label className="block text-sm font-bold mb-2">Website Background Color (Hex)</label>
                                                <div className="flex gap-4 items-center">
                                                    <input 
                                                        type="color" 
                                                        value={currentStoreSettings.background_color ?? storeSettings.background_color ?? '#FCF2D5'} 
                                                        onChange={e => setCurrentStoreSettings({...currentStoreSettings, background_color: e.target.value})}
                                                        className="h-10 w-10 border p-1 rounded cursor-pointer"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={currentStoreSettings.background_color ?? storeSettings.background_color ?? '#FCF2D5'} 
                                                        onChange={e => setCurrentStoreSettings({...currentStoreSettings, background_color: e.target.value})}
                                                        className="border p-2 rounded uppercase w-32"
                                                        placeholder="#FCF2D5"
                                                    />
                                                </div>
                                            </div>

                                            <div>
                                                <label className="block text-sm font-bold mb-2">Image Carousel Background (Hex)</label>
                                                <div className="flex gap-4 items-center">
                                                    <input 
                                                        type="color" 
                                                        value={currentStoreSettings.carousel_background_color ?? storeSettings.carousel_background_color ?? '#0F4A3C'} 
                                                        onChange={e => setCurrentStoreSettings({...currentStoreSettings, carousel_background_color: e.target.value})}
                                                        className="h-10 w-10 border p-1 rounded cursor-pointer"
                                                    />
                                                    <input 
                                                        type="text" 
                                                        value={currentStoreSettings.carousel_background_color ?? storeSettings.carousel_background_color ?? '#0F4A3C'} 
                                                        onChange={e => setCurrentStoreSettings({...currentStoreSettings, carousel_background_color: e.target.value})}
                                                        className="border p-2 rounded uppercase w-32"
                                                        placeholder="#0F4A3C"
                                                    />
                                                </div>
                                            </div>

                                            <button onClick={handleSaveStoreSettings} className={primaryButtonStyles}>Save Colors</button>
                                        </div>
                                    </div>
                                )}
                            </>
                        )}
                    </main>
                </div>
            </div>
        </div>
    );
};

export default AdminApp;
