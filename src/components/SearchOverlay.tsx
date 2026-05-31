
import React, { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, X, ArrowRight } from 'lucide-react';
import { Product, Page, PageContext } from '../types';

interface SearchOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  navigateTo: (page: Page, context?: PageContext) => void;
  products: Product[];
}

const SearchOverlay: React.FC<SearchOverlayProps> = ({ isOpen, onClose, navigateTo, products }) => {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products.filter(p => 
      p.name.toLowerCase().includes(q) || 
      p.tagline?.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
    ).slice(0, 5);
  }, [query, products]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] bg-hav-forest/95 backdrop-blur-xl flex flex-col items-center pt-20 px-4"
        >
          <button 
            onClick={onClose}
            className="absolute top-8 right-8 p-4 text-hav-gold hover:rotate-90 transition-transform"
          >
            <X size={40} strokeWidth={1.5} />
          </button>

          <div className="w-full max-w-3xl">
            <div className="relative group">
              <input
                autoFocus
                type="text"
                placeholder="Search for spices, masalas, or recipes..."
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                className="w-full bg-transparent border-b-2 border-hav-gold/30 py-6 text-3xl md:text-5xl font-serif text-hav-gold placeholder:text-hav-gold/20 focus:outline-none focus:border-hav-gold transition-all"
              />
              <Search className="absolute right-0 top-1/2 -translate-y-1/2 text-hav-gold/50 group-focus-within:text-hav-gold transition-colors" size={32} />
            </div>

            <div className="mt-12 space-y-4">
              {results.length > 0 ? (
                results.map(product => (
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    key={product.id}
                    onClick={() => {
                      navigateTo('product', { productId: product.id });
                      onClose();
                    }}
                    className="flex items-center gap-6 p-4 rounded-3xl bg-white/5 hover:bg-white/10 cursor-pointer transition-all group"
                  >
                    <div className="w-20 h-20 rounded-2xl bg-hav-cream overflow-hidden flex-shrink-0">
                      <img 
                        src={product.image_url || 'https://picsum.photos/seed/spice/200'} 
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                        referrerPolicy="no-referrer"
                      />
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-xl font-serif font-bold text-hav-gold">{product.name}</h4>
                      <p className="text-sm text-hav-gold/60">{product.tagline}</p>
                    </div>
                    <ArrowRight className="text-hav-gold opacity-0 group-hover:opacity-100 -translate-x-4 group-hover:translate-x-0 transition-all" />
                  </motion.div>
                ))
              ) : query.trim() ? (
                <p className="text-hav-gold/40 text-center py-12 font-medium">No products found matching "{query}"</p>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                   {['Turmeric', 'Chilli', 'Garam Masala', 'Pepper', 'Cumin'].map(term => (
                     <button 
                       key={term}
                       onClick={() => setQuery(term)}
                       className="px-6 py-3 rounded-full border border-hav-gold/20 text-hav-gold/60 hover:border-hav-gold hover:text-hav-gold transition-all text-sm font-bold"
                     >
                       {term}
                     </button>
                   ))}
                </div>
              )}
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default SearchOverlay;
