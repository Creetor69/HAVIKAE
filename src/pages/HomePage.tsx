
import React, { Suspense } from 'react';
import FeaturedProducts from '../components/FeaturedProducts';
import Bestsellers from '../components/Bestsellers';
import { Page, PageContext } from '../types';
import ScrollingHero from '../components/ScrollingHero';
import ImageCarousel from '../components/ImageCarousel';
import InfiniteShelf from '../components/InfiniteShelf';
import { Product, PromotionalContent, Category, StoreSettings } from '../types';
import { motion } from 'motion/react';

// Lazy load sections for better performance
const WhyHavikar = React.lazy(() => import('../components/WhyHavikar'));
const Story = React.lazy(() => import('../components/Story'));
const Recipes = React.lazy(() => import('../components/Recipes'));
const Testimonials = React.lazy(() => import('../components/Testimonials'));
const SignatureDishes = React.lazy(() => import('../components/SignatureDishes'));
const MenuPreview = React.lazy(() => import('../components/MenuPreview'));

interface HomePageProps {
    navigateTo: (page: Page, context?: PageContext) => void;
    products: Product[];
    promotionalContent: PromotionalContent[];
    openQuickView: (product: Product) => void;
    categories: Category[];
    storeSettings: StoreSettings | null;
    addToCart?: (product: Product, selectedVariant: any, quantity?: number) => void;
}

