import React, { useState, useEffect } from 'react';
import { User, Order, Address, AddressInsert, AddressUpdate, OrderItem as OrderItemType, Page, Product, ProductVariant } from '../types';
import { supabase } from '../supabaseClient';
import XIcon from '../components/icons/XIcon';
import { Store } from 'lucide-react';

interface ProfilePageProps {
  user: User;
  onLogout: () => void;
  updateOrderStatus: (orderId: string, newStatus: Order['status']) => void;
  navigateTo: (page: Page) => void;
  addToCart: (product: Product, selectedVariant: ProductVariant, quantity: number) => void;
  products: Product[];
}

type ProfileTab = 'orders' | 'rewards' | 'details' | 'addresses' | 'wishlist';

const OrderItem: React.FC<{ item: OrderItemType }> = ({ item }) => (
    <div className="flex items-center justify-between py-2">
        <div className="flex items-center">
            <img src={item.image_url} alt={item.name} className="w-16 h-16 object-contain mix-blend-multiply rounded-md mr-4" />
            <div>
                <p className="font-semibold text-hav-brown">{item.name}</p>
                <p className="text-sm text-gray-500">Qty: {item.quantity} ({item.net_weight})</p>
            </div>
        </div>
        <p className="font-semibold text-hav-orange-800">₹{((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}</p>
    </div>
);
const AddressFormModal: React.FC<{
    address?: Address | null;
    user: User;
    onClose: () => void;
    onSave: () => void;
}> = ({ address, user, onClose, onSave }) => {
    const [formData, setFormData] = useState<Partial<AddressInsert>>({
        address_line_1: address?.address_line_1 || '',
        address_line_2: address?.address_line_2 || '',
        city: address?.city || '',
        state: address?.state || '',
        postal_code: address?.postal_code || '',
        country: address?.country || 'India',
        phone_number: address?.phone_number || '',
        user_id: user.id
    });
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
            alert('Please enter a valid 10-digit mobile number.');
            return;
        }
        setIsSaving(true);
        
        let error;
        if (address) {
            // Update
            const { user_id, ...updateData } = formData;
            const { error: updateError } = await supabase!.from('addresses').update(updateData).eq('id', address.id);
            error = updateError;
        } else {
            // Insert
            const { error: insertError } = await supabase!.from('addresses').insert(formData as AddressInsert);
            error = insertError;
        }

        if (error) {
            console.error('Error saving address:', error);
            alert(`Failed to save address: ${error.message}`);
        } else {
            onSave();
            onClose();
        }
        setIsSaving(false);
    };
    
    const inputStyles = "mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2 px-3 focus:ring-hav-forest focus:border-hav-forest bg-white";

    return (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
            <div className="bg-white rounded-lg shadow-2xl p-6 w-full max-w-lg" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-2xl font-serif font-bold text-hav-orange-900">{address ? 'Edit Address' : 'Add New Address'}</h3>
                    <button onClick={onClose} className="p-2 rounded-full hover:bg-gray-100"><XIcon className="w-5 h-5"/></button>
                </div>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="address_line_1" className="block text-sm font-medium">Address Line 1</label>
                        <input type="text" name="address_line_1" value={formData.address_line_1} onChange={handleChange} required className={inputStyles} />
                    </div>
                    <div>
                        <label htmlFor="address_line_2" className="block text-sm font-medium">Address Line 2 (Optional)</label>
                        <input type="text" name="address_line_2" value={formData.address_line_2 || ''} onChange={handleChange} className={inputStyles} />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="city" className="block text-sm font-medium">City</label>
                            <input type="text" name="city" value={formData.city} onChange={handleChange} required className={inputStyles} />
                        </div>
                         <div>
                            <label htmlFor="state" className="block text-sm font-medium">State</label>
                            <input type="text" name="state" value={formData.state} onChange={handleChange} required className={inputStyles} />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label htmlFor="postal_code" className="block text-sm font-medium">Postal Code</label>
                            <input type="text" name="postal_code" value={formData.postal_code} onChange={handleChange} required className={inputStyles} />
                        </div>
                         <div>
                            <label htmlFor="country" className="block text-sm font-medium">Country</label>
                            <input type="text" name="country" value={formData.country} onChange={handleChange} required className={inputStyles} />
                        </div>
                    </div>
                    <div>
                        <label htmlFor="phone_number" className="block text-sm font-medium">Mobile Number</label>
                        <input 
                            type="tel" 
                            name="phone_number" 
                            value={formData.phone_number || ''} 
                            onChange={handleChange} 
                            required 
                            pattern="[0-9]{10}"
                            title="Please enter a valid 10-digit mobile number"
                            className={inputStyles} 
                        />
                    </div>
                    <div className="mt-6 flex justify-end gap-3">
                        <button type="button" onClick={onClose} className="bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold py-2 px-4 rounded-full transition-colors border border-gray-300">Cancel</button>
                        <button type="submit" disabled={isSaving} className="bg-hav-forest hover:bg-hav-forest/90 text-hav-gold font-bold py-2 px-6 rounded-full transition-colors disabled:bg-gray-400">
                            {isSaving ? 'Saving...' : 'Save Address'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};


const ProfilePage: React.FC<ProfilePageProps> = ({ user, onLogout, updateOrderStatus, navigateTo, addToCart, products }) => {
  const [activeTab, setActiveTab] = useState<ProfileTab>('orders');
  const [orders, setOrders] = useState<Order[]>([]);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<Address | null>(null);
  const [addingToCart, setAddingToCart] = useState(false);


  const fetchAllData = async () => {
      if (!user) return;
      setIsLoading(true);

      const fetchPromises: Promise<any>[] = [
        Promise.resolve(supabase!.from('orders').select('*').eq('user_id', user.id).order('created_at', { ascending: false })),
        Promise.resolve(supabase!.from('addresses').select('*').eq('user_id', user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false }))
      ];

      if (user.is_admin) {
      }

      const results = await Promise.allSettled(fetchPromises);
      
      results.forEach((res, index) => {
        if (res.status === 'fulfilled') {
          const { data, error } = res.value;
          if (error) {
            console.error(`Error fetching data at index ${index}:`, error);
            return;
          }
          if (index === 0) setOrders(data as Order[]);
          if (index === 1) setAddresses(data as Address[]);
        }
      });
      
      setIsLoading(false);
  };


  useEffect(() => {
    fetchAllData();

    const channel = supabase!
      .channel(`orders-changes-for-user-${user.id}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'orders', filter: `user_id=eq.${user.id}` },
        (payload) => setOrders(current => current.map(order => order.id === payload.new.id ? payload.new as Order : order))
      )
      .subscribe((status, err) => {
        if (status === 'SUBSCRIBED') {
        }
        if (status === 'CHANNEL_ERROR') {
          console.error('Real-time subscription error:', err);
        }
        if (status === 'TIMED_OUT') {
            console.warn('Real-time subscription timed out.');
        }
      });

    return () => {
      supabase!.removeChannel(channel);
    };
  }, [user]);
  
  const handleCancelOrder = (orderId: string) => {
    const order = orders.find(o => o.id === orderId);
    if (!order) return;

    const createdAt = new Date(order.created_at).getTime();
    const now = new Date().getTime();
    const diffInMinutes = (now - createdAt) / (1000 * 60);

    if (diffInMinutes > 30) {
        alert('Orders cannot be cancelled after 30 minutes of placement. Please contact support for assistance.');
        return;
    }

    if (window.confirm('Are you sure you want to cancel this order?')) {
        updateOrderStatus(orderId, 'Cancelled');
        setOrders(prev => prev.map(o => o.id === orderId ? {...o, status: 'Cancelled'} : o));
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (window.confirm('Are you sure you want to delete this address?')) {
        const { error } = await supabase!.from('addresses').delete().eq('id', addressId);
        if (error) {
            alert(`Failed to delete address: ${error.message}`);
        } else {
            setAddresses(prev => prev.filter(a => a.id !== addressId));
        }
    }
  };

  const handleSetDefaultAddress = async (addressId: string) => {
      const { error } = await supabase!.rpc('set_default_address', {
          p_user_id: user.id,
          p_address_id: addressId
      });

      if (error) {
          alert(`Failed to set default address: ${error.message}`);
      } else {
          setAddresses(prev => prev.map(a => ({ ...a, is_default: a.id === addressId })).sort((a,b) => (b.is_default ? 1 : 0) - (a.is_default ? 1: 0)));
      }
  };

  const handleBuyAgain = async (order: Order) => {
      if (addingToCart) return;
      setAddingToCart(true);
      try {
          for (const item of order.items) {
              const product = products.find(p => p.id === item.product_id);
              if (product) {
                  const variant = product.product_variants.find(v => v.id === item.variant_id);
                  if (variant && variant.stock_quantity >= item.quantity) {
                      await addToCart(product, variant, item.quantity);
                  }
              }
          }
          navigateTo('checkout');
      } catch (e) {
          console.error("Error adding items to cart", e);
      } finally {
          setAddingToCart(false);
      }
  };


  const getStatusDisplay = (status: Order['status']) => {
    switch (status) {
      case 'Processing': 
        return { 
          color: 'text-blue-600 bg-blue-50 border-blue-200', 
          symbol: '🍳', 
          label: 'Cooking...', 
          desc: 'Our kitchen is preparing your traditional treats.' 
        };
      case 'Payment Received': 
        return { 
          color: 'text-purple-600 bg-purple-50 border-purple-200', 
          symbol: '💰', 
          label: 'Paid', 
          desc: 'Payment confirmed. Moving to the kitchen soon.' 
        };
      case 'Shipped': 
        return { 
          color: 'text-yellow-600 bg-yellow-50 border-yellow-200', 
          symbol: '🚚', 
          label: 'On the Way', 
          desc: 'Your package is out for delivery!' 
        };
      case 'Delivered': 
        return { 
          color: 'text-green-600 bg-green-50 border-green-200', 
          symbol: '🏠', 
          label: 'Delivered', 
          desc: 'Enjoy your handcrafted Havikar products!' 
        };
      case 'Cancelled': 
        return { 
          color: 'text-red-600 bg-red-50 border-red-200', 
          symbol: '❌', 
          label: 'Cancelled', 
          desc: 'This order was cancelled.' 
        };
      default: return { color: 'text-gray-600 bg-gray-50 border-gray-200', symbol: '•', label: status, desc: '' };
    }
  };

  const TabButton: React.FC<{ tab: ProfileTab; label: string }> = ({ tab, label }) => (
    <button
      onClick={() => setActiveTab(tab)}
      className={`px-4 py-2 font-semibold transition-colors rounded-md ${
        activeTab === tab ? 'bg-hav-forest text-hav-gold' : 'text-hav-brown hover:bg-hav-orange-100'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-hav-orange-50 min-h-screen py-12">
      {isAddressModalOpen && (
        <AddressFormModal 
            address={editingAddress}
            user={user}
            onClose={() => { setIsAddressModalOpen(false); setEditingAddress(null); }}
            onSave={fetchAllData}
        />
      )}
      <div className="container mx-auto px-4">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8">
            <div className="flex flex-col md:flex-row items-center gap-6">
                <div>
                    <h1 className="text-4xl font-serif font-bold text-hav-orange-900">Welcome, {user.name}!</h1>
                    <p className="text-hav-brown">{user.email}</p>
                </div>
                {/* Wallet Badge */}
                <div 
                    onClick={() => setActiveTab('rewards')}
                    className="cursor-pointer bg-hav-forest text-hav-gold px-6 py-3 rounded-2xl border border-hav-gold/30 shadow-lg flex flex-col items-center justify-center min-w-[140px] hover:scale-105 transition-transform"
                >
                    <span className="text-[10px] font-black uppercase tracking-widest opacity-80">Wallet Balance</span>
                    <span className="text-2xl font-black">₹{user.reward_points}</span>
                </div>
            </div>
            <div className="flex flex-wrap items-center justify-center md:justify-end gap-3 mt-6 md:mt-0">
                 {user.is_admin && (
                    <>
                        <a
                            href="https://admin.havikar.com"
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-hav-forest hover:bg-hav-forest/90 text-hav-gold font-bold py-2 px-4 md:px-6 rounded-full transition-colors shadow-md border border-hav-gold/20 flex items-center justify-center text-center text-sm md:text-base"
                        >
                            Admin Panel
                        </a>
                    </>
                 )}
                <button
                    onClick={onLogout}
                    className="bg-hav-orange-200 hover:bg-hav-orange-300 text-hav-orange-800 font-bold py-2 px-6 rounded-full transition-colors text-sm md:text-base"
                >
                    Logout
                </button>
            </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-lg">
            <div className="flex flex-wrap gap-2 border-b border-hav-orange-200 pb-4 mb-4">
                <TabButton tab="orders" label="My Orders" />
                <TabButton tab="wishlist" label="My Wishlist" />
                <TabButton tab="addresses" label="My Addresses" />
                <TabButton tab="rewards" label="My Wallet" />
                <TabButton tab="details" label="My Details" />
            </div>

            <div>
                 {isLoading ? (
                    <p>Loading...</p>
                 ) : activeTab === 'orders' ? (
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-hav-orange-800 mb-4">Order History</h2>
                        {orders.length > 0 ? (
                            <div className="space-y-6">
                                {orders.map(order => (
                                    <div key={order.id} className="border border-hav-orange-200 rounded-lg p-4 bg-hav-orange-50">
                                        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-2">
                                            <div>
                                                <p className="font-bold text-hav-orange-900 text-sm">Order #{order.order_number}</p>
                                                <p className="text-sm text-gray-500">Date: {new Date(order.created_at).toLocaleString()}</p>
                                                {order.payment_method && <p className="text-sm text-gray-500">Paid via: {order.payment_method}</p>}
                                            </div>
                                            <div className="mt-2 md:mt-0 flex flex-col md:flex-row items-end md:items-center gap-4">
                                                <div className="text-right">
                                                    <p className="font-black text-2xl text-hav-forest">₹{(order.total ?? 0).toFixed(2)}</p>
                                                    <div className={`mt-1 flex items-center gap-2 px-3 py-1 rounded-full border ${getStatusDisplay(order.status).color}`}>
                                                        <span className="text-lg">{getStatusDisplay(order.status).symbol}</span>
                                                        <span className="text-xs font-black uppercase tracking-widest">{getStatusDisplay(order.status).label}</span>
                                                    </div>
                                                </div>
                                                <div className="flex gap-2">
                                                    {order.status === 'Processing' && (
                                                        <button onClick={() => handleCancelOrder(order.id)} className="bg-red-500 text-white px-4 py-2 text-xs font-black uppercase tracking-widest rounded-full hover:bg-red-600 transition-colors shadow-sm">Cancel</button>
                                                    )}
                                                    <button 
                                                        onClick={() => handleBuyAgain(order)} 
                                                        disabled={addingToCart}
                                                        className="bg-hav-forest text-hav-gold px-6 py-2 text-xs font-black uppercase tracking-widest rounded-full hover:brightness-110 transition-all border border-hav-gold/30 disabled:opacity-50 shadow-md"
                                                    >
                                                        {addingToCart ? '...' : 'Buy Again'}
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                        <p className="text-[10px] text-hav-olive/60 mt-1 mb-4 italic">{getStatusDisplay(order.status).desc}</p>
                                        {order.points_redeemed > 0 && (
                                            <div className="text-sm text-green-600 my-2 bg-green-50 p-2 rounded-md">
                                                You saved ₹{(order.points_redeemed ?? 0).toFixed(2)} with wallet balance!
                                            </div>
                                        )}
                                        <div className="border-t border-hav-orange-100 mt-2 pt-2">
                                            {order.items.map((item, index) => <OrderItem key={`${item.product_id}-${index}`} item={item}/>)}
                                        </div>
                                        {(order.payment_id || order.courier_name || order.tracking_number) && (
                                            <div className="border-t border-hav-orange-100 mt-4 pt-3 text-sm">
                                                <h4 className="font-semibold text-hav-brown mb-2">Shipment & Payment Details</h4>
                                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-hav-brown">
                                                    {order.payment_id && <div><span className="font-semibold text-hav-brown/80">Payment ID:</span> {order.payment_id}</div>}
                                                    {order.courier_name && <div><span className="font-semibold text-hav-brown/80">Courier:</span> {order.courier_name}</div>}
                                                    {order.tracking_number && <div><span className="font-semibold text-hav-brown/80">Tracking #:</span> {order.tracking_number}</div>}
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                ))}
                            </div>
                        ) : <p className="text-hav-brown">You haven't placed any orders yet.</p>}
                    </div>
                ) : activeTab === 'addresses' ? (
                     <div>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-2xl font-serif font-bold text-hav-orange-800">My Addresses</h2>
                            <button onClick={() => setIsAddressModalOpen(true)} className="bg-hav-forest text-hav-gold hover:bg-hav-forest/90 font-bold py-2 px-6 rounded-full transition-colors shadow-md border border-hav-gold/20">+ Add New</button>
                        </div>
                         {addresses.length > 0 ? (
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                {addresses.map(addr => (
                                    <div key={addr.id} className={`p-4 rounded-lg border-2 ${addr.is_default ? 'border-hav-forest bg-hav-orange-50' : 'border-hav-orange-200 bg-white'}`}>
                                        {addr.is_default && <span className="text-xs font-bold bg-hav-forest text-hav-gold px-2 py-1 rounded-full">Default</span>}
                                        <p className="font-semibold text-hav-brown mt-2">{addr.address_line_1}</p>
                                        {addr.address_line_2 && <p className="text-hav-brown">{addr.address_line_2}</p>}
                                        <p className="text-hav-brown">{addr.city}, {addr.state} - {addr.postal_code}</p>
                                        <div className="mt-4 flex gap-2">
                                            <button onClick={() => { setEditingAddress(addr); setIsAddressModalOpen(true); }} className="text-sm font-semibold text-hav-orange-700 hover:underline">Edit</button>
                                            <span className="text-gray-300">|</span>
                                            <button onClick={() => handleDeleteAddress(addr.id)} className="text-sm font-semibold text-red-600 hover:underline">Delete</button>
                                            {!addr.is_default && <>
                                                <span className="text-gray-300">|</span>
                                                <button onClick={() => handleSetDefaultAddress(addr.id)} className="text-sm font-semibold text-green-700 hover:underline">Set as Default</button>
                                            </>}
                                        </div>
                                    </div>
                                ))}
                            </div>
                         ) : <p className="text-hav-brown">You haven't saved any addresses yet.</p>}
                    </div>
                ) : activeTab === 'wishlist' ? (
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-hav-orange-800 mb-4">My Wishlist</h2>
                        <p className="text-hav-brown">
                            Click <button onClick={() => navigateTo('wishlist')} className="font-bold text-hav-orange-600 hover:underline">here</button> to view your saved items.
                        </p>
                    </div>
                ) : activeTab === 'rewards' ? (
                    <div>
                        <h2 className="text-2xl font-serif font-bold text-hav-orange-800 mb-4">My Wallet</h2>
                        <div className="bg-gradient-to-br from-hav-forest to-hav-orange-800 text-hav-gold p-8 rounded-xl shadow-xl text-center border border-hav-gold/30">
                            <p className="text-xl text-hav-gold/90">Available Balance</p>
                            <p className="text-7xl font-black my-2 text-hav-gold">₹{user.reward_points}</p>
                            <p className="text-xl text-hav-gold/90">Wallet Cash</p>
                            <p className="text-sm mt-4 text-hav-gold/70">Use this balance to pay for your next delicious meal!</p>
                        </div>
                    </div>
                ) : activeTab === 'details' ? (
                     <div>
                        <h2 className="text-2xl font-serif font-bold text-hav-orange-800 mb-4">Account Details</h2>
                        <div className="space-y-4 max-w-md">
                            <div>
                                <label className="text-sm font-medium text-hav-brown">Name</label>
                                <p className="p-2 border border-hav-orange-200 rounded-md bg-hav-orange-50">{user.name}</p>
                            </div>
                             <div>
                                <label className="text-sm font-medium text-hav-brown">Email</label>
                                <p className="p-2 border border-hav-orange-200 rounded-md bg-hav-orange-50">{user.email}</p>
                            </div>
                            {user.mobile && (
                                <div>
                                    <label className="text-sm font-medium text-hav-brown">Mobile Number</label>
                                    <p className="p-2 border border-hav-orange-200 rounded-md bg-hav-orange-50">{user.mobile}</p>
                                </div>
                            )}
                            <button onClick={() => alert("Edit details functionality coming soon!")} className="text-hav-orange-600 hover:text-hav-orange-800 font-semibold">Edit Details</button>
                        </div>

                        <div className="mt-12 pt-8 border-t border-hav-orange-100">
                            <h3 className="text-xl font-serif font-bold text-hav-orange-800 mb-6">Security</h3>
                            <div className="max-w-md space-y-4">
                                <p className="text-sm text-hav-brown mb-4">Update your password to keep your account secure.</p>
                                <button 
                                    onClick={async () => {
                                        const newPassword = window.prompt("Enter your new password:");
                                        if (newPassword && newPassword.length >= 6) {
                                            const { error } = await supabase!.auth.updateUser({ password: newPassword });
                                            if (error) alert(`Error: ${error.message}`);
                                            else alert("Password updated successfully!");
                                        } else if (newPassword) {
                                            alert("Password must be at least 6 characters long.");
                                        }
                                    }}
                                    className="bg-white border-2 border-hav-orange-200 text-hav-forest font-bold py-3 px-8 rounded-full hover:bg-hav-orange-50 transition-all"
                                >
                                    Change Password
                                </button>
                            </div>
                        </div>
                    </div>
                ) : null}
            </div>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;