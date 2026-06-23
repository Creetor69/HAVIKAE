
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Product, ProductVariant, OrderItem, Address } from '../types';
import { Search, Plus, Minus, Trash2, ShoppingBag, Truck, User, Phone, MapPin, CheckCircle } from 'lucide-react';

const POSPage: React.FC = () => {
    const [products, setProducts] = useState<Product[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [cart, setCart] = useState<{variant: ProductVariant, product: Product, quantity: number}[]>([]);
    const [customerInfo, setCustomerInfo] = useState({ name: '', mobile: '' });
    const [orderType, setOrderType] = useState<'In-Store' | 'Delivery'>('In-Store');
    const [address, setAddress] = useState<Partial<Address>>({
        address_line_1: '',
        city: '',
        state: '',
        postal_code: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [successOrder, setSuccessOrder] = useState<any>(null);

    useEffect(() => {
        fetchProducts();
    }, []);

    const fetchProducts = async () => {
        const { data } = await supabase!.from('products').select('*, product_variants(*)').eq('is_active', true);
        if (data) setProducts(data);
    };

    const addToCart = (product: Product, variant: ProductVariant) => {
        setCart(prev => {
            const existing = prev.find(item => item.variant.id === variant.id);
            if (existing) {
                return prev.map(item => item.variant.id === variant.id ? { ...item, quantity: item.quantity + 1 } : item);
            }
            return [...prev, { product, variant, quantity: 1 }];
        });
    };

    const updateQuantity = (variantId: string, delta: number) => {
        setCart(prev => prev.map(item => {
            if (item.variant.id === variantId) {
                const newQty = Math.max(0, item.quantity + delta);
                return { ...item, quantity: newQty };
            }
            return item;
        }).filter(item => item.quantity > 0));
    };

    const subtotal = cart.reduce((sum, item) => sum + (item.variant.price * item.quantity), 0);

    const handlePlaceOrder = async () => {
        if (cart.length === 0) return alert("Cart is empty");
        if (!customerInfo.name || !customerInfo.mobile) return alert("Customer details required");
        if (orderType === 'Delivery' && !address.address_line_1) return alert("Address required for delivery");

        setIsSubmitting(true);
        try {
            // 1. Create or find profile
            const { data: existingProfile } = await supabase!
                .from('profiles')
                .select('id')
                .eq('mobile', customerInfo.mobile)
                .single();

            let userId = existingProfile?.id;
            
            // If no profile, we'll use a generic "Guest" user ID or leave it null if DB allows
            // For now, we'll proceed with the order creation

            const orderData = {
                user_id: userId || null,
                total: subtotal,
                status: orderType === 'In-Store' ? 'Delivered' : 'Processing',
                payment_method: 'Cash/Offline',
                order_type: orderType === 'In-Store' ? 'offline_instore' : 'offline_delivery',
                items: cart.map(item => ({
                    productId: item.product.id,
                    variantId: item.variant.id,
                    name: item.product.name,
                    variantName: item.variant.name,
                    price: item.variant.price,
                    quantity: item.quantity,
                    image: item.product.image_urls[0]
                })),
                shipping_address: {
                    name: customerInfo.name,
                    mobile: customerInfo.mobile,
                    ...address
                }
            };

            const { data, error } = await supabase!.from('orders').insert(orderData).select().single();
            if (error) throw error;

            setSuccessOrder(data);
            setCart([]);
            setCustomerInfo({ name: '', mobile: '' });
            setAddress({ address_line_1: '', city: '', state: '', postal_code: '' });
        } catch (err: any) {
            alert(err.message);
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredProducts = products.filter(p => 
        p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (successOrder) {
        return (
            <div className="min-h-screen bg-hav-cream flex items-center justify-center p-4">
                <div className="bg-white p-8 rounded-3xl shadow-2xl max-w-md w-full text-center border border-hav-gold/20">
                    <CheckCircle className="w-20 h-20 text-green-600 mx-auto mb-4" />
                    <h2 className="text-3xl font-serif font-bold text-hav-forest mb-2">Order Recorded!</h2>
                    <p className="text-hav-olive mb-6">Order ID: <span className="font-bold">#{successOrder.order_number}</span></p>
                    
                    {successOrder.order_type === 'offline_delivery' && (
                        <div className="bg-hav-orange-50 p-4 rounded-xl mb-6 text-sm">
                            <p className="font-bold text-hav-orange-800 mb-2">Tracking Link for Customer:</p>
                            <code className="block bg-white p-2 rounded border break-all text-xs font-mono select-all">
                                {window.location.origin}/track?id={successOrder.order_number}&m={successOrder.shipping_address?.mobile || successOrder.shipping_address?.phone_number || ''}
                            </code>
                        </div>
                    )}

                    <button 
                        onClick={() => setSuccessOrder(null)}
                        className="w-full bg-hav-forest text-hav-gold font-bold py-4 rounded-full shadow-lg"
                    >
                        Take Next Order
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-hav-cream flex flex-col md:flex-row">
            {/* Product Selection Side */}
            <div className="flex-1 p-6 overflow-y-auto">
                <div className="flex items-center justify-between mb-8">
                    <h1 className="text-3xl font-serif font-bold text-hav-forest">Havikar POS</h1>
                    <div className="relative w-64">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-hav-olive/40 w-5 h-5" />
                        <input 
                            type="text" 
                            placeholder="Search products..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="w-full pl-10 pr-4 py-2 rounded-full border border-hav-gold/20 focus:ring-2 focus:ring-hav-gold outline-none"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filteredProducts.map(product => (
                        <div key={product.id} className="bg-white p-4 rounded-2xl shadow-sm border border-hav-gold/10">
                            <img src={product.image_urls[0]} alt={product.name} className="w-full h-32 object-cover rounded-xl mb-3" />
                            <h3 className="font-bold text-hav-forest line-clamp-1">{product.name}</h3>
                            <div className="mt-2 space-y-2">
                                {product.product_variants?.map(variant => (
                                    <button 
                                        key={variant.id}
                                        onClick={() => addToCart(product, variant)}
                                        className="w-full flex justify-between items-center p-2 text-xs bg-hav-cream/50 hover:bg-hav-gold/20 rounded-lg transition-colors"
                                    >
                                        <span>{variant.name}</span>
                                        <span className="font-bold">₹{variant.price}</span>
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Cart & Customer Side */}
            <div className="w-full md:w-96 bg-white border-l border-hav-gold/20 flex flex-col shadow-2xl">
                <div className="p-6 border-b border-hav-gold/10">
                    <h2 className="text-xl font-bold text-hav-forest flex items-center gap-2">
                        <ShoppingBag className="w-5 h-5" /> Current Order
                    </h2>
                </div>

                <div className="flex-1 overflow-y-auto p-6 space-y-4">
                    {cart.length === 0 ? (
                        <div className="text-center py-12 text-hav-olive/40">
                            <ShoppingBag className="w-12 h-12 mx-auto mb-2 opacity-20" />
                            <p>Cart is empty</p>
                        </div>
                    ) : (
                        cart.map(item => (
                            <div key={item.variant.id} className="flex justify-between items-center">
                                <div className="flex-1">
                                    <p className="text-sm font-bold text-hav-forest">{item.product.name}</p>
                                    <p className="text-xs text-hav-olive">{item.variant.name}</p>
                                </div>
                                <div className="flex items-center gap-3">
                                    <div className="flex items-center bg-hav-cream rounded-full px-2">
                                        <button onClick={() => updateQuantity(item.variant.id, -1)} className="p-1"><Minus className="w-3 h-3" /></button>
                                        <span className="w-6 text-center text-sm font-bold">{item.quantity}</span>
                                        <button onClick={() => updateQuantity(item.variant.id, 1)} className="p-1"><Plus className="w-3 h-3" /></button>
                                    </div>
                                    <p className="text-sm font-bold w-16 text-right">₹{item.variant.price * item.quantity}</p>
                                </div>
                            </div>
                        ))
                    )}
                </div>

                <div className="p-6 bg-hav-cream/30 border-t border-hav-gold/10 space-y-4">
                    <div className="space-y-3">
                        <div className="flex gap-2">
                            <div className="flex-1">
                                <label className="text-[10px] font-bold uppercase text-hav-olive">Customer Name</label>
                                <input 
                                    type="text" 
                                    value={customerInfo.name}
                                    onChange={e => setCustomerInfo({...customerInfo, name: e.target.value})}
                                    className="w-full p-2 rounded-lg border border-hav-gold/20 text-sm"
                                />
                            </div>
                            <div className="flex-1">
                                <label className="text-[10px] font-bold uppercase text-hav-olive">Mobile</label>
                                <input 
                                    type="tel" 
                                    value={customerInfo.mobile}
                                    onChange={e => setCustomerInfo({...customerInfo, mobile: e.target.value})}
                                    className="w-full p-2 rounded-lg border border-hav-gold/20 text-sm"
                                />
                            </div>
                        </div>

                        <div className="flex gap-2">
                            <button 
                                onClick={() => setOrderType('In-Store')}
                                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${orderType === 'In-Store' ? 'bg-hav-forest text-hav-gold' : 'bg-white border border-hav-gold/20 text-hav-olive'}`}
                            >
                                <ShoppingBag className="w-4 h-4" /> In-Store
                            </button>
                            <button 
                                onClick={() => setOrderType('Delivery')}
                                className={`flex-1 py-2 rounded-lg flex items-center justify-center gap-2 text-xs font-bold transition-all ${orderType === 'Delivery' ? 'bg-hav-forest text-hav-gold' : 'bg-white border border-hav-gold/20 text-hav-olive'}`}
                            >
                                <Truck className="w-4 h-4" /> Delivery
                            </button>
                        </div>

                        {orderType === 'Delivery' && (
                            <div className="space-y-2 animate-fadeIn">
                                <input 
                                    placeholder="Address Line 1" 
                                    value={address.address_line_1}
                                    onChange={e => setAddress({...address, address_line_1: e.target.value})}
                                    className="w-full p-2 rounded-lg border border-hav-gold/20 text-sm"
                                />
                                <div className="flex gap-2">
                                    <input 
                                        placeholder="City" 
                                        value={address.city}
                                        onChange={e => setAddress({...address, city: e.target.value})}
                                        className="flex-1 p-2 rounded-lg border border-hav-gold/20 text-sm"
                                    />
                                    <input 
                                        placeholder="Pincode" 
                                        value={address.postal_code}
                                        onChange={e => setAddress({...address, postal_code: e.target.value})}
                                        className="w-24 p-2 rounded-lg border border-hav-gold/20 text-sm"
                                    />
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="pt-4 border-t border-hav-gold/20">
                        <div className="flex justify-between items-center mb-4">
                            <span className="text-hav-olive font-bold">Total Amount</span>
                            <span className="text-2xl font-serif font-bold text-hav-forest">₹{subtotal}</span>
                        </div>
                        <button 
                            onClick={handlePlaceOrder}
                            disabled={isSubmitting || cart.length === 0}
                            className="w-full bg-hav-forest text-hav-gold font-bold py-4 rounded-full shadow-xl hover:brightness-110 active:scale-95 transition-all disabled:opacity-50"
                        >
                            {isSubmitting ? 'Processing...' : 'Complete Order'}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default POSPage;
