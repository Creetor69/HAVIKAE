import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Product, StoreSettings, Category, ProductVariant, Page, PageContext, ProductCombo } from '../types';
import ProductCard from '../components/ProductCard';
import ChevronDownIcon from '../components/icons/ChevronDownIcon';
import { supabase } from '../supabaseClient';
import LoadingSpinner from '../components/LoadingSpinner';

interface ShopPageProps {
  navigateTo: (page: Page, context: PageContext) => void;
  products: Product[];
  initialCategory?: string;
  wishlist: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  storeSettings: StoreSettings | null;
  categories: Category[];
  openQuickView: (product: Product) => void;
  addToCart: (product: Product, selectedVariant: ProductVariant, quantity?: number) => void;
  onBuyNow: (product: Product, selectedVariant: ProductVariant, quantity: number) => void;
}

const ComboCard: React.FC<{ 
    combo: ProductCombo; 
    products: Product[]; 
    onAddToCart: (combo: ProductCombo) => void;
}> = ({ combo, products, onAddToCart }) => {
    const mrpSum = combo.items.reduce((acc, item) => {
        const product = products.find(p => p.product_variants.some(v => v.id === item.variant_id));
        const variant = product?.product_variants.find(v => v.id === item.variant_id);
        return acc + (variant ? (variant.mrp || variant.price) * item.quantity : 0);
    }, 0);
    
    const discountPercent = mrpSum > 0 ? Math.round(((mrpSum - combo.price) / mrpSum) * 100) : 0;

    return (
        <div className="bg-gradient-to-br from-hav-forest to-hav-olive rounded-3xl overflow-hidden shadow-xl border border-hav-gold/30 flex flex-col group h-full">
            <div className="relative h-72 overflow-hidden bg-hav-cream/10">
                {combo.image_url ? (
                    <img src={combo.image_url} alt={combo.name} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" loading="lazy" />
                ) : (
                    <div className="w-full h-full flex items-center justify-center text-hav-gold/20 text-4xl font-serif">Bundle</div>
                )}
                <div className="absolute top-6 left-6 bg-hav-gold text-hav-forest font-black px-4 py-2 rounded-full text-xs uppercase tracking-widest shadow-lg">Value Pack</div>
                {discountPercent > 0 && (
                    <div className="absolute top-6 right-6 bg-red-600 text-white font-black px-4 py-2 rounded-md text-sm shadow-lg animate-pulse">Save {discountPercent}%</div>
                )}
            </div>
            <div className="p-8 flex flex-col flex-grow text-white">
                <h3 className="text-3xl font-serif font-bold text-hav-gold mb-3">{combo.name}</h3>
                <p className="text-hav-cream/80 text-base line-clamp-3 mb-8 flex-grow">{combo.description}</p>
                <div className="flex items-center justify-between mt-auto pt-6 border-t border-white/10">
                    <div className="flex flex-col">
                        <span className="text-hav-gold font-black text-3xl">₹{(combo.price || 0).toFixed(2)}</span>
                        {mrpSum > combo.price && <s className="text-hav-cream/40 text-sm">₹{(mrpSum || 0).toFixed(2)}</s>}
                    </div>
                    <button 
                        onClick={() => onAddToCart(combo)}
                        className="bg-hav-gold text-hav-forest font-black py-3 px-8 rounded-full hover:bg-white hover:text-hav-forest transition-all transform hover:scale-105 active:scale-95 shadow-lg uppercase text-xs tracking-[0.2em]"
                    >
                        Add Pack
                    </button>
                </div>
            </div>
        </div>
    );
}

