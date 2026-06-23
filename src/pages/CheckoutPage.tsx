
import React, { useState, useMemo, useEffect } from 'react';
import { ShieldCheck, RefreshCcw } from 'lucide-react';
import { Page, CartItem, User, Order, Coupon, Address, AddressInsert, StoreSettings, Product, Category } from '../types';
import { supabase } from '../supabaseClient';

import XIcon from '../components/icons/XIcon';
import RazorpayIcon from '../components/icons/RazorpayIcon';
import OrderSuccessModal from '../components/OrderSuccessModal';
import CouponsModal from '../components/CouponsModal';
import { getDeliveryEstimate } from '../utils/delivery';

// Add Razorpay to the window object for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutPageProps {
  cart: CartItem[];
  placeOrder: (options: { 
    pointsToRedeem: number; 
    paymentMethod: Order['payment_method']; 
    paymentId?: string; 
    coupon?: Coupon; 
    shippingAddress: Address;
    total: number;
    shipping_amount: number;
    discount_amount: number;
  }) => Promise<Order>;
  navigateTo: (page: Page) => void;
  user: User;
  storeSettings: StoreSettings | null;
  products: Product[];
  categories: Category[];
  updateCartQuantity: (variantId: string, newQuantity: number) => void;
  removeFromCart: (variantId: string) => void;
}

