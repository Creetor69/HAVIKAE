import React, { useState, useEffect, useMemo } from 'react';
import { supabase } from '../supabaseClient';
import type { CartItem, Coupon, StoreSettings, Product, Page, PageContext, ProductVariant, User } from '../types';
import { 
  Trash2, 
  Tag, 
  ChevronRight, 
  Sparkles, 
  Clock, 
  Gift, 
  ArrowRight, 
  CheckCircle, 
  Lock, 
  Unlock, 
  ShoppingBag,
  Plus,
  Minus
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface CartPageProps {
  cart: CartItem[];
  navigateTo: (page: Page, context?: PageContext) => void;
  updateCartQuantity: (variantId: string, qty: number) => void;
  removeFromCart: (variantId: string) => void;
  addToCart: (product: Product, variant: ProductVariant, quantity?: number) => Promise<void>;
  storeSettings?: StoreSettings;
  products: Product[];
  user?: User | null;
}

export const CartPage: React.FC<CartPageProps> = ({ 
  cart, 
  navigateTo, 
  updateCartQuantity, 
  removeFromCart, 
  addToCart,
  storeSettings,
  products,
  user
}) => {
  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [copySuccess, setCopySuccess] = useState<string | null>(null);
  const [selectedPromoCode, setSelectedPromoCode] = useState<string | null>(null);
  const [showAllCoupons, setShowAllCoupons] = useState<boolean>(false);
  const [timeLeft, setTimeLeft] = useState({ hours: 4, minutes: 32, seconds: 15 });

  const [walletPointsToApply, setWalletPointsToApply] = useState<number>(() => {
    const preApplied = sessionStorage.getItem('preAppliedWalletPoints');
    return preApplied ? (parseInt(preApplied, 10) || 0) : 0;
  });

  const maxApplicablePoints = useMemo(() => {
    return user ? Math.min(user.reward_points || 0, Math.floor(subtotal)) : 0;
  }, [user, subtotal]);

  // Adjust and validate preApplied points on change or when subtotal changes
  useEffect(() => {
    if (user && user.reward_points) {
      if (walletPointsToApply > maxApplicablePoints) {
        setWalletPointsToApply(maxApplicablePoints);
      }
    } else {
      setWalletPointsToApply(0);
    }
  }, [user, maxApplicablePoints]);

  // Sync to session storage
  useEffect(() => {
    if (walletPointsToApply > 0) {
      sessionStorage.setItem('preAppliedWalletPoints', walletPointsToApply.toString());
    } else {
      sessionStorage.removeItem('preAppliedWalletPoints');
    }
  }, [walletPointsToApply]);

  // Load and inject checkout coupon lists including custom exit-recovery codes
  useEffect(() => {
    const fetchActiveCoupons = async () => {
      try {
        const { data: fetchRes } = await supabase
          .from('coupons')
          .select('*')
          .eq('is_active', true)
          .order('min_cart_value', { ascending: true });

        // Include exit intent deal in listings so users see it
        const exitIntentCoupon = {
          id: 'exit-intent-steal-100',
          created_at: new Date().toISOString(),
          code: 'STEAL100',
          discount_type: 'fixed',
          discount_value: 100,
          max_discount_amount: 100,
          min_cart_value: 999,
          is_active: true,
          usage_limit: null,
          times_used: 0,
          applicable_for_new_customers: false,
          min_order_count: 0,
          is_sponsored: true,
          display_message: '🎯 Exit-Recovery Special: Extra Flat ₹100 Off!',
          show_in_banner: true,
          show_progress_bar: true,
          show_custom_message: true,
          buy_x_category_ids: [],
          buy_x_product_ids: [],
          buy_x_quantity: null,
          get_y_variant_ids: [],
          get_y_quantity: null,
          banner_text: 'STEAL100'
        } as any as Coupon;

        const list = fetchRes ? [...fetchRes, exitIntentCoupon] : [exitIntentCoupon];
        
        // Remove duplicates if STEAL100 is already in DB
        const uniqueList = list.filter((v, i, a) => a.findIndex(t => t.code === v.code) === i);
        setCoupons(uniqueList);
      } catch (err) {
        console.error("Failed to fetch coupons on Cart screen:", err);
      }
    };
    fetchActiveCoupons();

    // Check pre-selected code
    const existingCode = sessionStorage.getItem('preAppliedCouponCode');
    if (existingCode) {
      setSelectedPromoCode(existingCode);
    }
  }, []);

  // Shipping dynamic count-down timer
  useEffect(() => {
    const calculateTimeLeft = () => {
      const now = new Date();
      const cutoff = new Date();
      cutoff.setHours(17, 0, 0, 0); // cut-off is 5:00 PM for dispatch tomorrow morning
      
      if (now > cutoff) {
        cutoff.setDate(cutoff.getDate() + 1);
      }
      
      const diff = cutoff.getTime() - now.getTime();
      return {
        hours: Math.floor(diff / (1000 * 60 * 60)),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      };
    };

    setTimeLeft(calculateTimeLeft());
    const interval = setInterval(() => {
      setTimeLeft(calculateTimeLeft());
    }, 1000);

    return () => clearInterval(interval);
  }, []);

  // Filter related items that are not in the cart yet
  const upsellProducts = useMemo(() => {
    const cartVariantIds = new Set(cart.map(c => c.variantId));
    
    let available = products.filter(p => 
      p.is_active && 
      p.product_variants.some(v => v.stock_quantity > 0 && !cartVariantIds.has(v.id))
    );
    
    // Sort by price ascending to show cheaper add-ons first
    available.sort((a, b) => {
       const minPriceA = Math.min(...a.product_variants.map(v => v.price));
       const minPriceB = Math.min(...b.product_variants.map(v => v.price));
       return minPriceA - minPriceB;
    });

    return available.slice(0, 3);
  }, [products, cart]);

  // Handle auto coupon applying with celebration
  const applyCouponCode = (code: string) => {
    sessionStorage.setItem('preAppliedCouponCode', code);
    setSelectedPromoCode(code);
    setCopySuccess(`Applied "${code}"! Discount will show up at checkout.`);
    
    // Play sound or fire confetti
    confetti({
      particleCount: 80,
      spread: 60,
      origin: { y: 0.8 },
      colors: ['#0F4A3C', '#F48E2F', '#D1A153']
    });

    setTimeout(() => {
      setCopySuccess(null);
    }, 3000);
  };

  const removeCouponCode = () => {
    sessionStorage.removeItem('preAppliedCouponCode');
    setSelectedPromoCode(null);
  };

  // Milestones Calculation
  const freeShippingThreshold = storeSettings?.free_shipping_threshold ?? 799;
  const isFreeShippingUnlocked = subtotal >= freeShippingThreshold;
  const shippingRemaining = freeShippingThreshold - subtotal;
  const shippingPercent = Math.min((subtotal / freeShippingThreshold) * 100, 100);

  // Next Milestone coupon checker
  const nextMilestoneCoupon = useMemo(() => {
    const locked = coupons.filter(c => c.show_progress_bar === true && c.min_cart_value && c.min_cart_value > subtotal);
    if (locked.length === 0) return null;
    return locked[0]; // Nearest upcoming coupon
  }, [coupons, subtotal]);

  if (cart.length === 0) {
    return (
      <div className="min-h-[75vh] bg-hav-cream/30 flex flex-col items-center justify-center text-center p-8">
        <div className="w-20 h-20 bg-hav-gold/10 rounded-full flex items-center justify-center mb-6">
          <ShoppingBag className="w-10 h-10 text-hav-orange-600" />
        </div>
        <h1 className="text-3xl font-serif font-bold text-hav-forest">Your Cart is Empty</h1>
        <p className="text-sm text-hav-olive max-w-sm mt-2 leading-relaxed">
          Unlock vibrant, age-old recipes and pristine hand-stacked spice ratios by filling your basket with heritage goodness!
        </p>
        <button 
          onClick={() => navigateTo('shop')}
          className="mt-8 bg-[#0F4A3C] hover:bg-[#135948] text-hav-gold font-bold py-3 px-10 rounded-full text-xs uppercase tracking-wider transition-all duration-300 shadow-md cursor-pointer"
        >
          Begin Exploring
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-linear-to-b from-hav-cream/20 to-white py-10 px-4 sm:px-6 lg:px-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Page Title Header */}
        <div className="mb-8 text-center sm:text-left">
          <h1 className="text-3xl font-serif font-black text-hav-forest flex items-center justify-center sm:justify-start gap-2">
            <span>🛒 Your Heritage Bag</span>
            <span className="text-xs font-bold bg-[#0F4A3C]/10 text-[#0F4A3C] px-3 py-1 rounded-full font-sans uppercase tracking-widest self-center">
              {cart.length} Unique Flavors
            </span>
          </h1>
          <p className="text-xs text-hav-olive mt-1.5 font-medium">Verify your handpicked selection and claim dynamic coupon bundles before checkout.</p>
        </div>

        {/* Info alerts */}
        {copySuccess && (
          <div className="mb-6 p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-bounce shadow-xs">
            <Sparkles className="w-4 h-4 text-emerald-600 animate-pulse" />
            <span>{copySuccess}</span>
          </div>
        )}

        {/* ⭐ Premium & Sleek Full-Width Perk Tracker Banner - Styled with gold/yellow progress tracking on deep green background */}
        <div className="bg-[#0F4A3C] text-white rounded-3xl p-4 sm:p-5 mb-6 shadow-xs border border-[#0f4a3c]/30 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden text-xs font-sans w-full">
          {/* Left: Tracker label and gold/yellow progress bar */}
          <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
            <span className="text-[11px] font-sans font-black uppercase tracking-wider text-[#C9A236] whitespace-nowrap flex items-center gap-1.5 shrink-0">
              ⭐ Heritage Perks Tracker:
            </span>
            <div className="flex-1 flex items-center gap-2.5 min-w-[200px]">
              <div className="flex-1 bg-white/10 h-2 rounded-full overflow-hidden relative shadow-inner">
                {/* Yellow completed tracking indicator */}
                <div 
                  className="h-full rounded-full bg-[#C9A236] transition-all duration-700 ease-out shadow-xs"
                  style={{ width: `${shippingPercent}%` }}
                />
              </div>
              <span className="font-mono text-[10px] font-black text-[#C9A236] shrink-0">{Math.round(shippingPercent)}%</span>
            </div>
          </div>

          {/* Right: Milestone status badge */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-hav-cream/95 min-w-0">
            {isFreeShippingUnlocked ? (
              <span className="text-emerald-300 font-extrabold uppercase tracking-wide flex items-center gap-1 shrink-0">
                🏆 FREE SHIPPING ACTIVE
              </span>
            ) : (
              <span className="whitespace-nowrap">
                Add <strong className="text-[#C9A236]">₹{shippingRemaining.toFixed(0)}</strong> for Free Delivery
              </span>
            )}
            {nextMilestoneCoupon && (
              <span className="pl-4 sm:border-l border-white/20 text-white font-sans shrink-0">
                🎯 Add <strong className="text-[#C9A236] font-mono">₹{(nextMilestoneCoupon.min_cart_value! - subtotal).toFixed(0)} more</strong> to unlock <span className="font-black text-[#C9A236] bg-white/10 px-2 py-0.5 rounded border border-white/10">"{nextMilestoneCoupon.code}"</span>
              </span>
            )}
          </div>
        </div>

        {/* 📦 Amazon-Inspired Premium Compact Checkout Panel - EXACTLY ONE CTA at the top of Cart Page */}
        <div id="amazon-checkout-compact-card" className="bg-white rounded-3xl p-4 sm:p-5 mb-6 border border-orange-200/40 shadow-xs flex flex-col gap-4 overflow-hidden font-sans">
          
          {/* Top Row: 5% Cashback Highlight & Coupon Notice - Active in TOP ONLY */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-sans">
            {/* Left Box: 5% Cashback Highlight */}
            <div className="bg-emerald-50/60 rounded-2xl p-3 border border-emerald-100 flex items-start gap-2.5">
              <span className="text-lg select-none shrink-0 font-sans">🎉</span>
              <div className="space-y-0.5">
                <p className="font-extrabold text-[#0F4A3C] text-[11px] sm:text-xs font-sans">
                  Get 5% Cashback on All Orders!
                </p>
                <p className="text-[10px] text-emerald-800 font-bold leading-normal font-sans">
                  You earn <span className="text-[#F48E2F] font-mono font-black text-xs">₹{(subtotal * 0.05).toFixed(2)}</span> cashback reward points on this order.
                </p>
                <p className="text-[9px] text-gray-400 font-medium italic font-sans animate-fade-in">
                  * 5% cashback calculated on items subtotal (₹{subtotal.toFixed(0)}). Delivery/shipping charges excluded.
                </p>
              </div>
            </div>

            {/* Right Box: Coupons Info */}
            <div className="bg-[#FAF2D5]/70 rounded-2xl p-3 border border-orange-200/40 flex items-start gap-2.5 font-sans">
              <span className="text-lg select-none shrink-0 font-sans">🏷️</span>
              <div className="space-y-0.5">
                <p className="font-extrabold text-[#0F4A3C] text-[11px] sm:text-xs font-sans">
                  Coupons Active on Checkout
                </p>
                <p className="text-[9.5px] text-[#0F4A3C]/90 font-medium leading-relaxed font-sans">
                  Choose from all eligible promotional vouchers and secure maximum cashback rates directly during checkout! Try adding qualifying milestones to claim.
                </p>
              </div>
            </div>
          </div>

          {/* Bottom Row: Subtotal and CTAs */}
          <div className="border-t border-[#0F4A3C]/10 pt-3.5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="space-y-1">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-gray-500 font-bold text-xs sm:text-sm">Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span className="text-xl sm:text-2xl font-black text-[#0F4A3C] font-mono">
                  ₹{Math.max(0, subtotal + (isFreeShippingUnlocked ? 0 : (storeSettings?.shipping_rate ?? 50)) - walletPointsToApply).toFixed(0)}
                </span>
                <button 
                  onClick={() => {
                    const el = document.getElementById('cart-order-summary-card');
                    if (el) {
                      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                      el.classList.add('ring-4', 'ring-[#C9A236]', 'ring-offset-2', 'scale-[1.02]');
                      setTimeout(() => {
                        el.classList.remove('ring-4', 'ring-[#C9A236]', 'ring-offset-2', 'scale-[1.02]');
                      }, 1500);
                    }
                  }}
                  className="text-[10px] sm:text-xs text-[#F48E2F] hover:text-[#eb8324] font-black underline ml-2 transition-all cursor-pointer hover:scale-105 active:scale-95"
                  title="View details breakdown"
                >
                  View Details
                </button>
              </div>
              {/* Delivery/Shipping Status message */}
              <div className="text-[10.5px] font-bold text-emerald-800 flex items-center gap-1 bg-emerald-50/50 px-2 py-1 rounded w-fit leading-none">
                {isFreeShippingUnlocked ? (
                  <span>✓ Your order qualifies for <strong>FREE Delivery!</strong></span>
                ) : (
                  <span>Standard delivery applies. Add <strong className="text-hav-orange-600">₹{shippingRemaining.toFixed(0)} more</strong> for Free Delivery</span>
                )}
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full md:w-auto shrink-0">
              {/* Amazon-style High Contrast Yellow/Orange CTA */}
              <button 
                onClick={() => navigateTo('checkout')}
                className="bg-[#F48E2F] hover:bg-[#eb8324] text-white font-black py-3 px-6 rounded-xl uppercase tracking-wider text-[11px] shadow-sm transform active:scale-98 transition-all flex items-center justify-center gap-1.5 cursor-pointer animate-pulse shrink-0"
              >
                <span>Proceed to Buy</span>
                <ArrowRight className="w-4 h-4" />
              </button>
              <button 
                onClick={() => navigateTo('shop')}
                className="text-center text-hav-olive hover:text-[#0F4A3C] font-extrabold text-[10px] uppercase tracking-wider py-1.5 hover:underline whitespace-nowrap"
              >
                ← Continue Shopping
              </button>
            </div>
          </div>

        </div>

        {/* Grid Area */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Main List Element Column */}
          <div className="lg:col-span-7 space-y-4">
            
            {/* Products container */}
            <div className="bg-white rounded-3xl p-4 sm:p-6 border border-hav-gold/10 shadow-xs divide-y divide-gray-150">
              {cart.map(item => {
                const isGift = item.variantId === 'free-surprise-gift-variant';
                const canIncrease = item.quantity < item.stock_quantity;
                
                return (
                  <div key={item.variantId} className="py-3 sm:py-4 first:pt-0 last:pb-0 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-4">
                    
                    {/* Visual and title group */}
                    <div className="flex items-start gap-3 sm:gap-4 w-full sm:w-auto">
                      <div className="relative shrink-0">
                        <img 
                          src={item.imageUrl} 
                          alt={item.name} 
                          className="w-14 h-14 sm:w-20 sm:h-20 object-contain rounded-xl bg-hav-cream/30 p-1 border border-hav-gold/10 mix-blend-multiply"
                        />
                        {isGift && (
                          <span className="absolute -top-1.5 -right-1.5 bg-hav-orange-500 text-white text-[8px] uppercase tracking-wider px-1.5 py-0.5 rounded-full font-black animate-pulse">
                            Gift
                          </span>
                        )}
                      </div>
                      
                      <div className="space-y-0.5 flex-1 min-w-0">
                        <h3 className="font-extrabold text-hav-forest text-xs sm:text-sm leading-snug hover:text-hav-orange-600 transition-colors truncate">
                          {item.name}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-hav-olive flex items-center gap-1.5">
                          <span>{item.net_weight}</span>
                          <span>•</span>
                          <span className="font-semibold text-[#0F4A3C]">₹{(item.price ?? 0).toFixed(2)}</span>
                          {item.mrp && item.mrp > item.price && (
                            <span className="line-through text-gray-400 text-[10px]">₹{item.mrp}</span>
                          )}
                        </p>
                        
                        {!isGift && (
                          <div className="pt-1">
                            {item.stock_quantity > 0 && item.stock_quantity <= 15 ? (
                              <span className="text-[9px] sm:text-[10px] text-[#A24419] font-black bg-orange-50 px-1.5 py-0.5 rounded border border-orange-100">
                                ⌛ Only {item.stock_quantity} left
                              </span>
                            ) : (
                              <span className="text-[9px] sm:text-[10px] text-emerald-800 font-bold bg-emerald-50/70 px-1.5 py-0.5 rounded">
                                ✓ Packed using local heirloom ingredients
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Quantity controls and calculations */}
                    <div className="flex items-center justify-between sm:justify-end gap-3.5 w-full sm:w-auto pt-1 sm:pt-0 border-t border-dashed border-gray-100 sm:border-0">
                      {!isGift ? (
                        <div className="flex items-center bg-gray-50 border border-gray-200 rounded-lg overflow-hidden shadow-3xs">
                          <button 
                            onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)}
                            className="p-1 px-2 text-hav-forest hover:bg-hav-cream hover:text-[#0F4A3C] font-black transition-colors"
                            aria-label="Lower volume"
                          >
                            <Minus className="w-2.5 h-2.5" />
                          </button>
                          <span className="px-2 text-xs font-black text-hav-forest font-mono">
                            {item.quantity}
                          </span>
                          <button 
                            onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)}
                            disabled={!canIncrease}
                            className="p-1 px-2 text-hav-forest hover:bg-hav-cream hover:text-[#0F4A3C] font-black transition-colors disabled:opacity-30 disabled:hover:bg-transparent"
                            aria-label="Raise volume"
                          >
                            <Plus className="w-2.5 h-2.5" />
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] text-hav-orange-600 font-bold italic">
                          Comped Gift
                        </span>
                      )}

                      <div className="text-right flex sm:flex-col items-center sm:items-end justify-between sm:justify-center gap-2 sm:gap-0 font-sans">
                        <p className="font-extrabold text-hav-forest text-xs sm:text-sm">
                          {isGift ? 'FREE' : `₹${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(0)}`}
                        </p>
                        {!isGift && (
                          <button 
                            onClick={() => removeFromCart(item.variantId)}
                            className="text-gray-400 hover:text-red-600 transition-colors cursor-pointer p-0.5"
                            title="Remove unique recipe"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        )}
                      </div>
                    </div>

                  </div>
                );
              })}
            </div>

            {/* Quick Upsell Section: "Conversion bump" */}
            <div className="bg-linear-to-br from-[#0F4A3C]/5 to-hav-cream/10 rounded-3xl p-6 border border-[#0F4A3C]/10">
              <h4 className="text-xs font-sans uppercase font-black tracking-widest text-[#0F4A3C] mb-3.5 flex items-center gap-1.5">
                <span>✨ Traditional Small Batch Add-ons (Bump order value)</span>
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {upsellProducts.map(p => {
                  const firstVariant = p.product_variants[0];
                  return (
                    <div key={p.id} className="bg-white rounded-2xl p-4 border border-hav-gold/5 flex flex-col justify-between shadow-xs hover:border-hav-[#0F4A3C]/20 transition-all group">
                      <div>
                        <img 
                          src={p.image_urls[0]} 
                          alt={p.name} 
                          className="w-14 h-14 object-contain mx-auto mix-blend-multiply group-hover:scale-105 transition-transform" 
                        />
                        <p className="font-bold text-xs text-hav-forest text-center mt-2 truncate line-clamp-1 h-4">{p.name}</p>
                        <p className="text-[10px] text-gray-500 text-center">{firstVariant?.net_weight}</p>
                      </div>
                      <div className="mt-3">
                        <p className="text-xs text-center text-[#0F4A3C] font-black">₹{firstVariant?.price}</p>
                        <button 
                          onClick={() => {
                            addToCart(p, firstVariant, 1);
                            // Add animation
                            confetti({
                              particleCount: 20,
                              spread: 30,
                              origin: { y: 0.8 },
                              colors: ['#0F4A3C']
                            });
                          }}
                          className="w-full mt-2 bg-[#0F4A3C] hover:bg-[#135948] text-white text-[9px] font-bold py-1.5 rounded-lg uppercase tracking-wider transition-all duration-300 cursor-pointer"
                        >
                          + Add for ₹{firstVariant?.price}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

          </div>

          {/* Right Column: Calculations, Milestones, Active Coupons */}
          <div className="lg:col-span-5 space-y-4">

            {/* Calculations & Checkout Button (Order Summary First) */}
            <div 
              id="cart-order-summary-card" 
              className="bg-[#0F4A3C] text-white rounded-2xl p-5 shadow-lg space-y-3.5 relative overflow-hidden transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full filter blur-xl transform translate-x-10 -translate-y-10 pointer-events-none" />
              
              <div className="flex justify-between items-center border-b border-white/10 pb-2">
                <h3 className="text-xs font-sans uppercase font-black text-hav-gold tracking-widest">Order Summary</h3>
                <span className="text-[10px] uppercase bg-white/10 text-hav-cream py-0.5 px-2 rounded-full font-mono font-bold">Secure checkout</span>
              </div>

              {/* Prices breakdown */}
              <div className="space-y-2 border-b border-white/10 pb-3 text-xs font-sans">
                <div className="flex justify-between items-center text-hav-cream">
                  <span>Bag Subtotal</span>
                  <span className="font-bold font-mono">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-hav-cream">
                  <span>Delivery Charge</span>
                  <span className="font-bold">{isFreeShippingUnlocked ? 'FREE' : `₹${storeSettings?.shipping_rate ?? 50}`}</span>
                </div>
                
                {walletPointsToApply > 0 && (
                  <div className="flex justify-between items-center text-[#F48E2F] font-bold">
                    <span className="flex items-center gap-1 font-sans">🪙 Wallet Balance Applied</span>
                    <span className="font-mono">-₹{walletPointsToApply.toFixed(2)}</span>
                  </div>
                )}
                
                {selectedPromoCode && (
                  <div className="flex justify-between items-center text-[#F48E2F] font-bold">
                    <span className="flex items-center gap-1">🏷️ Pre-Applied Voucher ({selectedPromoCode})</span>
                    <span className="text-[10px] uppercase bg-[#F48E2F]/10 px-1.5 py-0.5 rounded">Applied</span>
                  </div>
                )}
              </div>

              {/* Total display */}
              <div className="flex justify-between items-center font-serif text-lg font-bold pb-2">
                <span className="text-hav-gold">Estimated Total</span>
                <span className="text-2xl text-white font-sans font-black font-mono">
                  ₹{Math.max(0, subtotal + (isFreeShippingUnlocked ? 0 : (storeSettings?.shipping_rate ?? 50)) - walletPointsToApply).toFixed(2)}
                </span>
              </div>

              <button 
                onClick={() => navigateTo('shop')}
                className="w-full text-center text-hav-cream/70 hover:text-white font-bold text-[9px] uppercase tracking-wide block pt-0.5 hover:underline"
              >
                ← Back to Pantry Shop
              </button>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default CartPage;
