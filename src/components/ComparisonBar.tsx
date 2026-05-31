
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ArrowRightLeft } from 'lucide-react';
import { Product } from '../types';

interface ComparisonBarProps {
  productIds: string[];
  products: Product[];
  onRemove: (productId: string) => void;
  onClear: () => void;
  onCompare: () => void;
}

const ComparisonBar: React.FC<ComparisonBarProps> = ({ productIds, products, onRemove, onClear, onCompare }) => {
  const selectedProducts = products.filter(p => productIds.includes(p.id));

  if (productIds.length === 0) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: 100 }}
        animate={{ y: 0 }}
        exit={{ y: 100 }}
        className="fixed bottom-0 left-0 right-0 z-[70] bg-white border-t border-hav-gold/20 shadow-[0_-10px_40px_rgba(0,0,0,0.1)] p-4 md:p-6"
      >
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-6">
          <div className="flex items-center gap-3 text-hav-forest">
            <ArrowRightLeft size={24} className="text-hav-gold" />
            <span className="font-serif font-bold text-lg">Compare Products ({productIds.length}/4)</span>
          </div>

          <div className="flex-grow flex gap-4 overflow-x-auto pb-2 md:pb-0 w-full md:w-auto">
            {selectedProducts.map(product => (
              <div key={product.id} className="relative group flex-shrink-0">
                <div className="w-16 h-16 rounded-xl bg-hav-cream overflow-hidden border border-hav-gold/10">
                  <img 
                    src={product.image_url || 'https://picsum.photos/seed/spice/100'} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                    referrerPolicy="no-referrer"
                  />
                </div>
                <button 
                  onClick={() => onRemove(product.id)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
            
            {Array.from({ length: Math.max(0, 4 - productIds.length) }).map((_, i) => (
              <div key={i} className="w-16 h-16 rounded-xl border-2 border-dashed border-hav-gold/20 flex items-center justify-center text-hav-gold/20">
                <span className="text-xs font-bold">Add</span>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-4 w-full md:w-auto">
            <button 
              onClick={onClear}
              className="text-sm font-bold text-hav-olive/60 hover:text-red-500 transition-colors"
            >
              Clear All
            </button>
            <button 
              onClick={onCompare}
              disabled={productIds.length < 2}
              className="flex-grow md:flex-none bg-hav-forest text-hav-gold px-8 py-3 rounded-full font-black uppercase tracking-widest text-xs shadow-xl hover:brightness-110 disabled:opacity-50 disabled:grayscale transition-all"
            >
              Compare Now
            </button>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};

export default ComparisonBar;
