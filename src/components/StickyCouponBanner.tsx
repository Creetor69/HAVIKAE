import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Coupon, Page, CartItem, StoreSettings } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface StickyCouponBannerProps {
    navigateTo: (page: Page, context?: any) => void;
    cart: CartItem[];
    storeSettings?: StoreSettings | null;
    currentPage?: Page;
}

type SlideItem = 
  | { 
      type: 'shipping'; 
      id: string; 
      freeShippingThreshold: number; 
    }
  | { 
      type: 'coupon'; 
      id: string; 
      coupon: Coupon; 
    };

const StickyCouponBanner: React.FC<StickyCouponBannerProps> = ({ navigateTo, cart, storeSettings, currentPage }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    // Calculate subtotal in real-time
    const subtotal = useMemo(() => {
        return cart ? cart.reduce((sum, item) => sum + (item.price * item.quantity), 0) : 0;
    }, [cart]);

    // Fetch only active coupons that are flagged to show in banner in the admin panel
    useEffect(() => {
        const fetchCoupons = async () => {
            if (!supabase) return;
            try {
                const { data } = await supabase
                    .from('coupons')
                    .select('*')
                    .eq('is_active', true)
                    .eq('show_in_banner', true) // <-- Only couples flagged "show_in_banner" in admin panel
                    .order('min_cart_value', { ascending: true });
                
                if (data) {
                    setCoupons(data as Coupon[]);
                }
            } catch (err) {
                console.error("Error fetching coupons for banner:", err);
            }
        };
        fetchCoupons();
    }, []);

    // Build unique rotating slides combining Free Delivery promotion & coupons
    const slides = useMemo(() => {
        const list: SlideItem[] = [];

        // 1. Always include Free Shipping slide
        const freeShippingThreshold = storeSettings?.free_shipping_threshold ?? 499;
        list.push({
            id: 'free-shipping-promo',
            type: 'shipping',
            freeShippingThreshold
        });

        // 2. Add Coupon slides from Coupons fetched from DB
        const bannerCoupons = coupons.length > 0 ? coupons : [
            {
                id: 'default-cp-1',
                code: 'STEAL100',
                banner_text: 'Get flat ₹100 OFF on delicious traditional foods!',
                min_cart_value: 999,
                discount_type: 'fixed' as const,
                discount_value: 100,
                is_active: true,
                show_in_banner: true
            },
            {
                id: 'default-cp-2',
                code: 'WELCOME50',
                banner_text: 'Enjoy extra ₹50 OFF on your first purchase!',
                min_cart_value: 499,
                discount_type: 'fixed' as const,
                discount_value: 50,
                is_active: true,
                show_in_banner: true
            },
            {
                id: 'default-cp-3',
                code: 'TRADITION10',
                banner_text: 'Flat 10% OFF on all natural South Indian specialities!',
                min_cart_value: 799,
                discount_type: 'percentage' as const,
                discount_value: 10,
                is_active: true,
                show_in_banner: true
            }
        ] as Coupon[];

        bannerCoupons.forEach((c) => {
            list.push({
                id: `coupon-promo-${c.id || c.code}`,
                type: 'coupon',
                coupon: c
            });
        });

        return list;
    }, [coupons, storeSettings]);

    // Carousel auto-transition
    useEffect(() => {
        if (slides.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % slides.length);
        }, 4000);
        return () => clearInterval(interval);
    }, [slides.length]);

    // Don't render on Cart and Checkout pages to maintain optimal focus
    if (currentPage === 'cart' || currentPage === 'checkout') {
        return null;
    }

    if (slides.length === 0) {
        return null;
    }

    const currentSlide = slides[currentIndex % slides.length];

    // Determine lock/unlock status of the current slide
    let isUnlocked = false;
    let slideContent: React.ReactNode = null;

    if (currentSlide.type === 'shipping') {
        const threshold = currentSlide.freeShippingThreshold;
        isUnlocked = subtotal >= threshold;

        if (isUnlocked) {
            slideContent = (
                <span>
                    🎉 <strong className="font-extrabold uppercase tracking-wide text-red-700">UNLOCKED!</strong> You get <strong className="font-black text-black">FREE Delivery</strong> on this order! Standard shipping rate waived!
                </span>
            );
        } else {
            const difference = threshold - subtotal;
            slideContent = (
                <span>
                    🚚 Add <strong className="font-sans font-black">₹{difference.toFixed(0)}</strong> more to <strong className="font-sans font-black tracking-wide uppercase text-orange-700">UNLOCK FREE DELIVERY</strong> standard on your order!
                </span>
            );
        }
    } else {
        const c = currentSlide.coupon;
        const minVal = c.min_cart_value || 0;
        isUnlocked = subtotal >= minVal;

        const discountLabel = c.discount_type === 'percentage' 
            ? `${c.discount_value}% OFF` 
            : `₹${c.discount_value} OFF`;

        if (isUnlocked) {
            slideContent = (
                <span>
                    🎉 <strong className="font-extrabold uppercase tracking-wide text-red-700">UNLOCKED!</strong> Use code{' '}
                    <span className="underline decoration-2 underline-offset-2 font-mono font-black text-red-700">
                        {c.code}
                    </span>{' '}
                    to activate <strong className="font-black text-black">{discountLabel}</strong> at checkout!
                </span>
            );
        } else {
            const difference = minVal - subtotal;
            if (subtotal === 0) {
                slideContent = (
                    <span>
                        ✨ Use code{' '}
                        <span className="underline decoration-2 underline-offset-2 font-mono font-black text-orange-700">
                            {c.code}
                        </span>{' '}
                        for <strong className="font-bold text-[#0F4A3C]">{discountLabel}</strong> on orders above <strong className="font-bold text-[#0F4A3C]">₹{minVal}</strong>!
                    </span>
                );
            } else {
                slideContent = (
                    <span>
                        ✨ Add <strong className="font-bold text-orange-700">₹{difference.toFixed(0)}</strong> more to <strong className="font-black text-orange-700">UNLOCK</strong>:{' '}
                        <strong>{discountLabel}</strong> with code{' '}
                        <span className="underline decoration-2 underline-offset-2 font-mono font-black text-orange-700">
                            {c.code}
                        </span>!
                    </span>
                );
            }
        }
    }

    // Dynamic style based on lock/unlock state
    // When unlocked: bright vibrant yellow
    // When locked: elegant pastel golden yellow
    const bannerClasses = isUnlocked 
        ? "bg-[#FFE500] text-black border-b-[3px] border-yellow-500 shadow-md font-extrabold" 
        : "bg-[#FCF2D5] text-[#0F4A3C] border-b border-[#C9A236]/30 shadow-xs";

    return (
        <div 
            onClick={() => navigateTo('shop')}
            className={`cursor-pointer select-none transition-all duration-300 w-full relative overflow-hidden ${bannerClasses}`}
            id="always-active-coupon-banner"
        >
            <div className="w-full px-4 py-2 flex items-center justify-center">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${currentSlide.id}-${isUnlocked}`}
                        initial={{ opacity: 0, y: 5 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -5 }}
                        transition={{ duration: 0.25, ease: 'easeInOut' }}
                        className="flex items-center justify-center gap-2 text-center text-[11px] sm:text-xs"
                    >
                        <span className="bg-[#0F4A3C] text-[#FCF2D5] text-[8px] font-black px-1.5 py-0.5 rounded uppercase tracking-wider shrink-0 select-none">
                            {isUnlocked ? 'UNLOCKED' : (currentSlide.type === 'shipping' ? 'SHIPPING' : 'OFFER')}
                        </span>
                        
                        {slideContent}

                        <span className="hidden md:inline font-black text-[9px] uppercase tracking-wider text-black/70 ml-2 hover:underline">
                            Shop Now →
                        </span>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StickyCouponBanner;