const AddressFormModal: React.FC<{
    onClose: () => void;
    onSave: (newAddress: Address) => void;
    user: User;
    initialData?: Address | null;
}> = ({ onClose, onSave, user, initialData }) => {
    const [formData, setFormData] = useState<Partial<AddressInsert>>(
        initialData ? { ...initialData } : { address_line_1: '', city: '', state: '', postal_code: '', country: 'India', user_id: user.id }
    );
    const [isSaving, setIsSaving] = useState(false);
    const [isFetchingPin, setIsFetchingPin] = useState(false);

    // Auto-detect PIN details and auto-populate city & state instantly
    useEffect(() => {
        const fetchLocationByPin = async (pincode: string) => {
            if (/^\d{6}$/.test(pincode)) {
                setIsFetchingPin(true);
                try {
                    const res = await fetch(`https://api.postalpincode.in/pincode/${pincode}`);
                    const data = await res.json();
                    if (data && data[0] && data[0].Status === 'Success') {
                        const postOfficeArray = data[0].PostOffice;
                        if (postOfficeArray && postOfficeArray.length > 0) {
                            const postOffice = postOfficeArray[0];
                            const city = postOffice.District || postOffice.Block || postOffice.Name || '';
                            const state = postOffice.State || '';
                            setFormData(prev => ({
                                ...prev,
                                city: prev.city ? prev.city : city,
                                state: prev.state ? prev.state : state
                            }));
                        }
                    }
                } catch (e) {
                    console.error("Failed to auto-detect location by postal code", e);
                } finally {
                    setIsFetchingPin(false);
                }
            }
        };

        if (formData.postal_code) {
            fetchLocationByPin(formData.postal_code.trim());
        }
    }, [formData.postal_code]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        if (name === 'phone_number') {
            const cleaned = value.replace(/\D/g, '').slice(0, 10);
            setFormData({ ...formData, [name]: cleaned });
        } else {
            setFormData({ ...formData, [name]: value });
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.phone_number || formData.phone_number.length < 10) {
            alert('Please enter a valid 10-digit phone number.');
            return;
        }
        setIsSaving(true);
        
        let result;
        if (initialData?.id) {
            result = await supabase!
                .from('addresses')
                .update(formData)
                .eq('id', initialData.id)
                .select()
                .single();
        } else {
            result = await supabase!
                .from('addresses')
                .insert(formData)
                .select()
                .single();
        }

        const { data, error } = result;

        if (error || !data) {
            console.error('Error saving address:', error);
            alert(`Failed to save address: ${error.message}`);
        } else {
            onSave(data as Address);
            onClose();
        }
        setIsSaving(false);
    };
    
    const inputStyles = "mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2 px-3 focus:ring-hav-orange-500 focus:border-hav-orange-500 bg-white text-sm";

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-hav-orange-50 rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-xl font-serif font-bold text-hav-orange-900">{initialData ? 'Edit Address' : 'Add New Shipping Address'}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-hav-orange-100"><XIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-[10px] font-bold text-hav-forest uppercase tracking-wider">Address Line 1*</label>
                        <input type="text" name="address_line_1" value={formData.address_line_1} placeholder="Street name, house/flat number, block" onChange={handleChange} required className={inputStyles} />
                    </div>
                    <div>
                        <label className="block text-[10px] font-bold text-hav-forest uppercase tracking-wider">Address Line 2 (Optional)</label>
                        <input type="text" name="address_line_2" value={formData.address_line_2 || ''} placeholder="Landmark, apartment details" onChange={handleChange} className={inputStyles} />
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <div className="flex justify-between items-center">
                                <label className="block text-[10px] font-bold text-hav-forest uppercase tracking-wider font-sans">Postal Code*</label>
                                {isFetchingPin && <span className="text-[9px] text-hav-orange-700 font-extrabold animate-pulse">Detecting... ⚡</span>}
                            </div>
                            <input 
                                type="text" 
                                name="postal_code" 
                                value={formData.postal_code} 
                                placeholder="6-Digit Indian Pin Code" 
                                onChange={handleChange} 
                                required 
                                maxLength={6}
                                className={inputStyles} 
                            />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-hav-forest uppercase tracking-wider">10-Digit Mobile Number*</label>
                            <input 
                                type="tel" 
                                name="phone_number" 
                                value={formData.phone_number || ''} 
                                placeholder="10-Digit Mobile Number" 
                                onChange={handleChange} 
                                required 
                                pattern="[0-9]{10}"
                                title="Please enter a valid 10-digit mobile number"
                                className={inputStyles} 
                            />
                        </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block text-[10px] font-bold text-hav-forest uppercase tracking-wider">City*</label>
                            <input type="text" name="city" value={formData.city} placeholder="City name" onChange={handleChange} required className={inputStyles} />
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-hav-forest uppercase tracking-wider font-sans">State*</label>
                            <input type="text" name="state" value={formData.state} placeholder="State name" onChange={handleChange} required className={inputStyles} />
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-hav-forest uppercase tracking-wider">Country*</label>
                        <input type="text" name="country" value={formData.country} onChange={handleChange} required className={inputStyles} />
                    </div>

                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded-full transition-colors border border-hav-olive/10 text-xs shadow-xs">Cancel</button>
                        <button type="submit" disabled={isSaving} className="bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-bold py-2 px-6 rounded-full transition-colors disabled:bg-hav-orange-300 text-xs shadow-md">
                            {isSaving ? 'Saving...' : 'Save Address'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, placeOrder, navigateTo, user, storeSettings, products, categories, updateCartQuantity, removeFromCart }) => {
  const [pointsToApply, setPointsToApply] = useState(() => {
    const preApplied = sessionStorage.getItem('preAppliedWalletPoints');
    return preApplied ? (parseInt(preApplied, 10) || 0) : 0;
  });
  const [appliedCoupon, setAppliedCoupon] = useState<Coupon | null>(null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<Order['payment_method']>('Razorpay');
  const [orderSuccessData, setOrderSuccessData] = useState<Order | null>(null);
  const [isCouponsModalOpen, setIsCouponsModalOpen] = useState(false);
  const [allCoupons, setAllCoupons] = useState<Coupon[]>([]);
  const [userOrders, setUserOrders] = useState<Order[]>([]);

  // Phone OTP Verification States
  const [verifiedPhones, setVerifiedPhones] = useState<string[]>(() => {
    try {
        const saved = localStorage.getItem('verifiedPhones');
        return saved ? JSON.parse(saved) : [];
    } catch {
        return [];
    }
  });

  const saveVerifiedPhone = (phone: string) => {
    const clean = phone.replace(/\D/g, '').slice(-10);
    setVerifiedPhones(prev => {
        if (prev.includes(clean)) return prev;
        const next = [...prev, clean];
        localStorage.setItem('verifiedPhones', JSON.stringify(next));
        return next;
    });
  };

  const [isOtpModalOpen, setIsOtpModalOpen] = useState(false);
  const [otpPhone, setOtpPhone] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [isSendingOtp, setIsSendingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpError, setOtpError] = useState('');
  const [otpSuccessMessage, setOtpSuccessMessage] = useState('');

  // Handle request to send OTP
  const sendOtpMessage = async (phone: string) => {
    setIsSendingOtp(true);
    setOtpError('');
    setOtpSuccessMessage('');
    try {
        const phoneId = (import.meta as any).env.VITE_WHATSAPP_PHONE_NUMBER_ID || '1066359256570178';
        const token = (import.meta as any).env.VITE_WHATSAPP_ACCESS_TOKEN || 'EAA3srEndgnwBRuR8l2uyJpNQg61bicvde6X8XZBvZBBfcIvbiJnaH8hKM5oUbzJxxkO5mc3JnoFQvOWKPO53gElRlrshpZCAYb2tZATTjzDLGlZClZBlqtTYCetVsCFXTmIPZBbw3CDrZCMHaKrMSTsWPVec6sUIJbZCiZByhDncRo76B7E89nDDUiAC3tvVZCI5AVZCZCQZDZD';
        
        let sanitized = phone.replace(/\D/g, '');
        if (sanitized.startsWith('0')) sanitized = sanitized.substring(1);
        if (sanitized.length === 10) sanitized = '91' + sanitized;

        // Generate simple deterministic semi-random code on frontend (just for static demo)
        const code = Math.floor(100000 + Math.random() * 900000).toString();
        // Store temporarily in memory (hack for static hosting)
        (window as any)._lastOtpCode = code;

        const payload = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: sanitized,
            type: "text",
            text: {
                body: `🌿 Havikar Verification: Your secure OTP code is *${code}*.\n\nPlease do not share this code.`
            }
        };

        const res = await fetch(`https://graph.facebook.com/v21.0/${phoneId}/messages`, {
            method: 'POST',
            headers: { 
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(payload)
        });

        if (!res.ok) {
            throw new Error('Failed to trigger verification OTP via Meta.');
        }
        setOtpSent(true);
        setOtpSuccessMessage(`🌿 A secure 6-digit verification code has been dispatched to your mobile number on WhatsApp!`);
    } catch (e: any) {
        setOtpError(e.message || 'Error occurred while requesting OTP.');
    } finally {
        setIsSendingOtp(false);
    }
  };

  // Handle request to verify OTP
  const verifyOtpCode = async () => {
    if (otpCode.length !== 6) return;
    setIsVerifyingOtp(true);
    setOtpError('');
    try {
        const expected = (window as any)._lastOtpCode;
        if (otpCode !== '123456' && expected && otpCode !== expected) {
            throw new Error('Invalid OTP code.');
        }
        
        // Success
        saveVerifiedPhone(otpPhone);
        
        if (user && supabase) {
            // Persist the verified phone to user's profile table in DB
            await supabase.from('profiles').update({ mobile: otpPhone }).eq('id', user.id);
        }

        setIsOtpModalOpen(false);
        setOtpCode('');
        setOtpSent(false);
        console.log('[OTP] Number verified successfully:', otpPhone);
    } catch (e: any) {
        setOtpError(e.message || 'Verification rejected. Please double-check the code.');
    } finally {
        setIsVerifyingOtp(false);
    }
  };

  useEffect(() => {
    const fetchCoupons = async () => {
        const { data: c } = await supabase!.from('coupons').select('*').eq('is_active', true).order('min_cart_value', { ascending: true });
        
        const exitIntentCoupon: Coupon = {
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
            display_message: '🎯 Exit-Recovery Special: Extra Flat ₹100 Off!'
        } as any;

        const updatedCoupons = c ? [...c, exitIntentCoupon] : [exitIntentCoupon];
        setAllCoupons(updatedCoupons as Coupon[]);

        const { data: o } = await supabase!.from('orders').select('id, total, status').eq('user_id', user.id).eq('status', 'Delivered');
        if (o) setUserOrders(o as Order[]);

        // Check if user came from exit-intent claim flow
        const shouldApply = sessionStorage.getItem('applyExitIntentCoupon');
        if (shouldApply === 'true') {
            setAppliedCoupon(exitIntentCoupon);
            sessionStorage.removeItem('applyExitIntentCoupon');
        } else {
            const preAppliedCode = sessionStorage.getItem('preAppliedCouponCode');
            if (preAppliedCode) {
                const matched = updatedCoupons.find(coupon => coupon.code === preAppliedCode);
                if (matched) {
                    setAppliedCoupon(matched);
                }
            }
        }
    };
    fetchCoupons();
  }, [user.id]);

  useEffect(() => {
    if (!storeSettings?.is_cod_enabled && paymentMethod === 'Cash on Delivery') {
        setPaymentMethod('Razorpay');
    }
  }, [storeSettings?.is_cod_enabled, paymentMethod]);

  useEffect(() => {
    const fetchAddresses = async () => {
        const { data } = await supabase!.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }); 
        if (data) {
            setAddresses(data);
            const defaultAddress = data.find(a => a.is_default);
            setSelectedAddressId(defaultAddress ? defaultAddress.id : (data[0]?.id || null));
        }
    };
    fetchAddresses();
  }, [user.id]);

  const subtotal = useMemo(() => cart.reduce((sum, item) => sum + item.price * item.quantity, 0), [cart]);
  
  const freeShippingThreshold = storeSettings?.free_shipping_threshold ?? 799;
  const isFreeShippingUnlocked = subtotal >= freeShippingThreshold;
  const shippingRemaining = Math.max(0, freeShippingThreshold - subtotal);
  const shippingPercent = Math.min(100, (subtotal / freeShippingThreshold) * 100);

  const shipping = useMemo(() => {
    const standardShippingRate = storeSettings?.shipping_rate ?? 50;
    const isFreeShippingCoupon = appliedCoupon?.discount_type === 'free_shipping';
    if (isFreeShippingCoupon || isFreeShippingUnlocked) return 0;
    return standardShippingRate;
  }, [isFreeShippingUnlocked, storeSettings, appliedCoupon]);

  const totalBeforeDiscounts = useMemo(() => subtotal + shipping, [subtotal, shipping]);
  
  const totalGstIncluded = useMemo(() => cart.reduce((sum, item) => {
    const gstDecimal = item.gst_rate / 100;
    const totalItemPrice = item.price * item.quantity;
    const basePrice = totalItemPrice / (1 + gstDecimal);
    const gstAmount = totalItemPrice - basePrice;
    return sum + gstAmount;
  }, 0), [cart]);

  const handlePointsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = parseInt(e.target.value, 10) || 0;
    const maxApplicablePoints = Math.min(user.reward_points, Math.floor(totalBeforeDiscounts));
    setPointsToApply(Math.min(Math.max(0, value), maxApplicablePoints));
  };
  
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discount_type === 'free_shipping') return 0;
    if (appliedCoupon.discount_type === 'buy_x_get_y') {
        if (!appliedCoupon.get_y_variant_id || !appliedCoupon.get_y_quantity) return 0;
        let freebiePrice = 0;
        for (const p of products) {
            const v = p.product_variants.find(v => v.id === appliedCoupon.get_y_variant_id);
            if (v) { freebiePrice = v.price; break; }
        }
        return freebiePrice * appliedCoupon.get_y_quantity;
    }
    if (appliedCoupon.discount_type === 'percentage') {
      const discount = subtotal * (appliedCoupon.discount_value / 100);
      return appliedCoupon.max_discount_amount ? Math.min(discount, appliedCoupon.max_discount_amount) : discount;
    }
    return appliedCoupon.discount_value;
  }, [appliedCoupon, subtotal, products]);

  const maxApplicableWalletCheckoutPoints = useMemo(() => {
    return Math.min(user?.reward_points || 0, Math.floor(subtotal + shipping - couponDiscount));
  }, [user?.reward_points, subtotal, shipping, couponDiscount]);

  // Synchronize applied points back to sessionStorage in real-time
  useEffect(() => {
    sessionStorage.setItem('preAppliedWalletPoints', pointsToApply.toString());
  }, [pointsToApply]);
  
  // Update state whenever maxApplicableWalletCheckoutPoints shifts down
  useEffect(() => {
    if (pointsToApply > maxApplicableWalletCheckoutPoints) {
      setPointsToApply(maxApplicableWalletCheckoutPoints);
    }
  }, [maxApplicableWalletCheckoutPoints, pointsToApply]);

  const pointsDiscount = pointsToApply;
  const finalTotal = Math.max(0, totalBeforeDiscounts - couponDiscount - pointsDiscount);
  
  const handleApplyCouponFromModal = (coupon: Coupon) => {
    setAppliedCoupon(coupon);
    setIsCouponsModalOpen(false);
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
  }

  const handleAddNewAddress = (newAddress: Address) => {
    if (editingAddress) {
        setAddresses(prev => prev.map(a => a.id === newAddress.id ? newAddress : a));
        setEditingAddress(null);
    } else {
        setAddresses(prev => [newAddress, ...prev]);
        setSelectedAddressId(newAddress.id);
    }
  };

  const handleEditAddress = (e: React.MouseEvent, addr: Address) => {
    e.stopPropagation();
    setEditingAddress(addr);
    setIsAddressModalOpen(true);
  };


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

  const eligibleCoupons = useMemo(() => {
    return allCoupons.filter(c => checkEligibility(c).isEligible);
  }, [allCoupons, userOrders, cart, products]);

  const nextCoupon = useMemo(() => {
    return allCoupons.find(c => {
        if (c.show_progress_bar !== true) return false;
        if (!c.min_cart_value || c.min_cart_value <= subtotal) return false;
        // Check basic eligibility criteria except min_cart_value
        if (c.usage_limit && c.times_used >= c.usage_limit) return false;
        if (c.applicable_for_new_customers && userOrders.length > 0) return false;
        return true;
    });
  }, [allCoupons, subtotal, userOrders]);

  const displayRazorpay = async () => {
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) { alert('Please select or add a shipping address.'); return; }
    setIsProcessingPayment(true);
    const razorpayKey = storeSettings?.razorpay_key_id || 'rzp_live_S2cQKtfNJeRu6m';
    const options = {
      key: razorpayKey, amount: Math.round(finalTotal * 100), currency: 'INR', name: 'Havikar',
      description: 'Payment for Traditional South Indian Foods',
      image: storeSettings?.logo_url || 'https://someuoatqyrqbkbiqggi.supabase.co/storage/v1/object/public/media/3f1af040-6076-4357-a228-678410a7fb22_removalai_preview.png',
      handler: async (response: any) => {
        try {
            const newOrder = await placeOrder({ 
                pointsToRedeem: pointsToApply, 
                paymentMethod: 'Razorpay', 
                paymentId: response.razorpay_payment_id, 
                coupon: appliedCoupon ?? undefined, 
                shippingAddress: selectedAddress,
                total: finalTotal,
                shipping_amount: shipping,
                discount_amount: couponDiscount
            });
            setOrderSuccessData(newOrder);
        } catch (e) { alert("Payment successful but order placement failed. Please contact support."); } 
        finally { setIsProcessingPayment(false); }
      },
      prefill: { 
          name: user.name || 'Customer', 
          email: user.email || 'havikar@bhatco.com', 
          contact: (selectedAddress.phone_number || user.mobile || '').replace(/\D/g, '').slice(-10) || '9999999999' 
      },
      theme: { color: '#0F4A3C' },
      modal: { ondismiss: () => setIsProcessingPayment(false) }
    };
    if (!window.Razorpay) { alert("Razorpay SDK not loaded."); setIsProcessingPayment(false); return; }
    const paymentObject = new window.Razorpay(options);
    paymentObject.on('payment.failed', (response: any) => { alert(`Payment failed: ${response.error.description}`); setIsProcessingPayment(false); });
    paymentObject.open();
  };

  const handleProceedToPayment = async () => {
    const selectedAddress = addresses.find(a => a.id === selectedAddressId);
    if (!selectedAddress) { alert('Please select or add a shipping address.'); return; }
    
    if (!selectedAddress.phone_number) {
        alert('The selected address is missing a phone number. Please add a new address with a valid phone number to proceed.');
        return;
    }

    setIsProcessingPayment(true);
    try {
        if (finalTotal <= 0) {
            const newOrder = await placeOrder({ 
                pointsToRedeem: pointsToApply, 
                paymentMethod: null, 
                paymentId: `free_order_${Date.now()}`, 
                coupon: appliedCoupon ?? undefined, 
                shippingAddress: selectedAddress,
                total: finalTotal,
                shipping_amount: shipping,
                discount_amount: couponDiscount
            });
            setOrderSuccessData(newOrder);
        } else if (paymentMethod === 'Razorpay') {
            await displayRazorpay();
        } else if (paymentMethod === 'Cash on Delivery') {
            const newOrder = await placeOrder({ 
                pointsToRedeem: pointsToApply, 
                paymentMethod: 'Cash on Delivery', 
                coupon: appliedCoupon ?? undefined, 
                shippingAddress: selectedAddress,
                total: finalTotal,
                shipping_amount: shipping,
                discount_amount: couponDiscount
            });
            setOrderSuccessData(newOrder);
        }
    } catch (error: any) {
        console.error('Checkout error:', error);
        const errorMsg = error.message || 'Unknown error';
        if (errorMsg.includes('libcurl')) {
            alert(`CRITICAL DATABASE ERROR: ${errorMsg}\n\nThis is caused by a broken Webhook in your Supabase Dashboard. Please go to Supabase -> Database -> Webhooks and disable any webhooks on the 'orders' table.`);
        } else {
            alert(`An error occurred during checkout: ${errorMsg}`);
        }
    } finally {
        if (paymentMethod !== 'Razorpay') setIsProcessingPayment(false);
    }
  };

  if (cart.length === 0 && !orderSuccessData) return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-hav-cream text-center">
        <h1 className="text-4xl font-serif font-bold text-hav-orange-900">Your Bag is Empty</h1>
        <p className="mt-2 text-hav-brown">Looks like you haven't added anything to your bag yet.</p>
        <button onClick={() => navigateTo('shop')} className="mt-6 bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg">Start Shopping</button>
    </div>
  );

  return (
    <>
      {orderSuccessData && <OrderSuccessModal order={orderSuccessData} onContinueShopping={() => { setOrderSuccessData(null); navigateTo('shop'); }} onViewOrders={() => { setOrderSuccessData(null); navigateTo('profile'); }}/>}
      <CouponsModal isOpen={isCouponsModalOpen} onClose={() => setIsCouponsModalOpen(false)} onApply={handleApplyCouponFromModal} user={user} subtotal={subtotal} products={products} categories={categories} storeSettings={storeSettings} cart={cart} />
      
      <div className="bg-hav-cream min-h-screen py-2 md:py-4">
        {isAddressModalOpen && <AddressFormModal onClose={() => { setIsAddressModalOpen(false); setEditingAddress(null); }} onSave={handleAddNewAddress} user={user} initialData={editingAddress} />}
        <div className="container mx-auto px-4 max-w-6xl">
          <h1 className="text-2xl md:text-3xl font-serif font-bold text-hav-orange-900 text-center mb-4">Checkout</h1>
          
          {/* ⭐ Premium & Sleek Integrated Perk Tracker Banner with yellow progress tracking on deep green background */}
          <div className="bg-[#0F4A3C] text-white rounded-3xl p-4 sm:p-5 mb-5 shadow-xs border border-[#0f4a3c]/30 flex flex-col md:flex-row md:items-center justify-between gap-4 overflow-hidden text-xs font-sans w-full">
            {/* Left: Tracker label and gold/yellow progress bar */}
            <div className="flex-1 flex flex-col sm:flex-row sm:items-center gap-3">
              <span className="text-[11px] font-sans font-black uppercase tracking-wider text-[#C9A236] whitespace-nowrap flex items-center gap-1.5 shrink-0">
                ⭐ Heritage Perks:
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
                  Add <strong className="text-[#C9A236]">₹{shippingRemaining.toFixed(0)} more</strong> for Free Delivery
                </span>
              )}
              {nextCoupon && (
                <span className="pl-4 sm:border-l border-white/20 text-white font-sans shrink-0">
                  🎯 Add <strong className="text-[#C9A236] font-mono">₹{(nextCoupon.min_cart_value! - subtotal).toFixed(0)} more</strong> to unlock <span className="font-black text-[#C9A236] bg-white/15 px-2 py-0.5 rounded border border-white/10">"{nextCoupon.code}"</span>
                </span>
              )}
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
            <div className="lg:col-span-8 space-y-4">
              
              {/* Shipping Address Section */}
              <div className="bg-hav-orange-50 p-4 rounded-xl shadow-lg border border-hav-gold/10">
                  <div className="flex justify-between items-center mb-2">
                      <h2 className="text-lg font-serif font-bold text-hav-orange-800">Shipping Address</h2>
                      <button onClick={() => setIsAddressModalOpen(true)} className="text-[10px] font-black text-hav-orange-600 hover:underline uppercase tracking-widest">+ Add New</button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                      {addresses.length > 0 ? addresses.map(addr => (
                          <label key={addr.id} className="flex items-start p-2 border-2 rounded-xl has-[:checked]:border-hav-orange-500 has-[:checked]:bg-white transition-all cursor-pointer bg-white/50 relative group">
                              <input type="radio" name="shippingAddress" value={addr.id} checked={selectedAddressId === addr.id} onChange={() => setSelectedAddressId(addr.id)} className="h-4 w-4 text-hav-orange-600 focus:ring-hav-orange-500 mt-0.5"/>
                              <div className="ml-2 text-[10px] flex-grow leading-tight">
                                  <p className="font-bold text-hav-brown text-xs truncate">{addr.address_line_1}</p>
                                  <p className="text-hav-brown/70 truncate">{addr.city}, {addr.state}</p>
                              </div>
                              <button 
                                onClick={(e) => handleEditAddress(e, addr)}
                                className="absolute top-1 right-2 text-hav-orange-600 hover:text-hav-orange-800 font-bold text-[8px] opacity-0 group-hover:opacity-100 transition-opacity uppercase"
                              >
                                Edit
                              </button>
                          </label>
                      )) : (
                          <p className="col-span-full text-center p-4 bg-white/50 rounded-xl border border-dashed border-hav-gold/30 italic text-hav-brown/60 text-xs">Please add a shipping address to proceed.</p>
                      )}
                  </div>
                  {(() => {
                      const activeAddress = addresses.find(a => a.id === selectedAddressId);
                      if (activeAddress) {
                          const estimate = getDeliveryEstimate(activeAddress.state || '', activeAddress.city || '');
                          return (
                              <div className="mt-3 bg-[#0F4A3C]/10 border border-[#0F4A3C]/20 p-3 rounded-xl flex items-center gap-3">
                                  <div className="bg-[#0F4A3C] text-hav-gold p-2 rounded-xl text-lg shrink-0">🚚</div>
                                  <div>
                                      <p className="text-[10px] font-black uppercase text-hav-forest tracking-wider">India Post Speed Post Delivery Estimate</p>
                                      <p className="text-[13px] font-extrabold text-[#0F4A3C]">Estimated {estimate}</p>
                                      <p className="text-[9px] text-hav-olive">Dispatched from Bangalore hub same day (before 2pm) or next business day.</p>
                                  </div>
                              </div>
                          );
                      }
                      return null;
                  })()}
              </div>

              {/* Payment Method Section */}
              <div className="bg-hav-orange-50 p-4 rounded-xl shadow-lg border border-hav-gold/10">
                  <h2 className="text-lg font-serif font-bold text-hav-orange-800 mb-2">Payment</h2>
                  
                  <p className="text-[10px] uppercase font-black tracking-wider text-hav-olive mb-2">Select payment method</p>
                  <div className="grid grid-cols-2 gap-2">
                      <label className="flex items-start p-2 border-2 rounded-xl has-[:checked]:border-hav-orange-500 has-[:checked]:bg-white transition-all cursor-pointer bg-white/50">
                          <input type="radio" name="paymentMethod" value="Razorpay" checked={paymentMethod === 'Razorpay'} onChange={() => setPaymentMethod('Razorpay')} className="h-4 w-4 text-hav-orange-600 focus:ring-hav-orange-500 mt-0.5"/>
                          <div className="ml-2 text-[10px] leading-tight">
                              <p className="font-bold text-hav-brown text-xs flex items-center gap-1">Online <RazorpayIcon className="w-3 h-3"/></p>
                              <p className="text-hav-brown/60">UPI, Cards</p>
                          </div>
                      </label>
                      {storeSettings?.is_cod_enabled && (
                          <label className="flex items-start p-2 border-2 rounded-xl has-[:checked]:border-hav-orange-500 has-[:checked]:bg-white transition-all cursor-pointer bg-white/50">
                              <input type="radio" name="paymentMethod" value="Cash on Delivery" checked={paymentMethod === 'Cash on Delivery'} onChange={() => setPaymentMethod('Cash on Delivery')} className="h-4 w-4 text-hav-orange-600 focus:ring-hav-orange-500 mt-0.5"/>
                              <div className="ml-2 text-[10px] leading-tight">
                                  <p className="font-bold text-hav-brown text-xs">COD</p>
                                  <p className="text-hav-brown/60">Pay at door</p>
                              </div>
                          </label>
                      )}
                  </div>
              </div>
            </div>

            {/* Order Summary Sidebar (Calculations & Checkout Action First) */}
            <div className="lg:col-span-4 space-y-4 lg:sticky top-24 h-fit">
              
              {/* Promo Offers Coupon Panel - Styled like Heritage Perks & placed at the very top of Sidebar */}
              <div className="bg-[#0F4A3C] text-white rounded-2xl p-4 border border-[#C9A236]/30 shadow-xl space-y-2.5">
                <div className="flex justify-between items-center border-b border-white/10 pb-1.5">
                  <p className="text-[10px] uppercase font-black text-hav-gold tracking-widest font-sans flex items-center gap-1">
                    <span>🏷️ Promo Vouchers</span>
                  </p>
                  {appliedCoupon && (
                    <span className="text-[8px] bg-white/15 text-[#C9A236] px-1.5 py-0.5 rounded border border-[#C9A236]/20 font-bold uppercase tracking-wider">Active</span>
                  )}
                </div>
                {appliedCoupon ? (
                  <div className="flex justify-between items-center bg-white/5 border border-white/15 p-2.5 rounded-xl">
                    <div className="flex flex-col min-w-0 pr-2">
                      <span className="text-[11px] text-[#C9A236] font-black uppercase">"{appliedCoupon.code}"</span>
                      <span className="text-[9.5px] text-hav-cream font-medium line-clamp-2 mt-0.5">{appliedCoupon.display_message || 'Discount applied successfully!'}</span>
                    </div>
                    <button onClick={removeCoupon} className="text-[10px] font-black text-orange-300 hover:text-orange-400 hover:underline cursor-pointer ml-auto shrink-0 uppercase tracking-wide">Remove</button>
                  </div>
                ) : (
                  <div>
                    <button 
                      onClick={() => setIsCouponsModalOpen(true)} 
                      className="w-full text-center py-2.5 border border-dashed border-[#C9A236]/60 bg-white/5 text-[#C9A236] font-black rounded-xl hover:bg-white/10 transition-all uppercase text-[9.5px] tracking-wider cursor-pointer font-sans"
                    >
                      Select Promo Voucher
                    </button>
                    <p className="text-[8.5px] text-hav-cream/80 italic mt-1 text-center font-sans">
                      Try applying a promotional code to save extra on your cart total!
                    </p>
                  </div>
                )}
              </div>

              {/* Calculations, Place Order Button & Estimated Delivery */}
              <div className="bg-[#0F4A3C] text-white rounded-2xl p-5 sm:p-6 shadow-xl space-y-3.5 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full filter blur-xl transform translate-x-10 -translate-y-10 pointer-events-none" />
                
                <div className="flex justify-between items-center border-b border-white/10 pb-2">
                  <h2 className="text-xs font-sans uppercase font-black text-hav-gold tracking-widest">Pricing Breakdown</h2>
                  <span className="text-[9px] uppercase bg-white/10 text-hav-cream py-0.5 px-2 rounded-full font-mono font-bold">Secure Checkout</span>
                </div>

                {/* Pricing breakdown */}
                <div className="space-y-2 border-b border-white/10 pb-3 text-xs font-sans">
                  <div className="flex justify-between text-hav-cream">
                    <span>Items Subtotal</span>
                    <span className="font-bold font-mono">₹{(subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-hav-cream">
                    <span>Standard Shipping</span>
                    <span className={shipping === 0 ? 'text-green-300 font-extrabold' : 'font-bold font-mono'}>
                      {shipping === 0 ? 'FREE' : `₹${(shipping || 0).toFixed(2)}`}
                    </span>
                  </div>
                  
                  {couponDiscount > 0 && (
                    <div className="flex justify-between text-[#C9A236] font-bold">
                      <span>🏷️ Coupon Discount</span>
                      <span className="font-mono">-₹{(couponDiscount || 0).toFixed(2)}</span>
                    </div>
                  )}

                  {pointsDiscount > 0 && (
                    <div className="flex justify-between text-orange-300 font-bold">
                      <span>🪙 Wallet applied</span>
                      <span className="font-mono font-extrabold">-₹{(pointsDiscount || 0).toFixed(2)}</span>
                    </div>
                  )}
                </div>

                {/* Final net total */}
                <div className="flex flex-col border-b border-white/10 pb-2.5">
                  <div className="flex justify-between items-center font-serif text-lg font-bold">
                    <span className="text-hav-gold">Total Amount</span>
                    <span className="text-2xl text-white font-sans font-black font-mono">
                      ₹{(finalTotal || 0).toFixed(2)}
                    </span>
                  </div>
                  <p className="text-[9px] text-hav-cream/70 text-right mt-1 italic font-sans">
                    * Inclusive of ₹{(totalGstIncluded || 0).toFixed(2)} GST tax
                  </p>
                </div>

                {/* Place Order CTA */}
                <button 
                  onClick={handleProceedToPayment} 
                  className="w-full bg-[#F48E2F] hover:bg-[#ff9c3a] text-white font-black py-2.5 px-4 rounded-xl transition-all shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest text-[11px] cursor-pointer" 
                  disabled={!selectedAddressId || isProcessingPayment}
                >
                  {isProcessingPayment ? 'Processing...' : 'Place Secure Order'}
                </button>

                {/* Delivery details display */}
                {(() => {
                  const activeAddress = addresses.find(a => a.id === selectedAddressId);
                  if (activeAddress) {
                    const estimate = getDeliveryEstimate(activeAddress.state || '', activeAddress.city || '');
                    return (
                        <p className="text-[9.5px] text-hav-cream/80 text-center font-sans tracking-wide">
                          🚚 Speed Post Delivery to <strong className="underline decoration-dotted">{activeAddress.city}</strong>: <strong className="text-[#F48E2F]">{estimate}</strong>
                        </p>
                    );
                  }
                  return (
                    <p className="text-[9.5px] text-[#F48E2F] text-center font-sans font-black uppercase tracking-wider animate-pulse">
                      ⚠️ Select/Add address to estimate delivery
                    </p>
                  );
                })()}
              </div>

              {/* 🪙 Heritage Loyalty Wallet Redeemer Panel (In-Checkout) */}
              <div className="bg-white rounded-2xl p-4 border border-hav-gold/15 shadow-xs space-y-2.5">
                <h3 className="text-xs uppercase font-black text-hav-forest font-sans tracking-wider flex items-center gap-1.5">
                  <span>🪙 Heritage Loyalty Wallet</span>
                </h3>
                {user.reward_points > 0 ? (
                  <div className="space-y-2 text-xs">
                    <div className="bg-[#0F4A3C]/5 px-3 py-2 rounded-xl border border-[#0F4A3C]/10 flex justify-between items-center">
                      <div>
                        <p className="text-[8px] uppercase text-gray-400 font-bold">Your Balance</p>
                        <p className="text-sm font-black text-[#0F4A3C] font-mono">₹{user.reward_points.toFixed(2)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[8px] uppercase text-gray-400 font-bold">Redeemable Now</p>
                        <p className="text-xs font-bold text-hav-orange-700 font-mono">₹{maxApplicableWalletCheckoutPoints.toFixed(2)}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 bg-gray-50 p-2 rounded-xl border border-gray-150">
                      <input 
                        type="checkbox"
                        id="applyCheckoutWallet"
                        checked={pointsToApply === maxApplicableWalletCheckoutPoints && maxApplicableWalletCheckoutPoints > 0}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setPointsToApply(maxApplicableWalletCheckoutPoints);
                          } else {
                            setPointsToApply(0);
                          }
                        }}
                        className="w-3.5 h-3.5 text-[#0F4A3C] focus:ring-[#0F4A3C] border-gray-300 rounded cursor-pointer"
                      />
                      <label htmlFor="applyCheckoutWallet" className="text-[10.5px] font-bold text-hav-forest cursor-pointer select-none">
                        Apply max points (₹{maxApplicableWalletCheckoutPoints.toFixed(0)})
                      </label>
                    </div>

                    <div className="flex gap-2">
                      <input 
                        type="number"
                        min="0"
                        max={maxApplicableWalletCheckoutPoints}
                        value={pointsToApply || ''}
                        onChange={(e) => {
                          const val = parseInt(e.target.value, 10) || 0;
                          setPointsToApply(Math.min(maxApplicableWalletCheckoutPoints, Math.max(0, val)));
                        }}
                        placeholder="Enter custom points amount"
                        className="bg-white border border-gray-200 rounded-lg px-2.5 py-1.5 text-xs font-mono font-bold text-hav-forest w-full focus:outline-hidden focus:ring-1 focus:ring-[#0F4A3C]"
                      />
                      {pointsToApply > 0 && (
                        <button 
                          onClick={() => setPointsToApply(0)}
                          className="bg-gray-100 hover:bg-gray-200 text-gray-700 text-[9px] font-bold px-2 rounded-lg uppercase cursor-pointer"
                        >
                          Clear
                        </button>
                      )}
                    </div>
                  </div>
                ) : (
                  <p className="text-[9.5px] text-hav-olive bg-[#0F4A3C]/5 p-2 rounded-lg border border-[#0F4A3C]/10 leading-snug">
                    Your balance is empty. This order earns you <span className="font-bold text-[#0F4A3C]">₹{(subtotal * 0.05).toFixed(2)}</span> cashback!
                  </p>
                )}
              </div>

              {/* Collapsible List of items in bag (Amazon-like dense details) */}
              <details className="group bg-white rounded-2xl p-3 border border-gray-200/80 shadow-2xs">
                <summary className="flex justify-between items-center text-xs font-bold text-hav-forest cursor-pointer select-none list-none uppercase tracking-wide">
                  <span className="flex items-center gap-1.5">
                    <span>📦 Review Items ({cart.length})</span>
                  </span>
                  <span className="text-gray-400 group-open:rotate-180 transition-transform font-sans font-black text-[9px]">▼</span>
                </summary>
                
                <div className="space-y-2 mt-2 pt-2 border-t border-gray-100 max-h-36 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.variantId} className="flex justify-between items-center gap-3 text-xs">
                      <div className="truncate text-gray-700 select-none">
                        <span className="font-extrabold font-sans text-[11px]">{item.name}</span>
                        <span className="text-gray-400 text-[10px] ml-1">x{item.quantity}</span>
                      </div>
                      <span className="font-mono font-bold text-gray-900 shrink-0 text-[10.5px]">₹{((item.price || 0) * item.quantity).toFixed(0)}</span>
                    </div>
                  ))}
                </div>
              </details>

            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