const ShopPage: React.FC<ShopPageProps> = ({ navigateTo, products, initialCategory, wishlist, addToWishlist, removeFromWishlist, storeSettings, categories, openQuickView, addToCart, onBuyNow }) => {
  const [filters, setFilters] = useState({
    category: initialCategory || 'All',
    spice_level: 'All',
    is_vegan: false,
    price_range: 'All'
  });
  const [combos, setCombos] = useState<ProductCombo[]>([]);
  const [isCombosLoading, setIsCombosLoading] = useState(false);

  useEffect(() => {
    setFilters(prev => ({ ...prev, category: initialCategory || 'All' }));
  }, [initialCategory]);

  const fetchCombos = useCallback(async () => {
    setIsCombosLoading(true);
    const { data } = await supabase!.from('product_combos').select('*').eq('is_active', true);
    if (data) setCombos(data);
    setIsCombosLoading(false);
  }, []);

  useEffect(() => {
      fetchCombos();
  }, [fetchCombos]);

  const handleFilterChange = (filterName: string, value: string | boolean) => {
    setFilters(prev => ({ ...prev, [filterName]: value }));
  };

  const normalizeCategoryName = (catName: string) => {
     if (!catName || catName.toLowerCase() === 'all') return 'All';
     const match = categories.find(c => c.name.toLowerCase() === catName.toLowerCase());
     return match ? match.name : catName; 
  };

  const displayCategoryName = useMemo(() => normalizeCategoryName(filters.category), [filters.category, categories]);
  
  const filteredProducts = useMemo(() => {
    const activeCategoryLower = filters.category.toLowerCase();

    return products.filter(product => {
      if (activeCategoryLower !== 'all') {
        const productCategoryName = product.categories?.name?.toLowerCase();
        if (!productCategoryName || productCategoryName !== activeCategoryLower) return false;
      }
      if (filters.spice_level !== 'All' && product.spice_level !== filters.spice_level) return false;
      if (filters.is_vegan && !product.is_vegan) return false;
      
      if (filters.price_range !== 'All') {
          const minPrice = product.product_variants.reduce((min, v) => Math.min(min, v.price), Infinity);
          if (filters.price_range === 'Under ₹200' && minPrice >= 200) return false;
          if (filters.price_range === '₹200 - ₹500' && (minPrice < 200 || minPrice > 500)) return false;
          if (filters.price_range === 'Above ₹500' && minPrice <= 500) return false;
      }
      
      return true;
    });
  }, [filters, products]);

  const sponsoredProducts = useMemo(() => {
    return products.filter(p => p.is_sponsored).slice(0, 4);
  }, [products]);
  
  const uniqueCategories = useMemo(() => ['All', ...categories.map(c => c.name)], [categories]);

  const handleAddComboToCart = async (combo: ProductCombo) => {
      for (const item of combo.items) {
          const product = products.find(p => p.product_variants.some(v => v.id === item.variant_id));
          const variant = product?.product_variants.find(v => v.id === item.variant_id);
          if (product && variant) {
              await addToCart(product, variant, item.quantity);
          }
      }
  }

  const FilterSelect: React.FC<{label: string, name: keyof typeof filters, options: string[], value: string}> = ({label, name, options, value}) => (
    <div>
        <label htmlFor={name} className="block text-sm font-bold text-hav-forest mb-1">{label}</label>
        <div className="relative">
            <select 
                id={name} 
                name={name}
                value={value}
                onChange={(e) => handleFilterChange(name, e.target.value)}
                className="mt-1 block w-full pl-3 pr-10 py-2 text-base border border-hav-olive/20 focus:outline-none focus:ring-hav-gold focus:border-hav-gold sm:text-sm rounded-md appearance-none bg-white text-hav-olive"
            >
                {options.map(opt => <option key={opt}>{opt}</option>)}
            </select>
            <ChevronDownIcon className="w-5 h-5 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-hav-forest"/>
        </div>
    </div>
  );

  return (
    <div className="bg-transparent min-h-screen pb-24">
      <main className="container mx-auto px-4 max-w-[1600px]">
          <div className="text-center py-8 animate-fadeIn">
            <h1 className="text-3xl md:text-5xl font-serif font-bold text-hav-forest">Authentic Indian Pantry</h1>
            <p className="mt-2 text-base text-hav-olive max-w-xl mx-auto leading-relaxed italic opacity-80">Handcrafted tradition, delivered to your doorstep.</p>
            <div className="w-16 h-0.5 bg-hav-gold mx-auto mt-4 rounded-full"></div>
          </div>

          <div className="flex flex-row gap-2 md:gap-8 items-start mt-4 md:mt-8">
            <aside className="w-14 sm:w-20 md:w-64 flex-shrink-0 sticky top-20 space-y-2 md:space-y-4">
                <div className="bg-white p-1 md:p-5 rounded-xl shadow-sm border border-hav-gold/10">
                    <h3 className="hidden md:block font-serif font-bold text-lg text-hav-forest mb-3 border-b border-hav-gold/20 pb-1.5 text-center md:text-left">Collections</h3>
                    <div className="flex flex-col gap-1 md:gap-1.5">
                        {uniqueCategories.map(cat => (
                            <button 
                                key={cat}
                                onClick={() => navigateTo('shop', { category: cat === 'All' ? undefined : cat })}
                                className={`text-center md:text-left px-1 md:px-3 py-2 md:py-1.5 rounded-lg transition-all font-black md:font-bold text-[8px] md:text-xs overflow-hidden text-ellipsis ${displayCategoryName === cat ? 'bg-hav-forest text-hav-gold shadow-sm' : 'text-hav-olive hover:bg-hav-orange-50'}`}
                                title={cat}
                            >
                                {cat === 'All' ? 'All' : cat}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="bg-white p-1 md:p-5 rounded-xl shadow-sm border border-hav-gold/10">
                     <h3 className="hidden md:block font-serif font-bold text-lg text-hav-forest mb-3 border-b border-hav-gold/20 pb-1.5 text-center md:text-left">Filters</h3>
                     {/* Mobile Simplified Filter Icon */}
                     <div className="md:hidden flex flex-col gap-2 items-center py-2">
                        <div className="w-6 h-6 rounded-full bg-hav-forest/10 flex items-center justify-center text-hav-forest">⚙️</div>
                     </div>
                     <div className="hidden md:block space-y-4">
                        <FilterSelect label="Spice Level" name="spice_level" value={filters.spice_level} options={['All', 'None', 'Mild', 'Medium', 'Hot']} />
                        <FilterSelect label="Price Range" name="price_range" value={filters.price_range} options={['All', 'Under ₹200', '₹200 - ₹500', 'Above ₹500']} />
                        <div className="flex items-center gap-2.5 bg-hav-orange-50 p-2.5 rounded-lg">
                            <input 
                                type="checkbox" 
                                id="is_vegan" 
                                checked={filters.is_vegan}
                                onChange={(e) => handleFilterChange('is_vegan', e.target.checked)}
                                className="h-4 w-4 text-hav-forest border-hav-gold/30 rounded focus:ring-hav-gold accent-hav-forest cursor-pointer"
                            />
                            <label htmlFor="is_vegan" className="text-xs font-bold text-hav-forest cursor-pointer">Vegan Only</label>
                        </div>
                        <button onClick={() => navigateTo('shop', {})} className="w-full mt-1 text-hav-gold font-black hover:text-hav-forest underline text-[9px] uppercase tracking-widest">Reset Filters</button>
                     </div>
                </div>
            </aside>

            <div className="flex-grow w-0 min-w-0">
                {/* Compact grid: 2 columns on mobile, 3 on lg, 4 on xl */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-2 md:gap-8">
                    {filteredProducts.map(product => (
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
                {filteredProducts.length === 0 && (
                    <div className="text-center py-20 bg-white rounded-2xl border border-dashed border-hav-gold/50 shadow-inner mt-8">
                        <p className="text-hav-olive text-lg font-serif">No products found matching these filters.</p>
                        <button onClick={() => navigateTo('shop', {})} className="mt-4 bg-hav-forest text-hav-gold font-bold py-3 px-8 rounded-full hover:shadow-lg transition-all uppercase tracking-widest text-xs">View all items</button>
                    </div>
                )}
            </div>
          </div>
      </main>
    </div>
  );
};

export default ShopPage;