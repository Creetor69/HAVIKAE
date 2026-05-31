import React, { useMemo } from 'react';
import type { CartItem } from '../types';
import XIcon from './icons/XIcon';
import ShoppingCartIcon from './icons/ShoppingCartIcon';

interface CartSidebarProps {
  isOpen: boolean;
  toggleCart: () => void;
  cart: CartItem[];
  updateCartQuantity: (variantId: string, newQuantity: number) => void;
  removeFromCart: (variantId: string) => void;
  navigateToCheckout: () => void;
}

const CartItemCard: React.FC<{ item: CartItem; updateCartQuantity: CartSidebarProps['updateCartQuantity']; removeFromCart: CartSidebarProps['removeFromCart']; }> = ({ item, updateCartQuantity, removeFromCart }) => {
    const canIncrease = item.quantity < item.stock_quantity;
    
    return (
        <div className="flex items-center py-5 transition-all duration-300 animate-fadeIn">
            <img src={item.imageUrl} alt={`Havikar ${item.name}`} className="w-20 h-20 object-contain mix-blend-multiply rounded-xl bg-hav-cream/30 p-2 mr-4 border border-hav-gold/10" />
            <div className="flex-grow">
                <p className="font-bold text-hav-forest text-sm leading-tight">{item.name}</p>
                <p className="text-xs text-hav-olive mt-1">{item.net_weight} • ₹{(item.price ?? 0).toFixed(2)}</p>
                <div className="flex items-center mt-3 bg-white border border-hav-gold/20 rounded-lg w-fit overflow-hidden">
                    <button onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)} className="px-3 py-1 font-bold text-hav-forest hover:bg-hav-cream transition-colors border-r border-hav-gold/20">-</button>
                    <span className="px-4 py-1 text-xs font-bold text-hav-forest">{item.quantity}</span>
                    <button 
                        onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)} 
                        className="px-3 py-1 font-bold text-hav-forest hover:bg-hav-cream transition-colors border-l border-hav-gold/20 disabled:text-gray-300" 
                        disabled={!canIncrease}
                    >+</button>
                </div>
            </div>
            <div className="text-right ml-2">
                 <p className="font-black text-hav-forest text-sm">₹{((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}</p>
                 {item.mrp && item.mrp > item.price && (
                    <s className="text-[10px] text-gray-400">₹{((item.mrp || 0) * item.quantity).toFixed(2)}</s>
                 )}
                 <button onClick={() => removeFromCart(item.variantId)} className="text-[10px] font-bold text-red-500 hover:text-red-700 mt-2 block w-full text-right uppercase tracking-tighter">Remove</button>
            </div>
        </div>
    );
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, toggleCart, cart, updateCartQuantity, removeFromCart, navigateToCheckout }) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const totalGstIncluded = useMemo(() => {
    return cart.reduce((sum, item) => {
        const gstDecimal = item.gst_rate / 100;
        const totalItemPrice = item.price * item.quantity;
        const basePrice = totalItemPrice / (1 + gstDecimal);
        const gstAmount = totalItemPrice - basePrice;
        return sum + gstAmount;
    }, 0);
  }, [cart]);
  
  return (
    <>
      <div 
        className={`fixed inset-0 bg-hav-forest/60 backdrop-blur-sm z-[60] transition-opacity duration-500 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleCart}
      />
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-hav-cream shadow-[-10px_0_30px_rgba(0,0,0,0.1)] z-[70] transform transition-transform duration-500 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full">
            <div className="flex justify-between items-center p-4 border-b border-hav-gold/20 bg-hav-forest text-hav-gold shadow-md">
                <div>
                    <h2 className="text-xl font-serif font-bold">Your Bag</h2>
                    <p className="text-[9px] uppercase font-bold tracking-widest text-hav-gold/70 mt-0.5">{cart.length} items selected</p>
                </div>
                <button onClick={toggleCart} className="p-1.5 rounded-full hover:bg-white/10 text-hav-gold transition-colors">
                    <XIcon className="w-6 h-6"/>
                </button>
            </div>
            
            {cart.length > 0 ? (
                <>
                    <div className="flex-grow overflow-y-auto p-4 divide-y divide-hav-gold/10">
                       {cart.map(item => (
                           <CartItemCard key={item.variantId} item={item} updateCartQuantity={updateCartQuantity} removeFromCart={removeFromCart} />
                       ))}
                    </div>

                    <div className="p-4 border-t border-hav-gold/20 bg-white shadow-[0_-10px_30px_rgba(0,0,0,0.05)]">
                        <div className="space-y-1 mb-4">
                            <div className="flex justify-between items-center text-hav-forest">
                                <span className="text-[10px] font-semibold opacity-70 uppercase tracking-tighter">Total GST Included</span>
                                <span className="text-[10px] font-bold">₹{(totalGstIncluded ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="flex justify-between items-center font-black text-lg text-hav-forest">
                                <span>Subtotal</span>
                                <span>₹{(subtotal ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="bg-hav-gold/5 text-hav-forest text-[9px] font-bold py-1 px-2 rounded border border-hav-gold/10 text-center tracking-tight">
                                ✨ Shipping & taxes calculated at checkout
                            </div>
                        </div>

                        <button
                          onClick={navigateToCheckout}
                          className="w-full bg-hav-forest text-hav-gold font-black py-2.5 rounded-full transition-all transform hover:scale-[1.02] active:scale-95 shadow-lg hover:shadow-hav-gold/10 uppercase tracking-widest text-[10px]"
                        >
                          Checkout Now
                        </button>
                        
                        <button
                          onClick={toggleCart}
                          className="w-full text-center mt-2 text-hav-forest/60 font-bold py-1 hover:text-hav-forest transition-colors uppercase tracking-tighter text-[9px]"
                        >
                          Continue Browsing
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                    <div className="w-24 h-24 bg-hav-orange-50 rounded-full flex items-center justify-center mb-6">
                        <ShoppingCartIcon className="w-12 h-12 text-hav-gold opacity-50"/>
                    </div>
                    <h3 className="text-2xl font-serif font-bold text-hav-forest">Your bag is empty</h3>
                    <p className="text-hav-olive/70 mt-2 max-w-[200px]">Looks like you haven't added any authentic flavors yet!</p>
                    <button 
                        onClick={toggleCart}
                        className="mt-8 bg-hav-forest text-hav-gold font-bold py-3 px-8 rounded-full shadow-lg"
                    >
                        Explore Shop
                    </button>
                </div>
            )}
        </div>
      </div>
    </>
  );
};

export default CartSidebar;