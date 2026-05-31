import React, { memo } from 'react';
import type { Product, ProductVariant } from '../types';
import { Page, PageContext } from '../types';
import StarRating from './StarRating';
import HeartIcon from './icons/HeartIcon';
import CompareIcon from './icons/CompareIcon';
import DiscountDisplay from './DiscountDisplay';

interface ProductCardProps {
  product: Product;
  navigateTo: (page: Page, context: PageContext) => void;
  isInWishlist: boolean;
  onAddToWishlist: () => void;
  onRemoveFromWishlist: () => void;
  isInCompare?: boolean;
  onAddToCompare?: () => void;
  onQuickView: (product: Product) => void;
  onAddToCart: (product: Product, selectedVariant: ProductVariant, quantity: number) => void;
  onBuyNow: (product: Product, selectedVariant: ProductVariant, quantity: number) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ 
    product, 
    navigateTo, 
    isInWishlist, 
    onAddToWishlist, 
    onRemoveFromWishlist, 
    onQuickView, 
    onAddToCart, 
    onBuyNow 
}) => {
  
  const variants = product.product_variants || [];
  const isOutOfStock = variants.length === 0 || variants.every(v => v.stock_quantity <= 0);
  const minPriceVariant = variants.length > 0 ? variants.reduce((min, v) => v.price < min.price ? v : min, variants[0]) : null;
  
  const primaryVariant = variants.find(v => v.stock_quantity > 0) || variants[0];
  const hasMultipleVariants = variants.length > 1;

  const handleWishlistClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isInWishlist) onRemoveFromWishlist();
    else onAddToWishlist();
  };

  const handleAddToCartClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (hasMultipleVariants) onQuickView(product);
    else onAddToCart(product, primaryVariant, 1);
  };

  const handleBuyNowClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOutOfStock) return;
    if (hasMultipleVariants) onQuickView(product);
    else onBuyNow(product, primaryVariant, 1);
  };

  return (
    <div 
        className="bg-white border border-hav-gold/10 rounded-3xl overflow-hidden shadow-md hover:shadow-2xl hover:shadow-hav-gold/20 transition-all duration-500 transform hover:-translate-y-3 focus-within:-translate-y-3 focus-within:shadow-2xl focus-within:shadow-hav-gold/20 focus-within:ring-2 focus-within:ring-hav-gold/50 outline-none group flex flex-col cursor-pointer min-h-[220px] md:min-h-[320px]"
        onClick={() => navigateTo('product', { productId: product.slug || product.id })}
    >
      {/* Visual Header - Extra Compact */}
      <div className="relative p-2 md:p-2 bg-hav-cream/25 overflow-hidden">
        <div className="w-full h-16 md:h-32 flex items-center justify-center">
            <img 
                src={product.image_urls?.[0]} 
                alt={product.name} 
                className="w-full h-full object-contain mix-blend-multiply transition-transform duration-700 group-hover:scale-110" 
                loading="lazy" 
                decoding="async"
            />
        </div>
        
        {/* Floating Wishlist Icon */}
        <div className="absolute top-1 right-1 md:top-2 md:right-2 z-10">
            <button
                onClick={handleWishlistClick}
                className="p-1 md:p-1.5 bg-white/95 backdrop-blur-sm rounded-full shadow-sm hover:bg-white transition-all transform hover:scale-110 border border-hav-gold/10"
                aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
            >
                <HeartIcon className={`w-2.5 h-2.5 md:w-4 md:h-4 transition-colors ${isInWishlist ? 'text-red-500 fill-current' : 'text-hav-forest'}`}/>
            </button>
        </div>

        {/* Floating Badges */}
        <div className="absolute top-1 left-1 md:top-2 md:left-2 flex flex-col gap-0.5 z-10">
            {isOutOfStock ? (
                <span className="bg-red-600 text-white text-[5px] md:text-[8px] font-black px-1 md:px-2 py-0.5 rounded-full uppercase tracking-widest shadow-md">Sold Out</span>
            ) : product.is_vegan && (
                <span className="bg-hav-forest text-hav-gold text-[5px] md:text-[8px] font-black px-1 md:px-2 py-0.5 rounded-full uppercase tracking-widest border border-hav-gold/30 shadow-md">Vegan</span>
            )}
        </div>
      </div>

      {/* Content Area */}
      <div className="p-2 md:p-3 flex flex-col flex-grow bg-white text-center justify-center">
        <h3 className="text-xs md:text-base font-serif font-bold text-hav-forest group-hover:text-hav-gold transition-colors leading-tight mb-1 line-clamp-1">
            {product.name}
        </h3>
        
        {minPriceVariant && (
            <div className="my-1">
                <DiscountDisplay price={minPriceVariant.price} mrp={minPriceVariant.mrp} size="small" className="text-hav-forest font-black text-sm md:text-lg" />
            </div>
        )}

        <div className="mt-2 pt-2 border-t border-hav-gold/10">
            <button
                onClick={(e) => { e.stopPropagation(); navigateTo('product', { productId: product.slug || product.id }); }}
                className="w-full bg-hav-forest text-hav-gold font-black py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] uppercase tracking-[0.2em] hover:shadow-lg hover:brightness-110 transition-all duration-300 transform active:scale-95 border border-hav-forest shadow-md"
            >
                Shop Now
            </button>
        </div>
      </div>
    </div>
  );
};

export default memo(ProductCard);