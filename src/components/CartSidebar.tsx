import React, { useMemo, useState, useEffect } from 'react';
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
  storeSettings?: any;
}

const CartItemCard: React.FC<{ item: CartItem; updateCartQuantity: CartSidebarProps['updateCartQuantity']; removeFromCart: CartSidebarProps['removeFromCart']; }> = ({ item, updateCartQuantity, removeFromCart }) => {
    const isFreeGift = item.variantId === 'free-surprise-gift-variant';
    const canIncrease = item.quantity < item.stock_quantity;
    
    return (
        <div className={`flex items-center py-4 transition-all duration-300 animate-fadeIn ${isFreeGift ? 'bg-orange-50/50 p-2 rounded-xl border border-dashed border-hav-orange-200 my-2' : ''}`}>
            <img src={item.imageUrl} alt={`Havikar ${item.name}`} className="w-16 h-16 object-contain mix-blend-multiply rounded-xl bg-hav-cream/30 p-1 mr-4 border border-hav-gold/10" />
            <div className="flex-grow">
                <p className="font-bold text-hav-forest text-sm leading-tight flex items-center gap-1.5">
                    {item.name}
                    {isFreeGift && <span className="bg-hav-orange-500 text-white text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded animate-pulse">Gift</span>}
                </p>
                <p className="text-xs text-hav-olive mt-1">{item.net_weight} • {isFreeGift ? <span className="line-through text-gray-400">₹149.00</span> : ''} ₹{(item.price ?? 0).toFixed(2)}</p>
                
                {!isFreeGift ? (
                    <>
                        <div className="flex items-center mt-2 bg-white border border-hav-gold/20 rounded-lg w-fit overflow-hidden shadow-xs">
                            <button onClick={() => updateCartQuantity(item.variantId, item.quantity - 1)} className="px-2 py-0.5 font-bold text-hav-forest hover:bg-hav-cream transition-colors border-r border-hav-gold/20">-</button>
                            <span className="px-3 py-0.5 text-xs font-bold text-hav-forest">{item.quantity}</span>
                            <button 
                                onClick={() => updateCartQuantity(item.variantId, item.quantity + 1)} 
                                className="px-2 py-0.5 font-bold text-hav-forest hover:bg-hav-cream transition-colors border-l border-hav-gold/20 disabled:text-gray-300" 
                                disabled={!canIncrease}
                            >+</button>
                        </div>
                        {item.stock_quantity > 0 && item.stock_quantity <= 15 ? (
                            <p className="text-[9px] text-[#A24419] font-black mt-1.5 uppercase tracking-wide font-sans animate-pulse">
                                ⚡ Only {item.stock_quantity} left of this week's freshly ground batch!
                            </p>
                        ) : (
                            <p className="text-[8px] text-gray-400 font-bold mt-1 uppercase tracking-wide">
                                ✓ Freshly batched & packed in heritage container
                            </p>
                        )}
                    </>
                ) : (
                    <span className="text-[10px] text-hav-orange-600 font-semibold mt-1 inline-block">🎁 Automatically added to your order!</span>
                )}
            </div>
            <div className="text-right ml-2">
                 <p className="font-black text-hav-forest text-sm">{isFreeGift ? 'FREE' : `₹${((item.price ?? 0) * (item.quantity ?? 0)).toFixed(2)}`}</p>
                 {item.mrp && item.mrp > item.price && !isFreeGift && (
                    <s className="text-[10px] text-gray-400">₹{((item.mrp || 0) * item.quantity).toFixed(2)}</s>
                 )}
                 {!isFreeGift && (
                     <button onClick={() => removeFromCart(item.variantId)} className="text-[10px] font-bold text-red-500 hover:text-red-700 mt-2 block w-full text-right uppercase tracking-tighter">Remove</button>
                 )}
            </div>
        </div>
    );
}

