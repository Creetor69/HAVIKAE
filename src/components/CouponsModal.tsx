
import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import { Coupon, Order, Product, Category, StoreSettings, CartItem } from '../types';
import { motion, AnimatePresence } from 'framer-motion';
import XIcon from './icons/XIcon';

interface CouponsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (coupon: Coupon) => void;
  user: { id: string };
  subtotal: number;
  products: Product[];
  categories: Category[];
  storeSettings: StoreSettings | null;
  cart: CartItem[];
}

const CouponCard: React.FC<{ 
    coupon: Coupon; 
    subtotal: number; 
    onApply: (coupon: Coupon) => void; 
    isEligible: boolean;
    eligibilityMessage: string;
    offerText: string;
}> = ({ coupon, subtotal, onApply, isEligible, eligibilityMessage, offerText }) => {
    const minVal = coupon.min_cart_value || 0;
    const isCartValueMet = !minVal || subtotal >= minVal;
    const difference = minVal - subtotal;
    const progress = isCartValueMet ? 100 : (subtotal / minVal) * 100;
    const canApply = isEligible && isCartValueMet;

    return (
        <div className={`p-6 rounded-3xl border-2 transition-all duration-300 ${canApply ? 'bg-green-50 border-green-200 shadow-lg' : 'bg-white border-gray-100 shadow-sm opacity-90'}`}>
            <div className="flex justify-between items-start gap-4">
                <div className="flex-grow">
                    <div className="flex items-center gap-3">
                        <span className={`font-mono font-black text-2xl ${canApply ? 'text-hav-forest' : 'text-gray-400'}`}>{coupon.code}</span>
                        {coupon.is_sponsored && <span className="bg-hav-gold text-hav-forest px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">Exclusive</span>}
                    </div>
                    <p className={`text-base font-bold mt-2 ${canApply ? 'text-hav-olive' : 'text-gray-500'}`}>{offerText}</p>
                </div>
                {canApply && (
                    <button 
                        onClick={() => onApply(coupon)} 
                        className="bg-hav-forest text-hav-gold px-8 py-3 rounded-full text-xs font-black uppercase tracking-widest hover:brightness-110 active:scale-95 shadow-xl transition-all"
                    >
                        Apply
                    </button>
                )}
            </div>
             {!isCartValueMet ? (
                <div className="mt-5 pt-5 border-t border-dashed border-gray-200">
                    <p className="text-[11px] text-hav-forest font-black uppercase tracking-widest mb-2 flex justify-between">
                        <span>Add ₹{(difference || 0).toFixed(0)} more to unlock</span>
                        <span>{(progress || 0).toFixed(0)}%</span>
                    </p>
                    <div className="w-full bg-gray-100 rounded-full h-3 border border-gray-200 overflow-hidden">
                         <motion.div initial={{ width: 0 }} animate={{ width: `${progress}%` }} className="h-full bg-hav-gold shadow-sm" />
                    </div>
                </div>
            ) : !isEligible && (
                <div className="mt-4 p-3 bg-red-50 rounded-xl border border-red-100 text-center text-red-600 text-xs font-black uppercase tracking-tighter">
                    {eligibilityMessage}
                </div>
            )}
        </div>
    );
};

