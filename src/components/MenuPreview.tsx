
import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Category, Product, Page, PageContext } from '../types';

interface MenuPreviewProps {
  categories: Category[];
  products: Product[];
  navigateTo: (page: Page, context?: PageContext) => void;
}

const MenuPreview: React.FC<MenuPreviewProps> = ({ categories, products, navigateTo }) => {
  const [activeCategory, setActiveCategory] = useState<string>(categories[0]?.name || '');
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const filteredProducts = products
    .filter(p => p.categories?.name === activeCategory)
    .slice(0, 6); // Show top 6 from each category

  const handleCategoryClick = (catName: string) => {
    setActiveCategory(catName);
  };

  return (
    <section className="py-24 bg-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-6">
          <div>
            <motion.span 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              className="text-hav-gold font-bold uppercase tracking-[0.3em] text-xs mb-4 block"
            >
              Explore Our Menu
            </motion.span>
            <motion.h2 
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="text-4xl md:text-6xl font-serif font-bold text-hav-forest"
            >
              A Glimpse of Tradition
            </motion.h2>
          </div>
          
          <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar md:pb-0">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => handleCategoryClick(category.name)}
                className={`px-6 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-300 ${
                  activeCategory === category.name
                    ? 'bg-hav-forest text-hav-gold shadow-lg scale-105'
                    : 'bg-hav-cream text-hav-forest hover:bg-hav-gold/20'
                }`}
              >
                {category.name}
              </button>
            ))}
          </div>
        </div>

        <div className="relative">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeCategory}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.4 }}
              className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-6"
            >
              {filteredProducts.length > 0 ? (
                filteredProducts.map((product, idx) => (
                  <motion.div
                    key={product.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.05 }}
                    onClick={() => navigateTo('product', { productId: product.id })}
                    className="group cursor-pointer"
                  >
                    <div className="aspect-square rounded-2xl overflow-hidden mb-3 bg-hav-cream relative">
                      <img
                        src={product.image_url || `https://picsum.photos/seed/${product.id}/400/400`}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <span className="text-white text-[10px] font-black uppercase tracking-widest bg-hav-forest/80 px-3 py-1 rounded-full">View</span>
                      </div>
                    </div>
                    <h4 className="text-sm font-bold text-hav-forest line-clamp-1 group-hover:text-hav-gold transition-colors">
                      {product.name}
                    </h4>
                    <p className="text-[10px] text-hav-olive/60 font-medium uppercase tracking-tighter">
                      {product.net_weight}
                    </p>
                  </motion.div>
                ))
              ) : (
                <div className="col-span-full py-20 text-center text-hav-olive/40 italic">
                  More delicacies coming soon to this category...
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        <div className="mt-16 text-center">
          <button
            onClick={() => navigateTo('shop', { category: activeCategory })}
            className="inline-flex items-center gap-3 text-hav-forest font-black uppercase tracking-[0.2em] text-xs group"
          >
            <span>View All {activeCategory}</span>
            <div className="w-8 h-[1px] bg-hav-gold transition-all duration-300 group-hover:w-12"></div>
          </button>
        </div>
      </div>
    </section>
  );
};

export default MenuPreview;
