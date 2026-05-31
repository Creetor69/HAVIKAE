
import React, { useState, useMemo, useEffect } from 'react';
import { Page, CartItem, User, Order, Coupon, Address, AddressInsert, StoreSettings, Product, Category } from '../types';
import { supabase } from '../supabaseClient';
import XIcon from '../components/icons/XIcon';
import RazorpayIcon from '../components/icons/RazorpayIcon';
import OrderSuccessModal from '../components/OrderSuccessModal';
import CouponsModal from '../components/CouponsModal';

// Add Razorpay to the window object for TypeScript
declare global {
  interface Window {
    Razorpay: any;
  }
}

interface CheckoutPageProps {
  cart: CartItem[];
  placeOrder: (options: { pointsToRedeem: number; paymentMethod: Order['payment_method'], paymentId?: string, coupon?: Coupon, shippingAddress: Address }) => Promise<Order>;
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
    
    const inputStyles = "mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2 px-3 focus:ring-hav-orange-500 focus:border-hav-orange-500 bg-white";

    return (
        <div className="fixed inset-0 bg-black/50 z-[100] flex items-center justify-center p-4">
            <div className="bg-hav-orange-50 rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-serif font-bold text-hav-orange-900">{initialData ? 'Edit Address' : 'Add New Shipping Address'}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-hav-orange-100"><XIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <input type="text" name="address_line_1" value={formData.address_line_1} placeholder="Address Line 1" onChange={handleChange} required className={inputStyles} />
                    <input type="text" name="address_line_2" value={formData.address_line_2 || ''} placeholder="Address Line 2 (Optional)" onChange={handleChange} className={inputStyles} />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="city" value={formData.city} placeholder="City" onChange={handleChange} required className={inputStyles} />
                        <input type="text" name="state" value={formData.state} placeholder="State" onChange={handleChange} required className={inputStyles} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <input type="text" name="postal_code" value={formData.postal_code} placeholder="Postal Code" onChange={handleChange} required className={inputStyles} />
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
                    <input type="text" name="country" value={formData.country} onChange={handleChange} required className={inputStyles} />
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-white hover:bg-gray-100 text-gray-800 font-bold py-2 px-4 rounded-full transition-colors border border-hav-olive/10">Cancel</button>
                        <button type="submit" disabled={isSaving} className="bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-bold py-2 px-4 rounded-full transition-colors disabled:bg-hav-orange-300">
                            {isSaving ? 'Saving...' : 'Save Address'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const CheckoutPage: React.FC<CheckoutPageProps> = ({ cart, placeOrder, navigateTo, user, storeSettings, products, categories, updateCartQuantity, removeFromCart }) => {
  const [pointsToApply, setPointsToApply] = useState(0);
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

  useEffect(() => {
    const fetchCoupons = async () => {
        const { data: c } = await supabase!.from('coupons').select('*').eq('is_active', true).order('min_cart_value', { ascending: true });
        if (c) setAllCoupons(c as Coupon[]);
        const { data: o } = await supabase!.from('orders').select('id, total, status').eq('user_id', user.id).eq('status', 'Delivered');
        if (o) setUserOrders(o as Order[]);
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
  
  const shipping = useMemo(() => {
    const shippingThreshold = storeSettings?.free_shipping_threshold ?? 799;
    const standardShippingRate = storeSettings?.shipping_rate ?? 50;
    const isFreeShippingCoupon = appliedCoupon?.discount_type === 'free_shipping';
    if (isFreeShippingCoupon || subtotal >= shippingThreshold) return 0;
    return standardShippingRate;
  }, [subtotal, storeSettings, appliedCoupon]);

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
              </div>

              {/* Payment Method Section */}
              <div className="bg-hav-orange-50 p-4 rounded-xl shadow-lg border border-hav-gold/10">
                  <h2 className="text-lg font-serif font-bold text-hav-orange-800 mb-2">Payment</h2>
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

            {/* Order Summary Sidebar */}
            <div className="lg:col-span-4 bg-hav-orange-50 p-4 rounded-xl shadow-xl h-fit lg:sticky top-24 border border-hav-gold/30">
              <h2 className="text-lg font-serif font-bold text-hav-orange-800 mb-2 border-b border-hav-gold/20 pb-1">Summary</h2>
              
              <div className="space-y-1 mb-2 max-h-32 overflow-y-auto pr-1">
                  {cart.map(item => (
                    <div key={item.variantId} className="flex justify-between items-center gap-2 text-hav-brown text-[10px]">
                        <span className="font-medium truncate max-w-[120px]">{item.name} <span className="opacity-60">x{item.quantity}</span></span>
                        <span className="font-bold">₹{((item.price || 0) * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
              </div>

              {/* HIGH VISIBILITY COUPON SECTION */}
              <div className="py-2 border-t border-hav-gold/20">
                  {appliedCoupon ? (
                      <div className="flex justify-between items-center bg-green-50 border border-green-200 p-1.5 rounded-lg">
                        <div className="flex flex-col">
                            <p className="text-[9px] text-green-800 font-black">"{appliedCoupon.code}"</p>
                            <p className="text-[7px] text-green-600 font-bold uppercase">{appliedCoupon.display_message || 'Discount Applied'}</p>
                        </div>
                        <button onClick={removeCoupon} className="text-[8px] font-black text-red-600 hover:underline uppercase">Remove</button>
                      </div>
                  ) : (
                    <button 
                        onClick={() => setIsCouponsModalOpen(true)} 
                        className="w-full text-center py-1.5 border-2 border-dashed border-hav-orange-400 bg-hav-orange-100/50 text-hav-orange-800 font-black rounded-lg hover:bg-hav-orange-100 transition-all uppercase text-[9px] tracking-widest"
                    >
                        Apply Coupon
                    </button>
                  )}
              </div>

              <div className="space-y-1 py-2 border-t border-hav-gold/20 text-[10px]">
                  <div className="flex justify-between text-hav-brown">
                      <span>Subtotal</span>
                      <span>₹{(subtotal || 0).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between text-hav-brown">
                      <span>Shipping</span>
                      <span className={shipping === 0 ? 'text-green-600 font-black' : ''}>{shipping === 0 ? 'FREE' : `₹${(shipping || 0).toFixed(2)}`}</span>
                  </div>
                  {(couponDiscount > 0 || pointsDiscount > 0) && (
                      <div className="flex justify-between text-green-600 font-bold">
                          <span>Discounts</span>
                          <span>- ₹{(couponDiscount + pointsDiscount).toFixed(2)}</span>
                      </div>
                  )}
              </div>

               <div className="flex justify-between font-black text-xl text-hav-forest py-2 border-t border-hav-gold/20">
                   <span>Total</span>
                   <span>₹{(finalTotal || 0).toFixed(2)}</span>
               </div>
               
               <button 
                onClick={handleProceedToPayment} 
                className="w-full bg-green-600 hover:bg-green-700 text-white font-black py-3 px-4 rounded-full transition-all shadow-lg disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2 uppercase tracking-widest text-[10px]" 
                disabled={!selectedAddressId || isProcessingPayment}
              >
                  {isProcessingPayment ? 'Processing...' : 'Place Order'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default CheckoutPage;
