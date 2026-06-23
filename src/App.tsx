
import React, { useState, useEffect, useCallback, Suspense } from 'react';
import confetti from 'canvas-confetti';
import Layout from './components/Layout';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import AboutPage from './pages/AboutPage';
import RecipesPage from './pages/RecipesPage';
import RecipeDetailPage from './pages/RecipeDetailPage';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import SignUpPage from './pages/SignUpPage';
import ProfilePage from './pages/ProfilePage';
import CheckoutPage from './pages/CheckoutPage';
import CartPage from './pages/CartPage';
import WishlistPage from './pages/WishlistPage';
import ComparePage from './pages/ComparePage';
import LoadingSpinner from './components/LoadingSpinner';
import { User, Order, AuthCredentials, NewUser, CartItem, Product, Profile, OrderItem, OrderInsert, Coupon, Address, WishlistItem, PromotionalContent, LegalDocument, SaleBanner, StoreSettings, Category, ProductVariant, BlogPost, Page, PageContext, PageContent, AboutSection, AppNotification } from './types';
import { recipesData } from './data/recipes';
import { productsData } from './data/products';

import { supabase, supabaseInitializationError } from './supabaseClient';
import { RealtimeChannel } from '@supabase/supabase-js';
import LegalDocumentPage from './pages/LegalDocumentPage';
import QuickViewModal from './components/QuickViewModal';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import InfluencerPage from './pages/InfluencerPage';
import SitemapPage from './pages/SitemapPage';
import NotFoundPage from './pages/NotFoundPage';
import SocialLinksPage from './pages/SocialLinksPage';
import AdminPage from './pages/AdminPage';
import InfluencerApplyPage from './pages/InfluencerApplyPage';
import CombosPage from './pages/CombosPage';
import POSPage from './pages/POSPage';
import TrackOrderPage from './pages/TrackOrderPage';

const doodlePattern = `data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239a3412' fill-opacity='0.05'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E`;

type DecrementStockArgs = { p_variant_id: string; p_quantity: number };
type IncrementStockArgs = { p_variant_id: string; p_quantity: number };