const CategoryGrid: React.FC<{ categories: Category[]; navigateTo: (page: Page, context: PageContext) => void }> = ({ categories, navigateTo }) => {
    const [hoveredCategory, setHoveredCategory] = React.useState<string | null>(null);
    const scrollCategories = [...categories, ...categories, ...categories, ...categories];

    return (
        <section className="py-8 md:py-12 bg-transparent relative overflow-hidden flex flex-col justify-center transition-colors duration-700" style={{ backgroundColor: hoveredCategory ? 'rgba(201, 162, 54, 0.05)' : 'transparent' }}>
             {/* Background glow for the whole section */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] bg-hav-gold/5 rounded-full blur-[120px] pointer-events-none transition-opacity duration-700" style={{ opacity: hoveredCategory ? 1 : 0.5 }}></div>

            <div className="relative z-10">
                <div className="text-center mb-10 container mx-auto px-4">
                    <span className="text-hav-gold font-bold tracking-[0.3em] uppercase text-[8px] mb-2 block">Curated Selection</span>
                    <h2 className="text-3xl md:text-5xl font-serif font-bold text-hav-forest tracking-tighter">Our Collections</h2>
                    <div className="w-16 h-1 bg-hav-gold mx-auto mt-4 rounded-full"></div>
                </div>
                
                <div className="flex overflow-hidden">
                    <motion.div 
                        className="flex gap-8 px-4"
                        animate={{ x: ["0%", "-50%"] }}
                        transition={{ 
                            repeat: Infinity, 
                            duration: 40, 
                            ease: "linear" 
                        }}
                    >
                        {scrollCategories.map((category, index) => (
                            <motion.div 
                                key={`${category.id}-${index}`} 
                                onClick={() => navigateTo('shop', { category: category.name })}
                                onMouseEnter={() => setHoveredCategory(category.name)}
                                onMouseLeave={() => setHoveredCategory(null)}
                                className="group cursor-pointer relative w-48 md:w-64 h-36 md:h-48 rounded-[1.5rem] overflow-hidden flex-shrink-0 shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_40px_rgba(255,255,255,0.7)] border-2 border-white/40 hover:border-white transition-all duration-500"
                            >
                                {/* Parallax Image Background */}
                                <div className="absolute inset-0 bg-white overflow-hidden">
                                    {category.image_url ? (
                                        <motion.img 
                                            src={category.image_url} 
                                            alt={category.name} 
                                            className="w-full h-full object-cover opacity-95 group-hover:opacity-100 transition-all duration-700 ease-out brightness-100 contrast-110"
                                            whileHover={{ scale: 1.15, y: -10 }}
                                            loading="lazy"
                                        />
                                    ) : (
                                        <div className="w-full h-full bg-gradient-to-br from-hav-sage to-hav-forest flex items-center justify-center">
                                            <span className="text-hav-gold/20 font-serif text-8xl opacity-30">{category.name[0]}</span>
                                        </div>
                                    )}
                                </div>
                                
                                {/* Glass Overlay - Bottom Centered & Fit to Text */}
                                <div className="absolute bottom-4 left-0 right-0 flex justify-center px-4 z-20">
                                    <div className="bg-black/40 backdrop-blur-md border border-white/20 rounded-xl px-4 py-2 w-fit transform group-hover:translate-y-[-4px] transition-all duration-500">
                                        <h3 className={`font-serif font-bold text-white text-center drop-shadow-xl leading-tight ${category.name.length > 12 ? 'text-xs md:text-sm' : 'text-sm md:text-base'}`}>
                                            {category.name}
                                        </h3>
                                    </div>
                                </div>

                                {/* Hover Atmosphere Glow */}
                                <div className="absolute inset-0 bg-hav-gold/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"></div>
                            </motion.div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
};


const HomePage: React.FC<HomePageProps> = ({ navigateTo, products, promotionalContent, openQuickView, categories, storeSettings, addToCart }) => {
  const imageCarouselSlides = promotionalContent.filter(c => c.type === 'image_carousel' && c.is_active !== false);
  const textCarouselOffers = promotionalContent.filter(c => c.type === 'text_carousel');

  const imageCarouselDuration = storeSettings?.global_banner_duration || 7; 

  const textCarouselDuration = textCarouselOffers.length > 0
    ? Math.max(...textCarouselOffers.map(s => s.carousel_duration_seconds || 0)) || 5
    : 5;

  return (
    <div className="relative min-h-screen bg-hav-cream overflow-x-hidden">
      {/* Atmospheric Backgrounds - Layered Radial Gradients (Subtle to keep beige dominant) */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] bg-hav-gold/5 rounded-full blur-[120px] animate-pulse"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[60%] h-[60%] bg-hav-forest/5 rounded-full blur-[120px] animate-pulse delay-1000"></div>
      </div>

      <div className="relative z-10">
        {/* Massive Typographic Impact (Editorial Hero) */}
        <div className="absolute top-10 left-0 w-full pointer-events-none z-0 overflow-hidden hidden lg:block">
          <motion.h1 
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 0.03, x: 0 }}
            transition={{ duration: 2 }}
            className="text-[25vw] font-black uppercase leading-[0.8] tracking-tighter text-hav-forest whitespace-nowrap"
          >
            HAVIKAR
          </motion.h1>
        </div>

        <div className="flex flex-col">
            {storeSettings?.is_banner_carousel_enabled !== false && imageCarouselSlides.length > 0 && (
                <div className="w-full px-4 md:px-[5%] py-4 md:py-6">
                    <div className="rounded-[1.5rem] md:rounded-[2rem] overflow-hidden shadow-lg border border-hav-gold/5">
                        <ImageCarousel 
                            navigateTo={navigateTo} 
                            slides={imageCarouselSlides} 
                            durationSeconds={imageCarouselDuration} 
                            products={products}
                            addToCart={addToCart}
                        />
                    </div>
                </div>
            )}
            <InfiniteShelf products={products} navigateTo={navigateTo} storeSettings={storeSettings} />
            <ScrollingHero 
                navigateTo={navigateTo} 
                offers={textCarouselOffers} 
                durationSeconds={textCarouselDuration}
            />
        </div>

        <Bestsellers products={products} navigateTo={navigateTo} openQuickView={openQuickView} />

        {/* Grouped Sections: Our Collections & Signature Collection */}
        <section className="mask-both bg-white/40 backdrop-blur-sm rounded-[3rem] mx-2 md:mx-4 my-4 md:my-8 border border-hav-gold/20 shadow-2xl overflow-hidden">
          <div className="py-2">
            <CategoryGrid categories={categories} navigateTo={navigateTo} />
          </div>
          
          <div className="h-px w-full bg-gradient-to-r from-transparent via-hav-gold/30 to-transparent"></div>

          <div className="py-2">
            <FeaturedProducts 
              products={products} 
              navigateTo={navigateTo} 
              openQuickView={openQuickView} 
            />
          </div>
        </section>

        {/* Grouped Sections: From our Kitchen & Testimonials */}
        <div className="flex flex-col py-0 bg-hav-cream/30 mask-both">
          <Suspense fallback={<div>Loading...</div>}>
              <Recipes navigateTo={navigateTo} />
              <Testimonials />
          </Suspense>
        </div>

        {/* Grouped Sections: Why Havikar & Story */}
        <div className="flex flex-col pt-0 mask-top">
          <Suspense fallback={<div>Loading...</div>}>
              <Story />
              <WhyHavikar />
          </Suspense>
        </div>
      </div>
    </div>
  );
};

// FIX: Add default export to resolve module import error.
export default HomePage;
