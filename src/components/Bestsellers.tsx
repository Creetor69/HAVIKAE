import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Page, PageContext, Product } from '../types';
import DiscountDisplay from './DiscountDisplay';

interface ProductCardDisplay {
  id: string;
  name: string;
  tagline: string;
  imageUrl: string;
  product: Product;
}

const ProductCard: React.FC<{ cardData: ProductCardDisplay; navigateTo: (page: Page, context?: PageContext) => void; onQuickView: (product: Product) => void; }> = ({ cardData, navigateTo, onQuickView }) => {
  const variants = cardData.product.product_variants || [];
  const minPriceVariant = variants.length > 0 ? variants.reduce((min, v) => v.price < min.price ? v : min, variants[0]) : null;

  const handleQuickViewClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onQuickView(cardData.product);
  };
  
  return (
  <div className="bg-white rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.1),0_0_10px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.8)] transition-all duration-500 transform hover:-translate-y-2 group flex flex-col h-full border-2 border-white/50 hover:border-hav-gold min-h-[220px] md:min-h-[280px] relative">
    <div className="absolute top-2 left-2 z-30 bg-red-600 text-white text-[9px] font-black uppercase tracking-wider py-1 px-2 rounded-full shadow-md">Bestseller</div>
    <div className="relative cursor-pointer p-2 md:p-2 bg-white aspect-square flex items-center justify-center" onClick={() => navigateTo('product', { productId: cardData.id })}>
        <div className="absolute inset-0 bg-white opacity-100"></div>
        <img 
            src={cardData.imageUrl} 
            alt={`Havikar ${cardData.name}`} 
            className="w-full h-full object-contain relative z-10 transition-transform duration-500 group-hover:scale-110 brightness-100 contrast-110 drop-shadow-[0_8px_16px_rgba(0,0,0,0.1)]" 
            loading="lazy"
            decoding="async"
            width="140"
            height="140"
        />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
            <button 
                onClick={handleQuickViewClick} 
                className="bg-white/20 backdrop-blur-md text-hav-forest font-bold py-2 px-6 rounded-full shadow-xl transform scale-90 hover:scale-100 transition-all border border-white/40"
            >
                Quick View
            </button>
        </div>
    </div>
    <div className="p-2 md:p-3 flex flex-col flex-grow bg-white relative z-10 text-center justify-center">
      <h3 className="text-xs md:text-base font-serif font-bold text-hav-forest group-hover:text-hav-gold transition-colors leading-tight mb-1 line-clamp-1">{cardData.name}</h3>
      
      {minPriceVariant && (
          <div className="my-1">
              <DiscountDisplay price={minPriceVariant.price} mrp={minPriceVariant.mrp} size="small" className="text-hav-forest font-black text-sm md:text-lg" />
          </div>
      )}

      <div className="mt-2 pt-2 border-t border-hav-gold/10">
          <button 
              onClick={(e) => { e.stopPropagation(); navigateTo('product', { productId: cardData.id }); }} 
              className="w-full bg-hav-gold text-white font-black py-1.5 md:py-2 rounded-full text-[9px] md:text-[10px] uppercase tracking-[0.2em] hover:shadow-lg hover:brightness-110 transition-all duration-300 transform active:scale-95 border border-hav-gold shadow-md"
          >
            Buy Now
          </button>
      </div>
    </div>
  </div>
  )
};

interface BestsellersProps {
  navigateTo: (page: Page, context?: PageContext) => void;
  products: Product[];
  openQuickView: (product: Product) => void;
}

const Bestsellers: React.FC<BestsellersProps> = ({ navigateTo, products, openQuickView }) => {
  const bestsellers = products.filter(p => p.is_bestseller);

  if (bestsellers.length === 0) {
    return null;
  }

  const currentProducts = bestsellers.slice(0, 4).map(p => ({
    id: p.slug || p.id,
    name: p.name,
    tagline: p.tagline,
    imageUrl: p.image_urls[0],
    product: p,
  }));

  return (
    <section className="py-8 md:py-12 bg-transparent relative overflow-hidden mb-8">
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8">
            <span className="text-red-500 font-black tracking-[0.3em] uppercase text-[12px] mb-2 block flex items-center justify-center gap-2">
                <span className="w-12 h-px bg-red-400"></span>
                Most Loved Products
                <span className="w-12 h-px bg-red-400"></span>
            </span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-hav-forest tracking-tighter">Bestsellers</h2>
        </div>
        
        <div className="max-w-[1600px] mx-auto min-h-[15rem]">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8">
                {currentProducts.map((product) => (
                    <ProductCard key={product.id} cardData={product} navigateTo={navigateTo} onQuickView={openQuickView}/>
                ))}
            </div>
        </div>
      </div>
    </section>
  );
};

export default Bestsellers;