const CartSidebar: React.FC<CartSidebarProps> = ({ isOpen, toggleCart, cart, updateCartQuantity, removeFromCart, navigateToCheckout, storeSettings }) => {
  const subtotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  return (
    <>
      <div 
        className={`fixed inset-0 bg-hav-forest/50 backdrop-blur-xs z-[60] transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={toggleCart}
      />
      <div 
        className={`fixed top-0 right-0 h-full w-full max-w-md bg-hav-cream shadow-[-10px_0_30px_rgba(0,0,0,0.15)] z-[70] transform transition-transform duration-300 ease-out ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        <div className="flex flex-col h-full bg-white">
            <div className="flex justify-between items-center p-4 border-b border-hav-gold/15 bg-hav-forest text-hav-gold shadow-sm">
                <div>
                    <h2 className="text-lg font-serif font-bold text-white">Your Bag</h2>
                    <p className="text-[10px] uppercase font-bold tracking-wider text-hav-wheat mt-0.5">{cart.length} items selected</p>
                </div>
                <button onClick={toggleCart} className="p-1.5 rounded-full hover:bg-white/10 text-hav-gold transition-colors cursor-pointer">
                    <XIcon className="w-5 h-5"/>
                </button>
            </div>
            
            {cart.length > 0 ? (
                <>
                    {/* Compact quick shipping notice */}
                    <div className="bg-hav-cream/30 px-4 py-2 border-b border-hav-gold/10 text-center text-[11px] text-hav-olive font-medium flex items-center justify-center gap-1.5">
                        <span>🚚</span>
                        <span>Enjoy free priority shipping on orders over ₹799!</span>
                    </div>

                    <div className="flex-grow overflow-y-auto px-4 divide-y divide-gray-150">
                       {cart.map(item => (
                           <CartItemCard key={item.variantId} item={item} updateCartQuantity={updateCartQuantity} removeFromCart={removeFromCart} />
                       ))}
                    </div>

                    <div className="p-5 border-t border-hav-gold/15 bg-hav-cream/10">
                        <div className="space-y-1.5 mb-4">
                            <div className="flex justify-between items-center text-hav-forest">
                                <span className="text-xs font-semibold uppercase tracking-wider opacity-80">Estimated Total</span>
                                <span className="text-sm font-black">₹{(subtotal ?? 0).toFixed(2)}</span>
                            </div>
                            <div className="bg-hav-gold/5 text-hav-olive text-[10px] font-bold py-1 px-2 rounded border border-hav-gold/10 text-center tracking-tight">
                                ✨ Instant discounts & coupons available on Cart Page
                            </div>
                        </div>

                        <button
                          onClick={() => {
                              toggleCart();
                              navigateToCheckout(); // This will navigate to checkout. Wait, we want to route to 'cart' instead! We will hook this up in App.tsx
                          }}
                          className="w-full bg-[#0F4A3C] hover:bg-[#135948] text-hav-gold font-black py-3 rounded-full transition-all transform hover:scale-[1.01] active:scale-95 shadow-md uppercase tracking-wider text-xs cursor-pointer flex items-center justify-center gap-2"
                        >
                          View Bag & Apply Offers ➜
                        </button>
                        
                        <button
                          onClick={toggleCart}
                          className="w-full text-center mt-3 text-gray-500 hover:text-hav-forest font-bold py-1 transition-colors uppercase tracking-wider text-[10px]"
                        >
                          Continue Shopping
                        </button>
                    </div>
                </>
            ) : (
                <div className="flex-grow flex flex-col items-center justify-center text-center p-8">
                    <div className="w-16 h-16 bg-hav-orange-50 rounded-full flex items-center justify-center mb-4">
                        <ShoppingCartIcon className="w-8 h-8 text-hav-gold opacity-80"/>
                    </div>
                    <h3 className="text-xl font-serif font-bold text-hav-forest">Your bag is empty</h3>
                    <p className="text-hav-olive/70 text-xs mt-1.5 max-w-[200px]">Add our traditional, freshly batched podis to kickstart your order!</p>
                    <button 
                        onClick={toggleCart}
                        className="mt-6 bg-hav-forest text-hav-gold font-bold py-2.5 px-6 rounded-full text-xs uppercase tracking-wider shadow-md hover:bg-hav-olive transition-all cursor-pointer"
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