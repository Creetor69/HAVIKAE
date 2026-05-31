
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Product, User, Review, ReviewInsert, CartItem, ProductVariant, Page, PageContext } from '../types';
import FacebookIcon from '../components/icons/FacebookIcon';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import InstagramIcon from '../components/icons/InstagramIcon';
import ChevronLeftIcon from '../components/icons/ChevronLeftIcon';
import ChevronRightIcon from '../components/icons/ChevronRightIcon';
import ProductHighlights from '../components/ProductHighlights';
import StarRating from '../components/StarRating';
import StarInput from '../components/StarInput';
import HeartIcon from '../components/icons/HeartIcon';
import CompareIcon from '../components/icons/CompareIcon';
import { supabase } from '../supabaseClient';
import DiscountDisplay from '../components/DiscountDisplay';
import ProductCard from '../components/ProductCard';
import LoadingSpinner from '../components/LoadingSpinner';
import VideoPlayer from '../components/VideoPlayer';

interface ProductPageProps {
  productId: string;
  user: User | null;
  navigateTo: (page: Page, context: PageContext) => void;
  addToCart: (product: Product, selectedVariant: ProductVariant, quantity?: number) => void;
  onBuyNow: (product: Product, selectedVariant: ProductVariant, quantity: number) => void;
  products: Product[];
  cart: CartItem[];
  wishlist: string[];
  addToWishlist: (productId: string) => void;
  removeFromWishlist: (productId: string) => void;
  openQuickView: (product: Product) => void;
}

type Tab = 'description' | 'ingredients' | 'howToUse' | 'reviews';
type SortOption = 'newest' | 'oldest' | 'highest' | 'lowest';

const ProductImageZoom: React.FC<{ src: string; alt: string }> = ({ src, alt }) => {
  const [backgroundPosition, setBackgroundPosition] = useState('50% 50%');
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isHovered) return;
    const { left, top, width, height } = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - left) / width) * 100;
    const y = ((e.clientY - top) / height) * 100;
    setBackgroundPosition(`${x}% ${y}%`);
  };

  return (
    <div 
      className="relative w-full h-full overflow-hidden rounded-lg bg-white cursor-crosshair group"
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <img 
        src={src} 
        alt={alt} 
        className={`w-full h-full object-contain mix-blend-multiply transition-opacity duration-200 ${isHovered ? 'lg:opacity-0' : 'opacity-100'}`}
        loading="eager"
        decoding="sync"
      />
      <div 
        className={`absolute inset-0 bg-no-repeat transition-opacity duration-200 hidden lg:block pointer-events-none ${isHovered ? 'opacity-100' : 'opacity-0'}`}
        style={{
            backgroundImage: `url(${src})`,
            backgroundPosition: backgroundPosition,
            backgroundSize: '200%',
        }}
      />
    </div>
  );
};