const CouponsModal: React.FC<CouponsModalProps> = ({ isOpen, onClose, onApply, user, subtotal, products, categories, storeSettings, cart }) => {
    const [coupons, setCoupons] = useState<Coupon[]>([]);
    const [userOrders, setUserOrders] = useState<Order[]>([]);
    const [manualCode, setManualCode] = useState('');
    const [error, setError] = useState('');

    useEffect(() => {
        if (!isOpen) return;
        const fetchData = async () => {
            const { data: c } = await supabase!.from('coupons').select('*').eq('is_active', true).order('min_cart_value', { ascending: true });
            if (c) setCoupons(c as Coupon[]);
            const { data: o } = await supabase!.from('orders').select('id, total, status').eq('user_id', user.id).eq('status', 'Delivered');
            if (o) setUserOrders(o as Order[]);
        };
        fetchData();
    }, [user.id, isOpen]);

    const checkEligibility = (coupon: Coupon): { isEligible: boolean, message: string } => {
        if (coupon.min_cart_value && subtotal < coupon.min_cart_value) return { isEligible: false, message: `Min. cart value ₹${coupon.min_cart_value} required.` };
        if (coupon.usage_limit && coupon.times_used >= coupon.usage_limit) return { isEligible: false, message: "Usage limit reached." };
        if (coupon.applicable_for_new_customers && userOrders.length > 0) return { isEligible: false, message: "For new customers only." };
        if (coupon.min_order_count > 0) {
            let valid = userOrders;
            if(coupon.min_order_value_for_history) valid = userOrders.filter(o => o.total >= (coupon.min_order_value_for_history || 0));
            if (valid.length < coupon.min_order_count) return { isEligible: false, message: `Requires ${coupon.min_order_count} previous orders.` };
        }
        if (coupon.discount_type === 'buy_x_get_y') {
            const buyCount = cart.reduce((count, item) => {
                const p = products.find(prod => prod.id === item.productId);
                if (p && (coupon.buy_x_category_ids.includes(p.category_id || '') || coupon.buy_x_product_ids.includes(p.id))) return count + item.quantity;
                return count;
            }, 0);
            if (buyCount < (coupon.buy_x_quantity || 1)) return { isEligible: false, message: `Add ${coupon.buy_x_quantity || 1} qualifying items.` };
            if (!cart.some(item => coupon.get_y_variant_ids.includes(item.variantId))) return { isEligible: false, message: "Add the freebie item to cart." };
        }
        return { isEligible: true, message: '' };
    };

    const getOfferText = (c: Coupon): string => {
        if (c.display_message) return c.display_message;
        const mv = c.min_cart_value ? ` on orders above ₹${c.min_cart_value}` : '';
        if (c.discount_type === 'percentage') return `${c.discount_value}% OFF${mv}`;
        if (c.discount_type === 'fixed') return `₹${c.discount_value} OFF${mv}`;
        if (c.discount_type === 'buy_x_get_y') return `Buy ${c.buy_x_quantity}, Get ${c.get_y_quantity} Free`;
        return 'Special Offer';
    };

    const { available, locked } = useMemo(() => {
        const a: any[] = [], l: any[] = [];
        coupons.forEach(c => {
            const eli = checkEligibility(c);
            const met = !c.min_cart_value || subtotal >= c.min_cart_value;
            if (met) a.push({ coupon: c, eligibility: eli });
            else l.push({ coupon: c, eligibility: eli });
        });
        return { available: a, locked: l.slice(0, 3) };
    }, [coupons, subtotal, userOrders, cart]);
    
    return (
    <AnimatePresence>
      {isOpen && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-hav-forest/80 backdrop-blur-md z-[100] flex items-center justify-center p-4" onClick={onClose}>
          <motion.div initial={{ scale: 0.9, opacity: 0, y: 50 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.9, opacity: 0, y: 50 }} className="bg-hav-cream rounded-[3rem] shadow-2xl w-full max-w-2xl h-[85vh] flex flex-col overflow-hidden border border-hav-gold/30" onClick={e => e.stopPropagation()}>
            <div className="flex justify-between items-center px-10 py-8 border-b border-hav-gold/10 bg-white">
                <div><h3 className="text-3xl font-serif font-black text-hav-forest">Havikar Offers</h3><p className="text-[10px] font-black uppercase tracking-[0.3em] text-hav-gold mt-1">Unlock authentic savings</p></div>
                <button onClick={onClose} className="p-3 rounded-full hover:bg-hav-cream transition-colors"><XIcon className="w-8 h-8"/></button>
            </div>
            <div className="flex-grow overflow-y-auto px-10 py-10 space-y-12 custom-scrollbar">
                {available.length > 0 && (
                    <div>
                        <h4 className="font-black text-[11px] uppercase tracking-[0.4em] text-green-700 mb-6 flex items-center gap-4"><span>Unlocked</span><div className="flex-grow h-px bg-green-100"/></h4>
                        <div className="space-y-4">{available.map(({coupon, eligibility}) => <CouponCard key={coupon.id} coupon={coupon} subtotal={subtotal} onApply={onApply} isEligible={eligibility.isEligible} eligibilityMessage={eligibility.message} offerText={getOfferText(coupon)} />)}</div>
                    </div>
                )}
                {locked.length > 0 && (
                    <div>
                        <h4 className="font-black text-[11px] uppercase tracking-[0.4em] text-hav-gold mb-6 flex items-center gap-4"><span>Coming Up Next</span><div className="flex-grow h-px bg-hav-gold/20"/></h4>
                        <div className="space-y-4">{locked.map(({coupon, eligibility}) => <CouponCard key={coupon.id} coupon={coupon} subtotal={subtotal} onApply={onApply} isEligible={eligibility.isEligible} eligibilityMessage={eligibility.message} offerText={getOfferText(coupon)} />)}</div>
                    </div>
                )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
    );
};

export default CouponsModal;
