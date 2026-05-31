
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Coupon, Page, CartItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';

interface StickyCouponBannerProps {
    navigateTo: (page: Page, context?: any) => void;
    cart: CartItem[];
}

const StickyCouponBanner: React.FC<StickyCouponBannerProps> = ({ navigateTo, cart }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [currentIndex, setCurrentIndex] = useState(0);

    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);

    useEffect(() => {
        const fetchCoupons = async () => {
            if (!supabase) return;
            const { data } = await supabase!
                .from('coupons')
                .select('*')
                .eq('is_active', true)
                .eq('show_in_banner', true)
                .order('is_sponsored', { ascending: false })
                .order('min_cart_value', { ascending: true });
            
            if (data) {
                setCoupons(data as Coupon[]);
            }
        };
        fetchCoupons();
    }, []);

    useEffect(() => {
        if (coupons.length <= 1) return;
        const interval = setInterval(() => {
            setCurrentIndex(prev => (prev + 1) % coupons.length);
        }, 7000);
        return () => clearInterval(interval);
    }, [coupons]);

    if (coupons.length === 0) return null;

    const coupon = coupons[currentIndex];
    const minVal = coupon.min_cart_value || 0;
    const isUnlocked = subtotal >= minVal;
    const difference = minVal - subtotal;
    
    // Determine the main display text
    const rewardText = coupon.show_custom_message && coupon.display_message 
        ? coupon.display_message 
        : (coupon.discount_type === 'percentage' ? `${coupon.discount_value}% OFF` : `₹${coupon.discount_value} OFF`);

    return (
        <div 
            onClick={() => navigateTo('shop')}
            className={`cursor-pointer border-b transition-colors duration-500 ${isUnlocked ? 'bg-hav-forest text-hav-gold border-hav-gold/30' : 'bg-hav-gold text-hav-forest border-hav-forest/10'}`}
        >
            <div className="container mx-auto px-4 py-2.5">
                <AnimatePresence mode="wait">
                    <motion.div
                        key={`${coupon.id}-${isUnlocked}`}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="flex items-center justify-center gap-3 text-center"
                    >
                        {isUnlocked ? (
                            <>
                                <span className="bg-hav-gold text-hav-forest text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-widest animate-pulse">Unlocked</span>
                                <span className="text-sm font-bold tracking-tight">
                                    Code <span className="underline decoration-2 underline-offset-4 font-black">{coupon.code}</span> is active! {rewardText}.
                                </span>
                            </>
                        ) : (
                            <>
                                {coupon.show_progress_bar ? (
                                    <div className="flex items-center gap-2">
                                        <span className="text-sm font-black italic">
                                            Add ₹{(difference || 0).toFixed(0)} more
                                        </span>
                                        <span className="text-sm font-medium">
                                            to unlock <strong className="font-black">{rewardText}</strong> with code <strong className="font-black">{coupon.code}</strong>
                                        </span>
                                    </div>
                                ) : (
                                    <span className="text-sm font-bold tracking-tight">
                                        Save <span className="text-hav-forest font-black">{rewardText}</span> on orders over ₹{minVal} with code <span className="font-black">{coupon.code}</span>
                                    </span>
                                )}
                            </>
                        )}
                        <span className="hidden md:inline-block text-[10px] uppercase font-black opacity-60 ml-2">Shop Now →</span>
                    </motion.div>
                </AnimatePresence>
            </div>
        </div>
    );
};

export default StickyCouponBanner;