const ProductPage: React.FC<ProductPageProps> = ({ productId, user, navigateTo, addToCart, onBuyNow, products, cart, wishlist, addToWishlist, removeFromWishlist, openQuickView }) => {
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('description');
  const [quantity, setQuantity] = useState(1);
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const [reviews, setReviews] = useState<Review[]>([]);
  const [isLoadingReviews, setIsLoadingReviews] = useState(true);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  const [sortOption, setSortOption] = useState<SortOption>('newest');
  
  const [showReviewForm, setShowReviewForm] = useState(false);
  const [reviewRating, setReviewRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isInWishlist = wishlist.includes(productId);

  const selectedVariant = product?.product_variants?.find(v => v.id === selectedVariantId) || product?.product_variants?.[0] || null;

  useEffect(() => {
    if (product) {
      document.title = `${product.name} | Havikar - Authentic South Indian Taste`;
      const metaDescription = document.querySelector('meta[name="description"]');
      if (metaDescription) {
        metaDescription.setAttribute('content', product.tagline || product.description || '');
      }
    }
  }, [product]);

  const fetchFullProduct = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase!
        .from('products')
        .select('*, categories(id, name), product_variants(*)')
        .or(`id.eq."${productId}",slug.eq."${productId}"`)
        .maybeSingle();
    
    if (error || !data) {
        navigateTo('notFound', {});
        return;
    }

    setProduct(data as Product);
    if (data.product_variants && data.product_variants.length > 0) {
        setSelectedVariantId(data.product_variants[0].id);
    }
    
    const related = products
        .filter(p => p.category_id === data.category_id && p.id !== data.id)
        .slice(0, 3);
    setRelatedProducts(related);
    setLoading(false);
  }, [productId, products, navigateTo]);

  const fetchReviews = useCallback(async () => {
    setIsLoadingReviews(true);
    let query = supabase!
        .from('reviews')
        .select('*')
        .eq('product_id', productId);
    
    switch (sortOption) {
        case 'newest': query = query.order('created_at', { ascending: false }); break;
        case 'oldest': query = query.order('created_at', { ascending: true }); break;
        case 'highest': query = query.order('rating', { ascending: false }); break;
        case 'lowest': query = query.order('rating', { ascending: true }); break;
        default: query = query.order('created_at', { ascending: false });
    }

    const { data, error } = await query;
    if (!error && data) {
        setReviews(data as Review[]);
        if (user) setUserHasReviewed(data.some((r: any) => r.user_id === user.id));
    }
    setIsLoadingReviews(false);
  }, [productId, user, sortOption]);
  

  useEffect(() => {
    window.scrollTo(0, 0);
    fetchFullProduct();
    fetchReviews();
    setQuantity(1);
    setActiveImageIndex(0);
  }, [productId, fetchFullProduct, fetchReviews]);


  const handleSubmitReview = async (e: React.FormEvent) => {
    e.preventDefault();
    if (reviewRating === 0 || !user) return;
    setIsSubmitting(true);
    const { error } = await supabase!.from('reviews').insert({ product_id: productId, user_id: user.id, user_name: user.name, rating: reviewRating, review_text: reviewText.trim() || null });
    if (!error) {
        setReviewRating(0); setReviewText(''); setShowReviewForm(false);
        fetchReviews(); fetchFullProduct();
    }
    setIsSubmitting(false);
  };
  
  const currentCartItem = selectedVariant ? cart.find(item => item.variantId === selectedVariantId) : null;
  const currentQuantityInCart = currentCartItem?.quantity || 0;
  const effectiveStock = selectedVariant?.stock_quantity || 0;
  const availableToAdd = effectiveStock - currentQuantityInCart;
  const canAddToCart = selectedVariant ? availableToAdd > 0 : false;

  useEffect(() => {
      if (quantity > availableToAdd) setQuantity(Math.max(1, availableToAdd));
  }, [selectedVariantId, availableToAdd, quantity]);


  if (loading) return <div className="min-h-screen flex items-center justify-center bg-hav-cream"><LoadingSpinner /></div>;
  if (!product) return null;
  
  const nextImage = () => setActiveImageIndex((prevIndex) => (prevIndex + 1) % product.image_urls.length);
  const prevImage = () => setActiveImageIndex((prevIndex) => (prevIndex - 1 + product.image_urls.length) % product.image_urls.length);

  const calculatePriceBreakdown = (totalPrice: number, rate: number) => {
    const basePrice = totalPrice / (1 + (rate / 100));
    return { basePrice, gstAmount: totalPrice - basePrice };
  };

  const { basePrice, gstAmount } = selectedVariant ? calculatePriceBreakdown(selectedVariant.price, product.gst_rate) : { basePrice: 0, gstAmount: 0 };
  
  const TabButton: React.FC<{tabName: Tab, label: string, count?: number}> = ({tabName, label, count}) => (
     <button onClick={() => setActiveTab(tabName)} className={`px-4 py-2 font-semibold text-sm rounded-t-lg transition-colors flex items-center gap-2 ${activeTab === tabName ? 'bg-hav-orange-50 text-hav-forest border-t border-x border-hav-olive/20' : 'text-hav-olive/70 hover:text-hav-forest hover:bg-hav-orange-50/50 bg-hav-cream border-b border-hav-olive/20'}`}>
      {label} {typeof count !== 'undefined' && <span className="bg-hav-forest text-hav-gold text-xs font-bold px-2 py-0.5 rounded-full">{count}</span>}
     </button>
  );

  const getInitials = (name: string) => name.split(' ').map(n => n[0]).slice(0, 2).join('').toUpperCase();
  const productUrl = window.location.href;
  const encodedUrl = encodeURIComponent(productUrl);
  const encodedText = encodeURIComponent(`Check out ${product.name} from Havikar!`);
  const allVariantsOutOfStock = product.product_variants.every(v => v.stock_quantity <= 0);

  return (
    <article className="bg-hav-cream min-h-screen">
      <main className="container mx-auto px-4 py-16">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">
          <div className="bg-hav-cream p-2 rounded lg:sticky top-24">
            <div className="relative border border-hav-olive/10 rounded-lg bg-hav-cream p-4">
              {allVariantsOutOfStock && <span className="absolute top-2 left-2 bg-red-700 text-white text-xs font-bold px-3 py-1 rounded z-10">OUT OF STOCK</span>}
              {product.is_vegan && !allVariantsOutOfStock && <span className="absolute top-2 left-2 bg-hav-sage text-hav-forest border border-hav-forest/20 text-xs font-bold px-3 py-1 rounded z-10">VEGAN</span>}
              <div className="aspect-square w-full flex items-center justify-center overflow-hidden relative">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeImageIndex}
                      initial={{ opacity: 0, x: 20 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -20 }}
                      transition={{ duration: 0.3 }}
                      className="w-full h-full"
                    >
                      <ProductImageZoom src={product.image_urls[activeImageIndex]} alt={`Havikar ${product.name}`} />
                    </motion.div>
                  </AnimatePresence>
              </div>
               {product.image_urls.length > 1 && (
                  <>
                    <button onClick={prevImage} className="absolute top-1/2 left-2 -translate-y-1/2 bg-hav-forest text-hav-gold p-2 rounded-full hover:bg-hav-forest/90 transition-colors shadow-md z-10" aria-label="Previous image"><ChevronLeftIcon className="w-6 h-6" /></button>
                    <button onClick={nextImage} className="absolute top-1/2 right-2 -translate-y-1/2 bg-hav-forest text-hav-gold p-2 rounded-full hover:bg-hav-forest/90 transition-colors shadow-md z-10" aria-label="Next image"><ChevronRightIcon className="w-6 h-6" /></button>
                  </>
                )}
            </div>
            {product.image_urls.length > 1 && (
              <div className="flex gap-2 mt-4 justify-center">
                {product.image_urls.map((url, index) => (
                  <button key={index} onClick={() => setActiveImageIndex(index)} className={`w-20 h-20 rounded overflow-hidden border-2 transition-all duration-200 ${activeImageIndex === index ? 'border-hav-gold ring-1 ring-hav-gold' : 'border-transparent hover:border-hav-olive/20'}`}><img src={url} alt={`Havikar thumbnail ${index + 1}`} className="w-full h-full object-cover mix-blend-multiply" loading="lazy" /></button>
                ))}
              </div>
            )}
          </div>

          <div className="pt-0">
            <h1 className="text-2xl md:text-3xl font-serif font-bold text-hav-forest leading-tight">{product.name}</h1>
            
            <div className="flex items-center my-2" aria-label={`Rating: ${product.average_rating || 0} out of 5 stars`}>
                <StarRating rating={product.average_rating || 0} size={16} />
                <span className="ml-2 text-hav-olive text-xs font-medium">({product.review_count || 0} Reviews)</span>
            </div>

            <div className="bg-gradient-to-br from-hav-forest to-hav-olive text-hav-gold p-6 rounded-2xl border border-hav-gold/30 my-4 shadow-xl transform hover:scale-[1.02] transition-transform">
                {selectedVariant ? (
                    <div className="flex flex-col">
                        <div className="flex items-baseline gap-3">
                            <span className="text-4xl md:text-5xl font-black drop-shadow-[0_2px_10px_rgba(201,162,54,0.3)]">₹{(selectedVariant.price || 0).toFixed(2)}</span>
                            {selectedVariant.mrp && selectedVariant.mrp > selectedVariant.price && (
                                <s className="text-hav-gold/40 text-lg font-bold">₹{selectedVariant.mrp.toFixed(2)}</s>
                            )}
                        </div>
                        <div className="flex items-center gap-2 mt-2">
                             <span className="text-[10px] text-hav-gold font-black uppercase tracking-widest bg-white/10 px-2 py-0.5 rounded">MRP (inclusive of all taxes)</span>
                             {selectedVariant.mrp && selectedVariant.mrp > selectedVariant.price && (
                                 <span className="bg-red-500 text-white text-[9px] font-black px-2 py-0.5 rounded animate-bounce">
                                     SAVE {Math.round((1 - selectedVariant.price/selectedVariant.mrp) * 100)}%
                                 </span>
                             )}
                        </div>
                    </div>
                ) : (
                    <p className="text-lg font-bold text-hav-gold">Price unavailable</p>
                )}
            </div>

            {product.product_variants.length > 1 && (
                <div className="mb-4">
                    <p className="block text-[10px] font-black uppercase tracking-widest text-hav-forest mb-2">Available in:</p>
                    <div className="flex flex-wrap gap-1.5">
                        {product.product_variants.map(variant => (
                            <button 
                                key={variant.id} 
                                onClick={() => setSelectedVariantId(variant.id)} 
                                className={`px-4 py-2 rounded-lg border transition-all duration-200 text-xs font-bold ${selectedVariantId === variant.id ? 'bg-hav-forest text-hav-gold border-hav-forest shadow-md' : 'bg-white text-hav-olive border-hav-olive/20 hover:border-hav-gold'}`}
                                disabled={variant.stock_quantity <= 0}
                            >
                                {variant.net_weight}
                            </button>
                        ))}
                    </div>
                </div>
            )}

            <div className="my-4"><ProductHighlights /></div>

            <div className="flex items-center space-x-3 mb-4">
                <div className="flex items-center border-2 border-hav-forest/20 rounded-lg bg-white overflow-hidden">
                    <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="px-4 py-2 text-lg font-bold text-hav-forest hover:bg-hav-orange-50 disabled:text-gray-300" disabled={!canAddToCart || quantity <= 1}>-</button>
                    <span className="px-4 py-2 font-black text-hav-forest text-base min-w-[3rem] text-center">{canAddToCart ? quantity : 0}</span>
                    <button onClick={() => setQuantity(q => q + 1)} className="px-4 py-2 text-lg font-bold text-hav-forest hover:bg-hav-orange-50 disabled:text-gray-300" disabled={!canAddToCart || quantity >= availableToAdd}>+</button>
                </div>
                <button onClick={() => selectedVariant && addToCart(product, selectedVariant, quantity)} disabled={!canAddToCart} className="bg-white text-hav-forest border-2 border-hav-forest font-black py-3 px-6 rounded-xl hover:bg-hav-forest hover:text-hav-gold transition-all flex-grow disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-xs uppercase tracking-widest shadow-sm">{!canAddToCart ? 'Out of Stock' : 'Add to Cart'}</button>
                <button onClick={() => selectedVariant && onBuyNow(product, selectedVariant, quantity)} disabled={!canAddToCart} className="bg-hav-forest text-hav-gold font-black py-3 px-6 rounded-xl hover:brightness-110 transition-all flex-grow disabled:bg-gray-100 disabled:border-gray-300 disabled:text-gray-400 disabled:cursor-not-allowed text-xs uppercase tracking-widest shadow-xl">Buy Now</button>
            </div>

            <div className="flex items-center gap-6 mb-4">
              <button onClick={() => isInWishlist ? removeFromWishlist(productId) : addToWishlist(productId)} className="flex items-center gap-2 text-hav-olive text-[10px] font-black uppercase tracking-widest hover:text-hav-forest transition-colors"><HeartIcon className={`w-4 h-4 ${isInWishlist ? 'text-red-500 fill-current' : ''}`} />{isInWishlist ? 'Wishlisted' : 'Add to Wishlist'}</button>
            </div>
            <div className="mt-8">
              <div className="flex flex-wrap border-b border-hav-gold/20">
                <TabButton tabName="description" label="Description" />
                <TabButton tabName="ingredients" label="Ingredients" />
                <TabButton tabName="howToUse" label="How to Use" />
                <TabButton tabName="reviews" label="Reviews" count={product.review_count || 0}/>
              </div>
              <div className="p-6 bg-white border-x border-b border-hav-gold/20 rounded-b-xl">
                    {activeTab === 'description' && <p className="text-hav-olive text-sm leading-relaxed">{product.description}</p>}
                    {activeTab === 'ingredients' && (<div className="text-hav-olive text-sm"><h4 className="font-bold mb-2 text-hav-forest">Ingredients:</h4><p className="leading-relaxed mb-4">{product.ingredients?.join(', ')}.</p><h4 className="font-bold mb-2 text-hav-forest">Nutrition:</h4><ul className="list-disc list-inside space-y-1">{product.nutrition?.map(n => <li key={n.key}><strong>{n.key}:</strong> {n.value}</li>)}</ul></div>)}
                    {activeTab === 'howToUse' && <p className="text-hav-olive text-sm leading-relaxed">{product.how_to_use || 'Refer to package for specific instructions.'}</p>}
                    {activeTab === 'reviews' && (<div><div className="flex justify-between items-center mb-4"><h3 className="font-bold text-base text-hav-forest">Customer Reviews</h3><select value={sortOption} onChange={(e) => setSortOption(e.target.value as SortOption)} className="border border-hav-gold/20 rounded-md p-1.5 bg-white text-xs text-hav-olive focus:outline-none cursor-pointer"><option value="newest">Newest</option><option value="oldest">Oldest</option><option value="highest">Highest</option><option value="lowest">Lowest</option></select></div>
                             {isLoadingReviews ? (<p className="text-hav-olive text-xs">Loading reviews...</p>) : (<>{reviews.length === 0 ? (<p className="text-hav-olive text-center py-6 italic text-xs">Be the first to review!</p>) : (<div className="space-y-6">{reviews.map(review => (<div key={review.id} className="flex items-start gap-3 pb-4 border-b border-hav-gold/10 last:border-0"><div className="w-8 h-8 bg-hav-forest text-hav-gold rounded-full flex items-center justify-center font-bold flex-shrink-0 text-xs">{getInitials(review.user_name)}</div><div><div className="flex items-center gap-2 mb-0.5"><p className="font-bold text-hav-forest text-sm">{review.user_name}</p><span className="text-xs text-hav-olive/60">{new Date(review.created_at).toLocaleDateString()}</span></div><StarRating rating={review.rating} size="w-3 h-3" className="mb-1" />{review.review_text && <p className="text-hav-olive text-xs leading-relaxed">{review.review_text}</p>}</div></div>))}</div>)}
                                     <div className="mt-6 pt-6 border-t border-hav-gold/10">{!user ? (<p className="text-center text-hav-olive text-xs">Please <button onClick={() => navigateTo('login', {})} className="font-bold text-hav-forest hover:underline">log in</button> to review.</p>) : userHasReviewed ? (<p className="text-center font-semibold text-hav-forest bg-hav-sage/10 p-2 rounded border border-hav-sage text-xs">Thank you for your review!</p>) : showReviewForm ? (<form onSubmit={handleSubmitReview} className="space-y-4 bg-hav-cream/30 p-4 rounded-lg border border-hav-gold/10"><h4 className="font-bold text-sm text-hav-forest">Write Your Review</h4><div><label className="font-semibold block mb-1 text-hav-olive text-xs">Rating*</label><StarInput rating={reviewRating} setRating={setReviewRating} /></div><div><label htmlFor="reviewText" className="font-semibold block mb-1 text-hav-olive text-xs">Review</label><textarea id="reviewText" rows={3} value={reviewText} onChange={(e) => setReviewText(e.target.value)} placeholder={`How was it?`} className="w-full border border-hav-gold/20 rounded-lg p-2 bg-white focus:ring-hav-gold text-xs text-hav-olive" /></div><div className="flex items-center gap-3"><button type="submit" disabled={isSubmitting} className="bg-hav-forest hover:bg-hav-olive text-hav-gold font-bold py-1.5 px-4 rounded-lg transition-colors disabled:bg-gray-300 text-xs">{isSubmitting ? 'Submitting...' : 'Submit'}</button><button type="button" onClick={() => setShowReviewForm(false)} className="text-[10px] text-hav-olive hover:underline">Cancel</button></div></form>) : (<div className="text-center"><button onClick={() => setShowReviewForm(true)} className="bg-white text-hav-forest border border-hav-forest font-bold py-1.5 px-6 rounded-lg hover:bg-hav-forest hover:text-hav-gold transition-colors text-xs">Write a Review</button></div>)}</div>
                                 </>)}</div>)}
                </div></div></div></div>
          {relatedProducts.length > 0 && (
            <section className="mt-24 border-t border-hav-gold/10 pt-16">
              <div className="text-center mb-12">
                <span className="text-hav-gold font-bold tracking-[0.2em] uppercase text-xs mb-3 block">Complete the Experience</span>
                <h2 className="text-3xl md:text-5xl font-serif font-bold text-hav-forest tracking-tighter">You Might Also Like</h2>
                <div className="w-16 h-1 bg-hav-gold mx-auto mt-6 rounded-full"></div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {relatedProducts.map(p => (
                  <ProductCard 
                    key={p.id} 
                    product={p} 
                    navigateTo={navigateTo} 
                    isInWishlist={wishlist.includes(p.id)} 
                    onAddToWishlist={() => addToWishlist(p.id)} 
                    onRemoveFromWishlist={() => removeFromWishlist(p.id)} 
                    isInCompare={comparisonList.includes(p.id)} 
                    onAddToCompare={() => addToComparison(p.id)} 
                    onQuickView={openQuickView} 
                    onAddToCart={addToCart} 
                    onBuyNow={onBuyNow} 
                  />
                ))}
              </div>
            </section>
          )}
      </main>
    </article>
  );
};

export default ProductPage;
