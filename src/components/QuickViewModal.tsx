
import React, { useState, useEffect } from 'react';
import { Product, ProductVariant } from '../types';
import XIcon from './icons/XIcon';
import DiscountDisplay from './DiscountDisplay';
import { motion, AnimatePresence } from 'framer-motion';

interface QuickViewModalProps {
    product: Product;
    onClose: () => void;
    addToCart: (product: Product, selectedVariant: ProductVariant, quantity: number) => void;
    onBuyNow: (product: Product, selectedVariant: ProductVariant, quantity: number) => void;
}

const QuickViewModal: React.FC<QuickViewModalProps> = ({ product, onClose, addToCart, onBuyNow }) => {
    const [selectedVariantId, setSelectedVariantId] = useState<string>(product.product_variants[0]?.id || '');
    const [quantity, setQuantity] = useState(1);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const selectedVariant = product.product_variants.find(v => v.id === selectedVariantId) || product.product_variants[0];

    useEffect(() => {
        if (product.product_variants.length > 0) {
            setSelectedVariantId(product.product_variants[0].id);
        }
    }, [product]);

    if (!product) return null;

    const isOutOfStock = !selectedVariant || selectedVariant.stock_quantity <= 0;

    return (
        <AnimatePresence>
            <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-hav-forest/60 backdrop-blur-sm z-[100] flex items-center justify-center p-4"
                onClick={onClose}
            >
                <motion.div 
                    initial={{ scale: 0.9, opacity: 0, y: 20 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    exit={{ scale: 0.9, opacity: 0, y: 20 }}
                    className="bg-hav-cream rounded-[2.5rem] shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col md:flex-row border border-hav-gold/20"
                    onClick={e => e.stopPropagation()}
                >
                    {/* Image Section */}
                    <div className="md:w-1/2 bg-white p-8 flex flex-col items-center justify-center relative">
                        <button onClick={onClose} className="absolute top-4 right-4 md:hidden p-2 rounded-full hover:bg-hav-cream transition-colors">
                            <XIcon className="w-6 h-6" />
                        </button>
                        <div className="aspect-square w-full flex items-center justify-center overflow-hidden">
                            <img 
                                src={product.image_urls[activeImageIndex]} 
                                alt={product.name} 
                                className="w-full h-full object-contain mix-blend-multiply" 
                            />
                        </div>
                        {product.image_urls.length > 1 && (
                            <div className="flex gap-2 mt-4 overflow-x-auto pb-2 w-full justify-center">
                                {product.image_urls.map((url, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`w-16 h-16 rounded-lg border-2 transition-all ${activeImageIndex === idx ? 'border-hav-gold' : 'border-transparent opacity-60'}`}
                                    >
                                        <img src={url} alt="" className="w-full h-full object-cover mix-blend-multiply" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Content Section */}
                    <div className="md:w-1/2 p-10 flex flex-col overflow-y-auto">
                        <div className="flex justify-between items-start mb-4">
                            <div>
                                <h2 className="text-3xl font-serif font-bold text-hav-forest">{product.name}</h2>
                                <p className="text-hav-olive opacity-70 italic mt-1">{product.tagline}</p>
                            </div>
                            <button onClick={onClose} className="hidden md:block p-2 rounded-full hover:bg-hav-orange-50 transition-colors">
                                <XIcon className="w-6 h-6" />
                            </button>
                        </div>

                        <div className="my-6">
                            {selectedVariant && (
                                <DiscountDisplay 
                                    price={selectedVariant.price} 
                                    mrp={selectedVariant.mrp} 
                                    size="large" 
                                    className="text-hav-forest" 
                                />
                            )}
                        </div>

                        {product.product_variants.length > 1 && (
                            <div className="mb-8">
                                <p className="text-xs font-black uppercase tracking-widest text-hav-gold mb-3">Select Size</p>
                                <div className="flex flex-wrap gap-2">
                                    {product.product_variants.map(v => (
                                        <button 
                                            key={v.id}
                                            onClick={() => setSelectedVariantId(v.id)}
                                            className={`px-4 py-2 rounded-full text-sm font-bold border-2 transition-all ${selectedVariantId === v.id ? 'bg-hav-forest text-hav-gold border-hav-forest' : 'bg-white text-hav-olive border-hav-gold/20 hover:border-hav-gold'}`}
                                        >
                                            {v.net_weight}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}

                        <div className="mb-8">
                            <p className="text-xs font-black uppercase tracking-widest text-hav-gold mb-3">Quantity</p>
                            <div className="flex items-center gap-4">
                                <div className="flex items-center border-2 border-hav-gold/20 rounded-full bg-white overflow-hidden">
                                    <button 
                                        onClick={() => setQuantity(q => Math.max(1, q - 1))}
                                        className="px-4 py-2 text-hav-forest hover:bg-hav-orange-50 transition-colors font-bold"
                                    >-</button>
                                    <span className="px-4 py-2 text-hav-forest font-bold">{quantity}</span>
                                    <button 
                                        onClick={() => setQuantity(q => q + 1)}
                                        className="px-4 py-2 text-hav-forest hover:bg-hav-orange-50 transition-colors font-bold"
                                    >+</button>
                                </div>
                                {selectedVariant && selectedVariant.stock_quantity < 10 && selectedVariant.stock_quantity > 0 && (
                                    <span className="text-xs font-bold text-red-500">Only {selectedVariant.stock_quantity} left!</span>
                                )}
                            </div>
                        </div>

                        <div className="mt-auto space-y-4 pt-8 border-t border-hav-gold/10">
                            <button 
                                onClick={() => selectedVariant && addToCart(product, selectedVariant, quantity)}
                                disabled={isOutOfStock}
                                className="w-full bg-white text-hav-forest border-2 border-hav-forest font-black py-4 rounded-full uppercase tracking-widest text-sm hover:bg-hav-forest hover:text-hav-gold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                {isOutOfStock ? 'Out of Stock' : 'Add to Bag'}
                            </button>
                            <button 
                                onClick={() => selectedVariant && onBuyNow(product, selectedVariant, quantity)}
                                disabled={isOutOfStock}
                                className="w-full bg-hav-forest text-hav-gold font-black py-4 rounded-full uppercase tracking-widest text-sm hover:brightness-110 transition-all shadow-xl disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Buy It Now
                            </button>
                        </div>
                    </div>
                </motion.div>
            </motion.div>
        </AnimatePresence>
    );
};

export default QuickViewModal;