const triggerWebsiteOrderWhatsApp = async (order: any, userName: string, userMobile: string) => {
  try {
    console.log(`[WEBSITE] Triggering automated WhatsApp for customer: ${userMobile}`);
    
    // Check if we have verified WhatsApp config in browser local storage
    const saved = localStorage.getItem('hav_whatsapp_config');
    if (saved) {
      const config = JSON.parse(saved);
      if (config.accessToken && config.phoneNumberId) {
        console.log("[WEBSITE WHATSAPP] Custom POS credentials found in localStorage. Syncing with exact same offline mechanism!");
        
        const cleanAndFormatMobile = (num: string) => {
          let sanitized = num.replace(/\D/g, '');
          if (sanitized.startsWith('0')) {
            sanitized = sanitized.substring(1);
          }
          if (sanitized.length < 10) return null;
          if (sanitized.startsWith('91') && sanitized.length === 12) {
            return sanitized;
          }
          if (sanitized.length === 10) {
            return '91' + sanitized;
          }
          return sanitized;
        };

        const targetNumbers: string[] = [];
        const customerNum = cleanAndFormatMobile(userMobile || order.shipping_address?.phone_number || '');
        if (customerNum) targetNumbers.push(customerNum);

        const configuredAlerts = config.recipientNumbers 
          ? config.recipientNumbers.split(',').map((s: string) => s.trim()).filter(Boolean)
          : ['8296925577', '9845024156'];

        for (const alert of configuredAlerts) {
          const cleanAlert = cleanAndFormatMobile(alert);
          if (cleanAlert && !targetNumbers.includes(cleanAlert)) {
            targetNumbers.push(cleanAlert);
          }
        }

        // Explicitly guarantee both admin alert numbers are pushed!
        const adminFallback1 = cleanAndFormatMobile('8296925577');
        const adminFallback2 = cleanAndFormatMobile('9845024156');
        if (adminFallback1 && !targetNumbers.includes(adminFallback1)) {
          targetNumbers.push(adminFallback1);
        }
        if (adminFallback2 && !targetNumbers.includes(adminFallback2)) {
          targetNumbers.push(adminFallback2);
        }

        const isPaid = order.payment_id || order.payment_method === 'Razorpay' || order.status === 'Payment Received' || order.payment_status === 'Paid Full';
        const displayPaymentStatus = isPaid
          ? "Paid securely! 💳 Thank you"
          : `Payment due: ₹${order.total}`;

        const templateName = "hav_order";
        const languageCode = config.languageCode || "en";


        const productsSummary = Array.isArray(order.items)
          ? order.items.map((item: any) => `${item.quantity}x ${item.name || 'Product'}${item.net_weight ? ` (${item.net_weight})` : ''}`).join(', ')
          : 'Traditional Foods';

        const orderIdStr = String(order.order_number || (typeof order.id === 'string' && order.id.includes('-') ? order.id.split('-')[1].toUpperCase() : order.id));

        for (const recipient of targetNumbers) {
          const whatsappPayload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipient,
            type: "template",
            template: {
              name: templateName,
              language: { code: languageCode },
              components: [
                {
                  type: "body",
                  parameters: [
                    { type: "text", text: userName || order.shipping_address?.name || 'Customer' }, // {{1}} Name
                    { type: "text", text: orderIdStr }, // {{2}} Order ID
                    { type: "text", text: productsSummary.slice(0, 1020) }, // {{3}} Products
                    { type: "text", text: `₹${order.total}` }, // {{4}} Total Amount
                    { type: "text", text: displayPaymentStatus }, // {{5}} Payment Status
                    { type: "text", text: order.status || 'Order Placed' } // {{6}} Order Status
                  ]
                }
              ]
            }
          };

          console.log(`[WEBSITE WHATSAPP] Dispatching customized template direct to Meta API for: ${recipient}`);
          
          await fetch(`https://graph.facebook.com/v21.0/${config.phoneNumberId}/messages`, {
            method: 'POST',
            headers: { 
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${config.accessToken}`
            },
            body: JSON.stringify(whatsappPayload)
          });
        }
        return; // Early return because customized POS fallback completed sending successfully!
      }
    }

    // Standard fallback direct to Meta Cloud API (replacing backend proxy)
    const phoneId = (import.meta as any).env.VITE_WHATSAPP_PHONE_NUMBER_ID || '1066359256570178';
    const token = (import.meta as any).env.VITE_WHATSAPP_ACCESS_TOKEN || 'EAA3srEndgnwBRuR8l2uyJpNQg61bicvde6X8XZBvZBBfcIvbiJnaH8hKM5oUbzJxxkO5mc3JnoFQvOWKPO53gElRlrshpZCAYb2tZATTjzDLGlZClZBlqtTYCetVsCFXTmIPZBbw3CDrZCMHaKrMSTsWPVec6sUIJbZCiZByhDncRo76B7E89nDDUiAC3tvVZCI5AVZCZCQZDZD';
    const templateName = (import.meta as any).env.VITE_WHATSAPP_TEMPLATE_NAME || 'hav_order';
    
    // Deduplicate and gather all numbers:
    const targetNumbers = new Set<string>();
    
    const cleanAndFormatMobile = (num: string) => {
      if (!num) return null;
      let sanitized = num.replace(/\D/g, '');
      if (sanitized.startsWith('0')) sanitized = sanitized.substring(1);
      if (sanitized.length < 10) return null;
      if (sanitized.startsWith('91') && sanitized.length === 12) return sanitized;
      if (sanitized.length === 10) return '91' + sanitized;
      return sanitized;
    };

    // 1. Add customer
    const custNum = cleanAndFormatMobile(userMobile || order.shipping_address?.phone_number || '');
    if (custNum) targetNumbers.add(custNum);

    // 2. Add admins
    const adminNumStr = (import.meta as any).env.VITE_WHATSAPP_RECIPIENT_NUMBERS || '8296925577, 9845024156';
    adminNumStr.split(',').forEach(num => {
       const cleanNum = cleanAndFormatMobile(num);
       if (cleanNum) targetNumbers.add(cleanNum);
    });

    const isPaid = order.payment_id || order.payment_method === 'Razorpay' || order.status === 'Payment Received' || order.payment_status === 'Paid Full';
    const displayPaymentStatus = isPaid ? "Paid securely! 💳 Thank you" : `Payment due: ₹${order.total}`;

    const productsSummary = Array.isArray(order.items)
      ? order.items.map((item: any) => `${item.quantity}x ${item.name || 'Product'}${item.net_weight ? ` (${item.net_weight})` : ''}`).join(', ')
      : 'Traditional Foods';

    const orderIdStr = String(order.order_number || (typeof order.id === 'string' && order.id.includes('-') ? order.id.split('-')[1].toUpperCase() : order.id));

    Array.from(targetNumbers).forEach(async (recipient) => {
      const payload = {
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: recipient,
        type: "template",
        template: {
          name: templateName,
          language: { code: "en" },
          components: [
            {
              type: "body",
              parameters: [
                { type: "text", text: userName || order.shipping_address?.name || 'Customer' },
                { type: "text", text: orderIdStr },
                { type: "text", text: productsSummary.slice(0, 1020) },
                { type: "text", text: `₹${order.total}` },
                { type: "text", text: displayPaymentStatus },
                { type: "text", text: order.status || 'Order Placed' }
              ]
            }
          ]
        }
      };

      await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
    });

  } catch (err) {
    console.error("[WEBSITE WHATSAPP] Failed background transmission:", err);
  }
};

const parseUrlPath = (pathname: string): { page: Page; context: PageContext } => {
    const path = pathname.replace(/^\/+|\/+$/g, '');
    const parts = path.split('/');

    if (path === '') return { page: 'home', context: {} };
    
    const pageCandidate = parts[0] as Page;
    const context: PageContext = {};

    const validPages: Page[] = ['home', 'shop', 'product', 'about', 'recipes', 'recipeDetail', 'contact', 'login', 'signup', 'profile', 'checkout', 'cart', 'wishlist', 'compare', 'legal', 'combos', 'influencer', 'partners', 'sitemap', 'social', 'admin', 'applyInfluencer'];

    if (!validPages.includes(pageCandidate)) return { page: 'notFound', context: {} }; 
    
    const page = pageCandidate;

    switch (page) {
      case 'partners':
      case 'influencer': 
        // Both map to influencer page
        return { page: 'influencer', context: {} };
      case 'product': if (parts[1]) context.productId = parts[1]; break;
      case 'recipeDetail': if (parts[1]) context.recipeId = parts[1]; break;
      case 'shop': if (parts[1]) context.category = decodeURIComponent(parts[1]); break;
      case 'legal': if (parts[1]) context.documentId = parts[1]; break;
      default: break;
    }
    return { page, context };
};

const getPathFromRoute = (page: Page, context: PageContext = {}) => {
    if (page === 'home') return '/';
    if (page === 'product' && context.productId) return `/product/${context.productId}`;
    if (page === 'recipeDetail' && context.recipeId) return `/recipeDetail/${context.recipeId}`;
    if (page === 'shop' && context.category) return `/shop/${encodeURIComponent(context.category)}`;
    if (page === 'legal' && context.documentId) return `/legal/${context.documentId}`;
    if (page === 'influencer') return '/partners';
    if (page === 'notFound') return '/404';
    return `/${page}`;
};

const App: React.FC = () => {
  const [currentRoute, setCurrentRoute] = useState<{ page: Page; context: PageContext }>(() => {
      const redirect = sessionStorage.getItem('redirect');
      if (redirect) {
          sessionStorage.removeItem('redirect');
          try {
            const redirectUrl = new URL(redirect, window.location.origin);
            const path = redirectUrl.pathname;
            window.history.replaceState(null, '', path + redirectUrl.search + redirectUrl.hash);
            return parseUrlPath(path);
          } catch(e) { return parseUrlPath(window.location.pathname); }
      }
      return parseUrlPath(window.location.pathname);
  });
  
  const [user, setUser] = useState<User | null>(null);
  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const savedCart = localStorage.getItem('havikarCart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) { return []; }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [wishlist, setWishlist] = useState<string[]>(() => {
    try {
      const savedWishlist = localStorage.getItem('havikarWishlist');
      return savedWishlist ? JSON.parse(savedWishlist) : [];
    } catch (error) { return []; }
  });
  const [promotionalContent, setPromotionalContent] = useState<PromotionalContent[]>([]);
  const [legalDocuments, setLegalDocuments] = useState<LegalDocument[]>([]);
  const [saleBanner, setSaleBanner] = useState<SaleBanner | null>(null);
  const [storeSettings, setStoreSettings] = useState<StoreSettings | null>(null);
  const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
  const [blogPosts, setBlogPosts] = useState<BlogPost[]>([]);
  const [aboutPageContent, setAboutPageContent] = useState<PageContent | null>(null);
  const [aboutSections, setAboutSections] = useState<AboutSection[]>([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const [isExitIntentOpen, setIsExitIntentOpen] = useState(false);

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      // Trigger if mouse moves above viewport and cart has items
      if (e.clientY < 30 && cart.length > 0) {
        const alreadyShown = sessionStorage.getItem('havikarExitIntentShown');
        if (!alreadyShown) {
          setIsExitIntentOpen(true);
          sessionStorage.setItem('havikarExitIntentShown', 'true');
        }
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => {
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [cart]);

  // Persistence Effects
  useEffect(() => {
    localStorage.setItem('havikarCart', JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem('havikarWishlist', JSON.stringify(wishlist));
  }, [wishlist]);

  const fetchUserCartAndWishlist = useCallback(async (userId: string) => {
    if (!supabase) return;
    try {
      const [cartRes, wishlistRes, notificationsRes] = await Promise.all([
        supabase.from('cart_items').select('*, products(*), product_variants(*)').eq('user_id', userId),
        supabase.from('wishlist_items').select('product_id').eq('user_id', userId),
        supabase.from('notifications').select('*').eq('user_id', userId).order('created_at', { ascending: false })
      ]);

      if (cartRes.data && cartRes.data.length > 0) {
        const dbCart: CartItem[] = cartRes.data.map(item => ({
          productId: item.product_id,
          variantId: item.variant_id,
          name: item.products.name,
          imageUrl: item.products.image_urls[0],
          net_weight: item.product_variants.net_weight,
          price: item.product_variants.price,
          mrp: item.product_variants.mrp,
          gst_rate: item.products.gst_rate,
          quantity: item.quantity,
          stock_quantity: item.product_variants.stock_quantity
        }));
        setCart(dbCart);
      }

      if (wishlistRes.data && wishlistRes.data.length > 0) {
        setWishlist(wishlistRes.data.map(item => item.product_id));
      }

      if (notificationsRes.data) {
        setNotifications(notificationsRes.data);
        setUnreadCount(notificationsRes.data.filter(n => !n.is_read).length);
      }
    } catch (error) { console.error("Fetch cart/wishlist error:", error); }
  }, []);

  const markNotificationAsRead = async (notificationId: string) => {
    if (!supabase || !user) return;
    const { error } = await supabase
      .from('notifications')
      .update({ is_read: true })
      .eq('id', notificationId);
    
    if (!error) {
      setNotifications(prev => prev.map(n => n.id === notificationId ? { ...n, is_read: true } : n));
      setUnreadCount(prev => Math.max(0, prev - 1));
    }
  };

  useEffect(() => {
    if (!supabase || !user) return;

    const channel = supabase
      .channel('user-notifications')
      .on('postgres_changes', { 
        event: 'INSERT', 
        schema: 'public', 
        table: 'notifications',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        setNotifications(prev => [payload.new as AppNotification, ...prev]);
        setUnreadCount(prev => prev + 1);
        
        if (window.Notification && window.Notification.permission === 'granted') {
            new window.Notification(payload.new.title, {
                body: payload.new.message,
            });
        }
      })
      .subscribe();

    if (window.Notification && window.Notification.permission === 'default') {
        window.Notification.requestPermission();
    }

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  const openQuickView = (product: Product) => setQuickViewProduct(product);
  const closeQuickView = () => setQuickViewProduct(null);

  const fetchAllApplicationData = useCallback(async (isBackgroundRefresh = false) => {
        if (!supabase) { setIsLoading(false); return; }
        if (isBackgroundRefresh) setIsRefreshing(true);
        try {
            const results = await Promise.allSettled([
                supabase.from('products').select('*, categories(id, name), product_variants(*)').order('name', { ascending: true }),
                supabase.from('promotional_content').select('*').order('sort_order', { ascending: true }),
                supabase.from('legal_documents').select('*').order('title', { ascending: true }),
                supabase.from('store_settings').select('*').eq('id', 1).single(),
                supabase.from('categories').select('*').order('name', { ascending: true }),
                supabase.from('sale_banners').select('*').eq('is_active', true).order('created_at', { ascending: false }).limit(1).maybeSingle(),
                supabase.from('page_content').select('*').eq('page_slug', 'about').maybeSingle(),
                supabase.from('about_sections').select('*').eq('is_active', true).order('sort_order', { ascending: true })
            ]);
            const getResult = (index: number) => (results[index].status === 'fulfilled' ? (results[index] as any).value.data : null);
            const productsDataDB = getResult(0);
            if (productsDataDB) setProducts(productsDataDB.filter((p: any) => !p.is_offline_only));
            setPromotionalContent(getResult(1) || []);
            setLegalDocuments(getResult(2) || []);
            let dbSettings = getResult(3);
            if (!dbSettings) {
                dbSettings = {
                    id: 1,
                    is_banner_carousel_enabled: true,
                    global_banner_duration: 7
                };
            }
            try {
                const localEnabled = localStorage.getItem('hav_is_banner_carousel_enabled');
                const localDuration = localStorage.getItem('hav_global_banner_duration');
                if (localEnabled !== null) {
                    dbSettings.is_banner_carousel_enabled = JSON.parse(localEnabled);
                }
                if (localDuration !== null) {
                    dbSettings.global_banner_duration = Number(localDuration);
                }
            } catch (e) {
                console.error("Local storage settings fallback error:", e);
            }
            setStoreSettings(dbSettings);
            setCategories(getResult(4) || []);
            setSaleBanner(getResult(5));
            setAboutPageContent(getResult(6));
            setAboutSections(getResult(7) || []);
        } catch (error: any) { console.error(error); } 
        finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);

  const navigateTo = useCallback((page: Page, context: PageContext = {}) => {
    if (page === 'admin') { window.location.href = '/admin.html'; return; }
    
    // Handle login redirect for checkout
    if (page === 'login' && window.location.pathname.includes('checkout')) {
      sessionStorage.setItem('loginRedirect', window.location.href);
    }

    const path = getPathFromRoute(page, context);
    window.location.href = path;
  }, []);

  const placeOrder = async (options: { 
    pointsToRedeem: number; 
    paymentMethod: Order['payment_method']; 
    paymentId?: string; 
    coupon?: Coupon; 
    shippingAddress: Address;
    total: number;
    shipping_amount: number;
    discount_amount: number;
  }): Promise<Order> => {
    if (!user) { navigateTo('login'); throw new Error("User not logged in"); }
    
    // Use values passed from the checkout page which has the full logic
    const finalTotal = options.total;

    // 1. Sanitize Data
    const sanitizedAddress = {
        ...options.shippingAddress,
        phone_number: (options.shippingAddress.phone_number || '').replace(/\D/g, '').slice(-10)
    };

    const orderPayload = { 
        user_id: user.id,
        items: cart.map(item => ({ 
            product_id: item.productId, 
            variant_id: item.variantId, 
            name: item.name, 
            price: item.price, 
            image_url: item.imageUrl, 
            quantity: item.quantity, 
            net_weight: item.net_weight 
        })),
        total: finalTotal,
        shipping_amount: options.shipping_amount,
        discount_amount: options.discount_amount,
        status: options.paymentId ? 'Payment Received' : 'Processing',
        points_redeemed: options.pointsToRedeem,
        payment_method: options.paymentMethod,
        payment_id: options.paymentId,
        coupon_code: options.coupon?.code,
        shipping_address: sanitizedAddress
    };

    // 2. CORE ACTION: Insert Order
    // This is the ONLY thing that MUST succeed for the order to be considered "placed"
    const { data: insertedOrder, error: orderError } = await supabase!.from('orders').insert([orderPayload]).select().single();
    
    if (orderError) {
        console.error("CRITICAL: Database failed to save order:", orderError);
        // If this fails with a libcurl error, it's 100% a Supabase Webhook/Trigger issue
        if (orderError.message?.includes('libcurl')) {
            throw new Error("Database configuration error (Webhook failure). Please check Supabase Dashboard -> Database -> Webhooks and disable any active webhooks on the 'orders' table.");
        }
        throw orderError;
    }

    // Update wallet reward points: deduct redeemed points and add 5% cashback on the order total
    const earnedRefund = Number((finalTotal * 0.05).toFixed(2));
    const updatedPoints = Math.round((Math.max(0, (user.reward_points || 0) - options.pointsToRedeem + earnedRefund)) * 100) / 100;
    supabase!.from('profiles').update({ reward_points: updatedPoints }).eq('id', user.id)
        .then(({ error }) => {
            if (error) console.error("Wallet update failed:", error);
            else console.log(`Wallet updated. Deducted: ${options.pointsToRedeem}, Added: ${earnedRefund}, New balance: ${updatedPoints}`);
        });
    setUser(prev => prev ? { ...prev, reward_points: updatedPoints } : null);

    // 3. BACKGROUND ACTIONS: Do not 'await' these to ensure the user sees the success screen immediately
    
    // A. Internal Notification
    supabase!.from('notifications').insert([{
        user_id: user.id,
        title: 'Order Placed Successfully! 🎉',
        message: `Your order #${insertedOrder.order_number} for ₹${finalTotal.toFixed(2)} has been placed.`,
        type: 'order_placed',
        order_id: insertedOrder.id
    }]).then(({ error }) => error && console.error("Internal notification failed:", error));

    // B. External Alerts (Telegram/Email)
    // We call this but don't 'await' it to keep checkout fast.
    // However, we log the result for debugging.
    supabase!.functions.invoke('order-alert', {
        body: { record: insertedOrder }
    }).then(({ data, error }) => {
        if (error) {
            console.error("External notification failed:", error);
        } else {
            console.log("External notification sent successfully:", data);
        }
    }).catch(e => console.error("External notification exception:", e));

    // C. Inventory Update
    Promise.all(cart.map(item => supabase!.rpc('decrement_stock', { p_variant_id: item.variantId, p_quantity: item.quantity })))
        .catch(e => console.error("Stock update failed:", e));

    // D. Automatic Customer WhatsApp Confirmation
    triggerWebsiteOrderWhatsApp(insertedOrder, user.name || '', sanitizedAddress.phone_number || '');

    // E. Export to Google Sheets 
    const sheetsWebhookUrl = (import.meta as any).env.VITE_GOOGLE_SHEETS_WEBHOOK_URL;
    if (sheetsWebhookUrl) {
      fetch(sheetsWebhookUrl, {
          method: 'POST',
          mode: 'no-cors', // Apps script webhooks often require no-cors to prevent preflight blockage on some clients
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            order_id: String(insertedOrder.order_number || insertedOrder.id),
            date: new Date().toLocaleDateString(),
            customer_name: insertedOrder.shipping_address?.name || user.name || 'N/A',
            phone: insertedOrder.shipping_address?.phone_number || 'N/A',
            address: `${insertedOrder.shipping_address?.address || ''}, ${insertedOrder.shipping_address?.city || ''}, ${insertedOrder.shipping_address?.state || ''} - ${insertedOrder.shipping_address?.zip_code || ''}`,
            amount: insertedOrder.total,
            payment_status: insertedOrder.payment_id || insertedOrder.payment_method === 'Razorpay' ? 'Paid' : 'Pending',
            order_status: insertedOrder.status,
            products: Array.isArray(insertedOrder.items) ? insertedOrder.items.map((i: any) => `${i.quantity}x ${i.name}`).join(', ') : ''
          })
      })
      .then(() => console.log('[GOOGLE SHEETS] Sync complete response'))
      .catch(e => console.error('[GOOGLE SHEETS] Request failed:', e));
    } else {
      console.log('[GOOGLE SHEETS] Sync bypassed. Webhook URL not provided in VITE_GOOGLE_SHEETS_WEBHOOK_URL');
    }

    // 4. Cleanup UI State
    if (user && supabase) {
        supabase.from('cart_items').delete().eq('user_id', user.id)
            .then(({ error }) => {
                if (error) console.error("Database order cart cleanup error:", error);
            });
    }
    setCart([]);
    fetchAllApplicationData(true);
    
    return insertedOrder;
  };

  const handleLogin = async (credentials: AuthCredentials): Promise<boolean> => {
    const isEmail = credentials.loginId.includes('@');
    const loginPayload = isEmail 
      ? { email: credentials.loginId, password: credentials.password! }
      : { phone: credentials.loginId.startsWith('+') ? credentials.loginId : `+91${credentials.loginId}`, password: credentials.password! };
    
    const { error } = await supabase!.auth.signInWithPassword(loginPayload);
    if (error) {
        console.error("Login error:", error.message);
        alert(error.message);
    }
    return !error;
  };

  const handleSignUp = async (newUser: NewUser): Promise<{ success: boolean; message: string }> => {
    const { error } = await supabase!.auth.signUp({ email: newUser.email, password: newUser.password!, options: { data: { name: newUser.name, mobile: newUser.mobile } } });
    if (error) return { success: false, message: error.message };
    return { success: true, message: "Sign up successful! Please check your email for verification." };
  };

  const handleLogout = async () => { await supabase!.auth.signOut(); navigateTo('home'); };

  const addToCart = async (product: Product, selectedVariant: ProductVariant, quantity: number = 1) => {
    if (quantity > selectedVariant.stock_quantity) { alert(`Only ${selectedVariant.stock_quantity} left!`); return; }
    
    // Colorful celebratory South Indian harvest theme confetti bursts
    confetti({
        particleCount: 150,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#0F4A3C', '#F48E2F', '#D1A153', '#FFFFFF']
    });

    const newItem: CartItem = { 
      productId: product.id, 
      variantId: selectedVariant.id, 
      name: product.name, 
      imageUrl: product.image_urls[0], 
      net_weight: selectedVariant.net_weight, 
      price: selectedVariant.price, 
      mrp: selectedVariant.mrp, 
      gst_rate: product.gst_rate, 
      quantity, 
      stock_quantity: selectedVariant.stock_quantity 
    };

    setCart(prev => {
        const existing = prev.find(item => item.variantId === selectedVariant.id);
        
        if (existing) {
            return prev.map(item => item.variantId === selectedVariant.id ? { ...item, quantity: item.quantity + quantity } : item);
        } else {
            return [...prev, newItem];
        }
    });

    if (user && supabase) {
        // Current item
        const { data: existing } = await supabase.from('cart_items').select('quantity').eq('user_id', user.id).eq('variant_id', selectedVariant.id).maybeSingle();
        if (existing) {
            await supabase.from('cart_items').update({ quantity: existing.quantity + quantity }).eq('user_id', user.id).eq('variant_id', selectedVariant.id);
        } else {
            await supabase.from('cart_items').insert([{ user_id: user.id, product_id: product.id, variant_id: selectedVariant.id, quantity }]);
        }
    }

    setIsCartOpen(true);
  };

  const removeFromCart = async (variantId: string) => {
    setCart(prev => prev.filter(item => item.variantId !== variantId));
    if (user && supabase) {
        await supabase.from('cart_items').delete().eq('user_id', user.id).eq('variant_id', variantId);
    }
  };

  const updateCartQuantity = async (variantId: string, quantity: number) => {
    if (quantity <= 0) {
      removeFromCart(variantId);
      return;
    }
    
    setCart(prev => prev.map(item => item.variantId === variantId ? { ...item, quantity } : item));
    if (user && supabase) {
        await supabase.from('cart_items').update({ quantity }).eq('user_id', user.id).eq('variant_id', variantId);
    }
  };

  const addToWishlist = async (productId: string) => {
    if (!wishlist.includes(productId)) {
        setWishlist(prev => [...prev, productId]);
        if (user && supabase) {
            await supabase.from('wishlist_items').upsert([{ user_id: user.id, product_id: productId }], { onConflict: 'user_id,product_id' });
        }
    }
  };

  const removeFromWishlist = async (productId: string) => {
    setWishlist(prev => prev.filter(id => id !== productId));
    if (user && supabase) {
        await supabase.from('wishlist_items').delete().eq('user_id', user.id).eq('product_id', productId);
    }
  };

  useEffect(() => {
    if (!supabase) return;
    
    // Check current session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        // Fetch profile data
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
              setUser({ ...session.user, ...data } as User);
              fetchUserCartAndWishlist(session.user.id);
          }
          else setUser(session.user as any as User);
        });
      }
    });

    // Listen for changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        supabase.from('profiles').select('*').eq('id', session.user.id).single().then(({ data }) => {
          if (data) {
              setUser({ ...session.user, ...data } as User);
              fetchUserCartAndWishlist(session.user.id);
          }
          else setUser(session.user as any as User);
        });
      } else {
        setUser(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => { fetchAllApplicationData(); }, [fetchAllApplicationData]);

  if (isLoading) return <div className="min-h-screen bg-hav-cream flex items-center justify-center"><LoadingSpinner /></div>;
  
  const { page: currentPage, context: pageContext } = currentRoute;

  const pageContent = () => {
    try {
      switch (currentPage) {
        case 'home': return <HomePage navigateTo={navigateTo} products={products} promotionalContent={promotionalContent} openQuickView={openQuickView} categories={categories} storeSettings={storeSettings} addToCart={addToCart} />;
        case 'shop': return <ShopPage navigateTo={navigateTo} products={products} initialCategory={pageContext.category} wishlist={wishlist} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} storeSettings={storeSettings} categories={categories} openQuickView={openQuickView} addToCart={addToCart} onBuyNow={handleBuyNow} />;
        case 'product': return pageContext.productId ? <ProductPage productId={pageContext.productId} user={user} navigateTo={navigateTo} addToCart={addToCart} onBuyNow={handleBuyNow} products={products} cart={cart} wishlist={wishlist} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} openQuickView={openQuickView} /> : <NotFoundPage navigateTo={navigateTo} />;
        case 'combos': return <CombosPage products={products} navigateTo={navigateTo} addToCart={addToCart} />;
        case 'about': return <AboutPage navigateTo={navigateTo} sections={aboutSections} />;
        case 'recipes': return <RecipesPage navigateTo={navigateTo} products={products} />;
        case 'recipeDetail': const r = recipesData.find(r => r.id === pageContext.recipeId); return r ? <RecipeDetailPage recipe={r} navigateTo={navigateTo} products={products} addToCart={addToCart} /> : <NotFoundPage navigateTo={navigateTo} />;
        case 'contact': return <ContactPage />;
        case 'login': return <LoginPage onLogin={handleLogin} navigateTo={navigateTo} />;
        case 'signup': return <SignUpPage onSignUp={handleSignUp} navigateTo={navigateTo} />;
        case 'profile': return user ? <ProfilePage user={user} onLogout={handleLogout} updateOrderStatus={async (orderId, status) => { await supabase!.from('orders').update({ status }).eq('id', orderId); }} navigateTo={navigateTo} addToCart={addToCart} products={products} /> : <LoginPage onLogin={handleLogin} navigateTo={navigateTo} />;
        case 'checkout': return user ? <CheckoutPage cart={cart} placeOrder={placeOrder} navigateTo={navigateTo} user={user} storeSettings={storeSettings} products={products} categories={categories} updateCartQuantity={updateCartQuantity} removeFromCart={removeFromCart} /> : <LoginPage onLogin={handleLogin} navigateTo={navigateTo} />;
        case 'cart': return <CartPage cart={cart} navigateTo={navigateTo} updateCartQuantity={updateCartQuantity} removeFromCart={removeFromCart} storeSettings={storeSettings} products={products} user={user} addToCart={addToCart} />;
        case 'wishlist': return <WishlistPage wishlist={wishlist} products={products} navigateTo={navigateTo} addToWishlist={addToWishlist} removeFromWishlist={removeFromWishlist} openQuickView={openQuickView} addToCart={addToCart} onBuyNow={handleBuyNow} />;
        case 'applyInfluencer': return <InfluencerApplyPage user={user} navigateTo={navigateTo} />;
        case 'influencer': return <InfluencerPage user={user} createInfluencerCoupon={async () => true} requestWithdrawal={async () => true} storeSettings={storeSettings} navigateTo={navigateTo} />;
        case 'legal': {
          const doc = legalDocuments.find(d => d.id === pageContext.documentId);
          return doc ? <LegalDocumentPage document={doc} /> : <NotFoundPage navigateTo={navigateTo} />;
        }
        default: return <NotFoundPage navigateTo={navigateTo} />;
      }
    } catch (error) {
      console.error('Error rendering page content:', error);
      return (
        <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
          <h2 className="text-2xl font-serif font-bold text-hav-forest mb-4">Something went wrong</h2>
          <p className="text-hav-olive mb-6">We encountered an error while loading this page. Please try refreshing.</p>
          <button onClick={() => window.location.reload()} className="bg-hav-forest text-hav-gold px-8 py-3 rounded-full font-bold">Refresh Page</button>
        </div>
      );
    }
  };

  const handleBuyNow = async (p: Product, v: ProductVariant, q: number) => { await addToCart(p, v, q); navigateTo('checkout'); };

  return (
    <>
      <Layout navigateTo={navigateTo} currentRoute={currentRoute} user={user} onLogout={handleLogout} cart={cart} isCartOpen={isCartOpen} toggleCart={() => setIsCartOpen(!isCartOpen)} updateCartQuantity={updateCartQuantity} removeFromCart={removeFromCart} navigateToCheckout={() => navigateTo('cart')} isSearchOpen={isSearchOpen} toggleSearch={() => setIsSearchOpen(!isSearchOpen)} products={products} wishlist={wishlist} saleBanner={saleBanner} categories={categories} recipes={recipesData} blogPosts={blogPosts} logoUrl={storeSettings?.logo_url} storeSettings={storeSettings} notifications={notifications} unreadCount={unreadCount} markAsRead={markNotificationAsRead}>
        {pageContent()}
      </Layout>

      {/* 🎯 Premium Cart Exit-Intent Recovery Modal Overlay */}
      {isExitIntentOpen && (
          <div className="fixed inset-0 bg-black/75 z-[150] flex items-center justify-center p-4 backdrop-blur-xs animate-fadeIn">
              <div 
                  className="bg-white rounded-3xl overflow-hidden max-w-sm w-full border border-hav-gold/20 shadow-2xl relative"
                  onClick={e => e.stopPropagation()}
              >
                  {/* Close button */}
                  <button 
                      onClick={() => setIsExitIntentOpen(false)}
                      className="absolute top-3 right-3 text-gray-400 hover:text-hav-forest bg-gray-100 hover:bg-gray-200 transition-colors w-7 h-7 flex items-center justify-center rounded-full z-10 cursor-pointer"
                  >
                      ✕
                  </button>

                  {/* Header visual banner */}
                  <div className="bg-gradient-to-br from-hav-forest via-[#13493C] to-hav-olive text-hav-gold p-5 text-center relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full filter blur-xl transform translate-x-8 -translate-y-8 shrink-0 pointer-events-none" />
                      
                      <span className="text-3xl block mb-1 select-none">🎁</span>
                      <h3 className="text-lg font-serif font-bold text-white tracking-wide leading-snug">
                          Wait! Don't go empty-handed...
                      </h3>
                      <p className="text-[9px] text-hav-gold/90 mt-1 uppercase font-black tracking-widest font-sans">
                          Exclusive Instant Recovery Deal
                      </p>
                  </div>

                  {/* Content body */}
                  <div className="p-5 text-center space-y-3">
                      <div className="bg-amber-50/50 p-3 rounded-xl border border-amber-100 shadow-inner">
                          <p className="text-[10px] text-hav-olive font-extrabold uppercase tracking-wide">
                              Get Flat Discount on your Bag!
                          </p>
                          <p className="text-3xl font-black text-hav-orange-700 tracking-tight mt-1 font-sans">
                              ₹100 OFF
                          </p>
                          <p className="text-[9px] text-gray-500 mt-0.5">
                              On minimum order value of ₹999. Fresh batch dispatched soon!
                          </p>
                      </div>

                      {/* Display Coupon Code */}
                      <div className="bg-gray-50 border border-gray-150 rounded-lg p-2 flex flex-col items-center justify-center">
                          <p className="text-[8px] uppercase font-bold text-gray-400">Voucher Code</p>
                          <span className="text-base font-black text-hav-forest tracking-wider font-mono select-all bg-white px-3 py-1 rounded border border-gray-200 mt-0.5">
                              STEAL100
                          </span>
                          <span className="text-[8px] text-hav-orange-600 font-extrabold uppercase tracking-wide mt-1 animate-pulse">
                              🔥 Expires in 15 minutes!
                          </span>
                      </div>

                      {/* Social proof buyer highlight excerpt */}
                      <div className="text-left border-l-4 border-hav-gold pl-2.5 bg-hav-cream/20 py-1.5 rounded-r-lg">
                          <p className="text-[9px] italic text-hav-olive leading-relaxed font-serif">
                              "The organic appeal and traditional taste are sensational. My family could not get enough of the fresh podi mix!"
                          </p>
                          <p className="text-[7px] font-black uppercase text-[#0F4A3C] tracking-widest mt-1">
                              — Lakshmi S., Verified Buyer
                          </p>
                      </div>

                      {/* CTA Actions */}
                      <div className="space-y-1.5 pt-1">
                          <button 
                              onClick={() => {
                                  sessionStorage.setItem('preAppliedCouponCode', 'STEAL100');
                                  setIsExitIntentOpen(false);
                                  navigateTo('cart');
                              }}
                              className="w-full bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-black py-2.5 rounded-full transition-all transform hover:scale-[1.01] shadow-md hover:shadow-hav-orange-500/10 cursor-pointer uppercase tracking-wider text-[10px] font-sans"
                          >
                              Apply Coupon & View Offers
                          </button>
                          <button 
                              onClick={() => setIsExitIntentOpen(false)}
                              className="w-full text-gray-500 hover:text-hav-forest font-bold text-[9px] uppercase tracking-wider hover:underline"
                          >
                              No thanks, I prefer regular price
                          </button>
                      </div>
                  </div>
              </div>
          </div>
      )}
    </>
  );
};

export default App;
