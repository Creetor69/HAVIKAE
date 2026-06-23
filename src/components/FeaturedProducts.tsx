
import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Page, PageContext } from '../types';
import { Product } from '../types';
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
  <div className="bg-white rounded-2xl overflow-hidden shadow-[0_0_15px_rgba(0,0,0,0.1),0_0_10px_rgba(255,255,255,0.2)] hover:shadow-[0_0_40px_rgba(255,255,255,0.8)] transition-all duration-500 transform hover:-translate-y-2 group flex flex-col h-full border-2 border-white/50 hover:border-white min-h-[220px] md:min-h-[280px]">
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
            {/* Glass Morphism Button */}
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
              className="w-full bg-hav-forest text-white font-black py-1 md:py-1.5 rounded-full text-[8px] md:text-[9px] uppercase tracking-[0.2em] hover:shadow-lg hover:brightness-110 transition-all duration-300 transform active:scale-95 border border-hav-forest shadow-md"
          >
            Shop Now
          </button>
      </div>
    </div>
  </div>
  )
};

interface FeaturedProductsProps {
  navigateTo: (page: Page, context?: PageContext) => void;
  products: Product[];
  openQuickView: (product: Product) => void;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({ navigateTo, products, openQuickView }) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [startIndex, setStartIndex] = useState(0);
  const productsPerPage = 4;
  
  const categories: string[] = ['All'];
  products.forEach(p => {
    const catName = p.categories?.name;
    if (catName && !categories.includes(String(catName))) {
      categories.push(String(catName));
    }
  });
  
  const filteredProducts = selectedCategory === 'All' 
    ? products 
    : products.filter(p => p.categories?.name === selectedCategory);

  const numPages = Math.ceil(filteredProducts.length / productsPerPage);

  useEffect(() => {
    setStartIndex(0);
  }, [selectedCategory]);

  // Auto-scroll logic
  useEffect(() => {
    if (filteredProducts.length <= productsPerPage) return;

    let intervalId: number | null = null;

    const startTimer = () => {
        if (intervalId) clearInterval(intervalId);
        intervalId = window.setInterval(() => {
            setStartIndex(prevIndex => {
                const nextIndex = prevIndex + productsPerPage;
                return nextIndex >= filteredProducts.length ? 0 : nextIndex;
            });
        }, 4000); 
    };

    const stopTimer = () => {
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
    };

    const handleVisibilityChange = () => {
        if (document.hidden) {
            stopTimer();
        } else {
            startTimer();
        }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    startTimer();

    return () => {
        stopTimer();
        document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [filteredProducts.length, productsPerPage]);

  if (products.length === 0) {
    return null;
  }

  const currentProducts = filteredProducts.slice(startIndex, startIndex + productsPerPage).map(p => ({
    id: p.slug || p.id,
    name: p.name,
    tagline: p.tagline,
    imageUrl: p.image_urls[0],
    product: p,
  }));

  const handleDotClick = (pageIndex: number) => {
    setStartIndex(pageIndex * productsPerPage);
  };

  return (
    <section className="py-8 md:py-12 bg-transparent relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-hav-gold/50 to-transparent"></div>
      
      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-8">
            <span className="text-hav-gold font-bold tracking-[0.2em] uppercase text-[10px] mb-2 block">Handpicked Favorites</span>
            <h2 className="text-3xl md:text-5xl font-serif font-bold text-hav-forest tracking-tighter">Signature Collection</h2>
            <div className="w-16 h-1 bg-hav-gold mx-auto mt-4 rounded-full"></div>
        </div>

        {/* Category Filter */}
        <div className="flex flex-wrap justify-center gap-2 mb-8">
            {categories.map(cat => (
                <button
                    key={cat}
                    onClick={() => setSelectedCategory(cat)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                        selectedCategory === cat 
                        ? 'bg-hav-forest text-hav-gold shadow-lg scale-105' 
                        : 'bg-white text-hav-olive hover:bg-hav-gold/10 border border-hav-gold/20'
                    }`}
                >
                    {cat}
                </button>
            ))}
        </div>
        
        <div className="max-w-[1600px] mx-auto min-h-[15rem]">
            <AnimatePresence mode="wait">
                <motion.div
                    key={`${selectedCategory}-${startIndex}`}
                    className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-8"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 1.05 }}
                    transition={{ duration: 0.5, ease: 'easeOut' }}
                >
                    {currentProducts.map((product) => (
                        <ProductCard key={product.id} cardData={product} navigateTo={navigateTo} onQuickView={openQuickView}/>
                    ))}
                </motion.div>
            </AnimatePresence>
        </div>

        {/* Navigation Dots */}
        {numPages > 1 && (
            <div className="flex justify-center mt-12 space-x-4">
            {Array.from({ length: numPages }).map((_, pageIndex) => (
                <button
                key={pageIndex}
                onClick={() => handleDotClick(pageIndex)}
                className={`transition-all duration-300 rounded-full ${
                    Math.floor(startIndex / productsPerPage) === pageIndex
                    ? 'bg-hav-gold w-12 h-2'
                    : 'bg-hav-olive/20 w-2 h-2 hover:bg-hav-gold/60'
                }`}
                aria-label={`Go to product page ${pageIndex + 1}`}
                />
            ))}
            </div>
        )}
        
        <div className="text-center mt-16">
             <button onClick={() => navigateTo('shop')} className="inline-block border-b-2 border-hav-forest text-hav-forest font-bold pb-1 hover:text-hav-gold hover:border-hav-gold transition-all text-lg">
                View Full Catalog &rarr;
             </button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedProducts;
