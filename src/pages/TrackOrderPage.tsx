
import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { Order } from '../types';
import { Search, Package, Truck, CheckCircle, Clock, MapPin, Phone, User, ExternalLink } from 'lucide-react';
import { getDeliveryEstimate } from '../utils/delivery';

const TrackOrderPage: React.FC = () => {
    const [orderId, setOrderId] = useState('');
    const [mobile, setMobile] = useState('');
    const [order, setOrder] = useState<Order | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const id = params.get('id');
        const m = params.get('m');
        if (id && m) {
            handleTrack(id, m);
        }
    }, []);

    const handleTrack = async (id?: string, m?: string) => {
        const searchId = id || orderId;
        const searchMobile = m || mobile;

        if (!searchId || !searchMobile) return;

        setLoading(true);
        setError('');
        try {
            const { data, error } = await supabase!
                .from('orders')
                .select('*')
                .eq('order_number', searchId)
                .single();

            if (error || !data) throw new Error("Order not found");

            // Verify mobile number matches (compare the last 10 digits to bypass spaces, country codes, +91 etc.)
            const cleanNumber = (num: string) => {
                const digits = num.replace(/\D/g, '');
                return digits.length >= 10 ? digits.slice(-10) : digits;
            };
            const shippingMobile = cleanNumber(data.shipping_address?.mobile || data.shipping_address?.phone_number || '');
            const inputMobile = cleanNumber(searchMobile);
            
            if (!shippingMobile || !inputMobile || shippingMobile !== inputMobile) {
                throw new Error("Mobile number does not match this order");
            }

            setOrder(data);
        } catch (err: any) {
            setError(err.message);
            setOrder(null);
        } finally {
            setLoading(false);
        }
    };

    const getStatusIcon = (status: string) => {
        switch (status) {
            case 'Processing': return <Clock className="w-6 h-6 text-orange-500" />;
            case 'Shipped': return <Truck className="w-6 h-6 text-blue-500" />;
            case 'Delivered': return <CheckCircle className="w-6 h-6 text-green-500" />;
            default: return <Package className="w-6 h-6 text-hav-olive" />;
        }
    };

    return (
        <div className="min-h-screen bg-hav-cream p-4 md:p-8">
            <div className="max-w-2xl mx-auto">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-serif font-bold text-hav-forest mb-4">Track Your Order</h1>
                    <p className="text-hav-olive">Enter your details below to see your order status</p>
                </div>

                {/* Search Form */}
                <div className="bg-white p-6 rounded-3xl shadow-xl border border-hav-gold/20 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                        <div>
                            <label className="text-[10px] font-bold uppercase text-hav-olive mb-1 block">Order ID</label>
                            <input 
                                type="text" 
                                placeholder="e.g. 1024" 
                                value={orderId}
                                onChange={(e) => setOrderId(e.target.value)}
                                className="w-full p-3 rounded-xl border border-hav-gold/20 focus:ring-2 focus:ring-hav-gold outline-none"
                            />
                        </div>
                        <div>
                            <label className="text-[10px] font-bold uppercase text-hav-olive mb-1 block">Mobile Number</label>
                            <input 
                                type="tel" 
                                placeholder="Enter mobile number" 
                                value={mobile}
                                onChange={(e) => setMobile(e.target.value)}
                                className="w-full p-3 rounded-xl border border-hav-gold/20 focus:ring-2 focus:ring-hav-gold outline-none"
                            />
                        </div>
                    </div>
                    <button 
                        onClick={() => handleTrack()}
                        disabled={loading}
                        className="w-full bg-hav-forest text-hav-gold font-bold py-4 rounded-full shadow-lg hover:brightness-110 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                    >
                        {loading ? 'Searching...' : <><Search className="w-5 h-5" /> Track Order</>}
                    </button>
                    {error && <p className="text-red-500 text-center mt-4 text-sm font-bold">{error}</p>}
                </div>

                {/* Order Results */}
                {order && (
                    <div className="space-y-6 animate-fadeIn">
                        <div className="bg-white p-8 rounded-3xl shadow-xl border border-hav-gold/20">
                            <div className="flex justify-between items-start mb-8">
                                <div>
                                    <h2 className="text-2xl font-serif font-bold text-hav-forest">Order #{order.order_number}</h2>
                                    <p className="text-sm text-hav-olive">Placed on {new Date(order.created_at).toLocaleDateString()}</p>
                                </div>
                                <div className="flex flex-col items-end">
                                    <span className={`px-4 py-1 rounded-full text-xs font-bold uppercase tracking-widest ${
                                        order.status === 'Delivered' ? 'bg-green-100 text-green-700' : 
                                        order.status === 'Shipped' ? 'bg-blue-100 text-blue-700' : 'bg-orange-100 text-orange-700'
                                    }`}>
                                        {order.status}
                                    </span>
                                </div>
                            </div>

                            {/* Delivery Estimate */}
                            {order.status !== 'Delivered' && order.shipping_address && (
                                <div className="bg-[#0F4A3C]/5 border border-[#0F4A3C]/10 p-5 rounded-2xl mb-8 flex items-center gap-4">
                                    <div className="bg-[#0F4A3C] text-hav-gold p-3 rounded-xl text-xl shrink-0">🚚</div>
                                    <div className="text-left text-sm text-hav-brown">
                                        <p className="font-extrabold text-[#0F4A3C] uppercase tracking-wider text-[10px] leading-none mb-1">India Post Speed Post Transit Estimate</p>
                                        <p className="font-black text-[#0F4A3C] text-base">
                                            Estimated {getDeliveryEstimate(order.shipping_address.state || '', order.shipping_address.city || '')}
                                        </p>
                                        <p className="text-[11px] text-hav-olive mt-1">Dispatched fresh from Bangalore hub same day or next business day.</p>
                                    </div>
                                </div>
                            )}

                            {/* Tracking Info */}
                            {order.status === 'Shipped' && order.tracking_id && (
                                <div className="bg-hav-forest/5 p-6 rounded-2xl border border-hav-forest/10 mb-8">
                                    <h3 className="font-bold text-hav-forest mb-4 flex items-center gap-2">
                                        <Truck className="w-5 h-5" /> Shipment Details
                                    </h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                                        <div>
                                            <p className="text-hav-olive uppercase text-[10px] font-bold">Courier</p>
                                            <p className="font-bold">{order.courier_name || 'Our Partner'}</p>
                                        </div>
                                        <div>
                                            <p className="text-hav-olive uppercase text-[10px] font-bold">Tracking ID</p>
                                            <p className="font-bold">{order.tracking_id}</p>
                                        </div>
                                    </div>
                                    {order.tracking_link && (
                                        <a 
                                            href={order.tracking_link} 
                                            target="_blank" 
                                            rel="noopener noreferrer"
                                            className="mt-4 inline-flex items-center gap-2 text-hav-orange-600 font-bold hover:underline"
                                        >
                                            Track on Courier Website <ExternalLink className="w-4 h-4" />
                                        </a>
                                    )}
                                </div>
                            )}

                            {/* Items */}
                            <div className="space-y-4">
                                <h3 className="font-bold text-hav-forest border-b border-hav-gold/10 pb-2">Items</h3>
                                {order.items.map((item: any, idx: number) => (
                                    <div key={idx} className="flex justify-between items-center text-sm">
                                        <div className="flex items-center gap-3">
                                            <img src={item.image} alt={item.name} className="w-12 h-12 object-cover rounded-lg" />
                                            <div>
                                                <p className="font-bold">{item.name}</p>
                                                <p className="text-xs text-hav-olive">{item.variantName} x {item.quantity}</p>
                                            </div>
                                        </div>
                                        <p className="font-bold">₹{item.price * item.quantity}</p>
                                    </div>
                                ))}
                                <div className="pt-4 border-t border-hav-gold/10 flex justify-between items-center">
                                    <span className="font-bold text-hav-forest">Total Amount</span>
                                    <span className="text-xl font-serif font-bold text-hav-forest">₹{order.total}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
};

export default TrackOrderPage;
