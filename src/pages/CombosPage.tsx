
import React, { useState, useEffect } from 'react';
import { Product, ProductCombo, Page, PageContext } from '../types';
import { supabase } from '../supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';

interface CombosPageProps {
    products: Product[];
    navigateTo: (page: Page, context: PageContext) => void;
    addToCart: (product: Product, selectedVariant: any, quantity: number) => void;
}

const CombosPage: React.FC<CombosPageProps> = ({ products, navigateTo, addToCart }) => {
    const [combos, setCombos] = useState<ProductCombo[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchCombos = async () => {
            setLoading(true);
            const { data } = await supabase!.from('product_combos').select('*').eq('is_active', true);
            if (data) setCombos(data);
            setLoading(false);
        };
        fetchCombos();
    }, []);

    const handleAddComboToCart = async (combo: ProductCombo) => {
        for (const item of combo.items) {
            const product = products.find(p => p.product_variants.some(v => v.id === item.variant_id));
            const variant = product?.product_variants.find(v => v.id === item.variant_id);
            if (product && variant) {
                await addToCart(product, variant, item.quantity);
            }
        }
    }

    if (loading) return <div className="min-h-screen flex items-center justify-center bg-hav-cream"><LoadingSpinner /></div>;

    return (
        <div className="bg-hav-cream min-h-screen py-16">
            <div className="container mx-auto px-4">
                <div className="text-center mb-16">
                    <h1 className="text-6xl font-serif font-black text-hav-forest mb-4">Value Bundles</h1>
                    <p className="text-xl text-hav-olive opacity-70">Curated assortments of our best flavors at a special price.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
                    {combos.map(combo => (
                        <div key={combo.id} className="bg-white rounded-[2.5rem] overflow-hidden shadow-xl border border-hav-gold/20 flex flex-col group transition-all hover:-translate-y-2">
                            <div className="relative h-80 overflow-hidden bg-hav-orange-50">
                                {combo.image_url ? (
                                    <img src={combo.image_url} alt={combo.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                                ) : (
                                    <div className="w-full h-full flex items-center justify-center text-hav-gold/20 text-4xl font-serif">Pack</div>
                                )}
                                <div className="absolute top-6 left-6 bg-hav-gold text-hav-forest font-black px-5 py-2 rounded-full text-xs uppercase tracking-widest shadow-xl">Special Bundle</div>
                            </div>
                            <div className="p-10 flex flex-col flex-grow">
                                <h3 className="text-3xl font-serif font-bold text-hav-forest mb-4">{combo.name}</h3>
                                <p className="text-hav-olive/70 text-lg leading-relaxed line-clamp-3 mb-10 flex-grow">{combo.description}</p>
                                
                                <div className="flex items-center justify-between mt-auto pt-8 border-t border-hav-gold/10">
                                    <div className="flex flex-col">
                                        <span className="text-hav-forest font-black text-4xl">₹{(combo.price || 0).toFixed(2)}</span>
                                        <span className="text-[10px] text-hav-gold font-black uppercase tracking-widest mt-1">Limited Time Offer</span>
                                    </div>
                                    <button 
                                        onClick={() => handleAddComboToCart(combo)}
                                        className="bg-hav-forest text-hav-gold font-black py-5 px-10 rounded-full hover:shadow-2xl transition-all transform hover:scale-105 active:scale-95 uppercase tracking-[0.2em] text-xs"
                                    >
                                        Add Bundle
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {combos.length === 0 && (
                    <div className="text-center py-40">
                        <p className="text-2xl text-hav-olive/40 font-serif italic">No bundles available at the moment. Check back soon!</p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default CombosPage;
