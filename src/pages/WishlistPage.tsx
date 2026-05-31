
import React from 'react';
import { Product, CartItem, ProductVariant, Page, PageContext } from '../types';
import ProductCard from '../components/ProductCard';
import HeartIcon from '../components/icons/HeartIcon';

interface WishlistPageProps {
  wishlist: string[];
  products: Product[];
  navigateTo: (page: Page, context: PageContext) => void;
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  openQuickView: (product: Product) => void;
  addToCart: (product: Product, selectedVariant: ProductVariant, quantity?: number) => void;
  onBuyNow: (product: Product, selectedVariant: ProductVariant, quantity: number) => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ wishlist, products, navigateTo, addToWishlist, removeFromWishlist, openQuickView, addToCart, onBuyNow }) => {
  const wishlistedProducts = products.filter(product => wishlist.includes(product.id));

  return (
    <div className="bg-hav-cream min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-hav-orange-900 flex items-center justify-center gap-4">
            <HeartIcon className="w-12 h-12 text-red-400" />
            My Wishlist
          </h1>
          <p className="mt-2 text-lg text-hav-brown">Your favorite products, all in one place.</p>
        </div>

        {wishlistedProducts.length === 0 ? (
          <div className="text-center py-16">
            <h2 className="text-2xl font-semibold text-hav-orange-800">Your Wishlist is Empty</h2>
            <p className="text-hav-brown mt-2">Browse our products and click the heart icon to save items for later!</p>
            <button onClick={() => navigateTo('shop', {})} className="mt-6 bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg">
                Explore Products
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {wishlistedProducts.map(product => (
              <ProductCard
                key={product.id}
                product={product}
                navigateTo={navigateTo}
                isInWishlist={wishlist.includes(product.id)}
                onAddToWishlist={() => addToWishlist(product.id)}
                onRemoveFromWishlist={() => removeFromWishlist(product.id)}
                onQuickView={openQuickView}
                onAddToCart={addToCart}
                onBuyNow={onBuyNow}
              />
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default WishlistPage;
