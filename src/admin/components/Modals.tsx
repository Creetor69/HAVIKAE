
import React, { useState, useMemo, useRef, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { 
    Product, ProductUpdate, Category, ProductVariant, Coupon, CouponInsert, 
    CouponUpdate, SaleBanner, LegalDocument, LegalDocumentUpdate, ProductCombo, 
    ProductComboInsert, Recipe, RecipeInsert, PromotionalContent, PromotionalContentInsert, 
    PromotionalContentUpdate, SoldItemSummary, ProductInsert, PageContent, Order, AdminOrder,
    SaleBannerInsert, SaleBannerUpdate, NutritionInfo, RecipeUpdate, BlogPost, Profile,
    AboutSection, AboutSectionInsert, AboutSectionUpdate, OrderUpdate
} from '../types';
import { XIcon } from './Icons';
import { motion } from 'framer-motion';

const modalInputStyles = "mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2.5 px-4 bg-hav-cream text-hav-brown placeholder:text-hav-brown/60 focus:outline-none focus:ring-2 focus:ring-hav-gold/50 focus:border-hav-forest transition-all text-sm";
const whiteInputStyles = "mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2.5 px-4 bg-white text-hav-brown placeholder:text-hav-brown/60 focus:outline-none focus:ring-2 focus:ring-hav-gold/50 focus:border-hav-forest transition-all text-sm";
const primaryButtonStyles = "bg-hav-forest text-hav-gold hover:bg-hav-forest/90 hover:shadow-2xl border border-hav-gold/20 font-black py-3 px-8 rounded-full transition-all duration-300 uppercase tracking-widest text-sm";

interface ProductImageManagerProps {
    imageUrls: string[];
    onChange: (urls: string[]) => void;
}

export const ProductImageManager: React.FC<ProductImageManagerProps> = ({ imageUrls, onChange }) => {
    const [newUrl, setNewUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const safeUrls = useMemo(() => Array.isArray(imageUrls) ? imageUrls : [], [imageUrls]);

    const handleAddUrl = () => {
        const trimmed = newUrl.trim();
        if (!trimmed) return;
        if (!trimmed.startsWith('http://') && !trimmed.startsWith('https://') && !trimmed.startsWith('/')) {
            alert('Please enter a valid image URL starting with http://, https:// or /');
            return;
        }
        onChange([...safeUrls, trimmed]);
        setNewUrl('');
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        if (!file.type.startsWith('image/')) {
            alert('Please select a valid image file.');
            return;
        }

        setUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2, 15)}_${Date.now()}.${fileExt}`;
            const filePath = `product-images/${fileName}`;

            const { error: uploadError } = await supabase.storage.from('media').upload(filePath, file);
            if (uploadError) {
                throw uploadError;
            }

            const { data } = supabase.storage.from('media').getPublicUrl(filePath);
            if (data?.publicUrl) {
                onChange([...safeUrls, data.publicUrl]);
            } else {
                alert('Uploaded successfully, but failed to fetch public URL.');
            }
        } catch (error: any) {
            console.error('Error uploading product image:', error);
            alert(`Upload failed: ${error.message || error}`);
        } finally {
            setUploading(false);
            if (fileInputRef.current) {
                fileInputRef.current.value = '';
            }
        }
    };

    const handleRemoveUrl = (indexToRemove: number) => {
        onChange(safeUrls.filter((_, idx) => idx !== indexToRemove));
    };

    const handleSetCoverImage = (index: number) => {
        if (index === 0) return; // Already cover
        const updated = [...safeUrls];
        const [target] = updated.splice(index, 1);
        updated.unshift(target);
        onChange(updated);
    };

    return (
        <div id="product-images-manager" className="space-y-4">
            {/* Gallery Grid */}
            {safeUrls.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 bg-hav-cream/20 p-4 rounded-xl border border-hav-orange-100">
                    {safeUrls.map((url, idx) => (
                        <div key={idx} className="relative group rounded-lg overflow-hidden border border-hav-orange-200 bg-white aspect-square flex flex-col justify-between">
                            <img 
                                src={url} 
                                alt={`Product ${idx}`} 
                                referrerPolicy="no-referrer"
                                className="w-full h-full object-cover"
                            />
                            {/* Badges / Hover Overlay */}
                            <div className="absolute inset-0 bg-black/45 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col justify-between p-2">
                                <div className="flex justify-between items-start">
                                    {idx === 0 ? (
                                        <span className="bg-hav-gold text-hav-forest text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm">
                                            ★ Cover
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => handleSetCoverImage(idx)}
                                            className="bg-white/95 hover:bg-white text-hav-forest text-[8px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded-md shadow-sm transition-all hover:scale-105"
                                        >
                                            Cover
                                        </button>
                                    )}
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveUrl(idx)}
                                        className="bg-red-600 hover:bg-red-700 text-white rounded-full p-1 transition-colors shadow-md"
                                        title="Delete Image"
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-16v1M10 3h4m-6 3h12" />
                                        </svg>
                                    </button>
                                </div>
                                <span className="text-[7px] text-zinc-350 font-mono truncate max-w-full">
                                    {url.substring(url.lastIndexOf('/') + 1)}
                                </span>
                            </div>

                            {/* Default Static indicator */}
                            {idx === 0 && (
                                <div className="absolute bottom-1.5 left-1.5 pointer-events-none">
                                    <span className="bg-hav-forest text-hav-gold font-bold text-[7px] uppercase px-1 py-0.5 rounded-md shadow">
                                        Cover
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 border-2 border-dashed border-hav-orange-200/50 rounded-xl bg-hav-cream/10">
                    <p className="text-xs text-hav-brown/60 italic">No product images added yet. Add URLs or upload below.</p>
                </div>
            )}

            {/* Upload Button + Add URL controls */}
            <div className="space-y-3">
                <div className="flex flex-col sm:flex-row gap-2">
                    <input 
                        type="text" 
                        value={newUrl} 
                        onChange={e => setNewUrl(e.target.value)} 
                        placeholder="Paste image URL (e.g. https://...)" 
                        className="flex-1 min-w-0 border border-hav-orange-200 rounded-lg py-2 px-3 bg-hav-cream/30 text-xs text-hav-brown placeholder:text-hav-brown/40 outline-none focus:ring-1 focus:ring-hav-gold/50"
                        onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddUrl(); } }}
                    />
                    <button
                        type="button"
                        onClick={handleAddUrl}
                        className="bg-hav-forest text-hav-gold hover:bg-hav-forest/90 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all whitespace-nowrap"
                    >
                        Add URL
                    </button>
                </div>

                <div className="flex items-center gap-3">
                    <div className="relative">
                        <input 
                            type="file" 
                            accept="image/*"
                            ref={fileInputRef}
                            onChange={handleFileUpload}
                            className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                            style={{ display: uploading ? 'none' : 'block' }}
                        />
                        <button
                            type="button"
                            disabled={uploading}
                            className="bg-hav-gold text-hav-forest hover:brightness-105 font-bold px-4 py-2 rounded-lg text-xs uppercase tracking-wider transition-all inline-flex items-center gap-1.5 shadow-sm disabled:opacity-50"
                        >
                            {uploading ? "Uploading..." : "📤 Upload image"}
                        </button>
                    </div>
                    <span className="text-[10px] text-hav-brown/60">
                        Supports standard formats. Uploads to Supabase Cloud storage.
                    </span>
                </div>
            </div>
        </div>
    );
};

export const EditProductModal: React.FC<{
    product: Product; products: Product[]; onClose: () => void;
    onSaveProduct: (id: string, data: ProductUpdate) => Promise<boolean>;
    onSaveVariant: (id: string, data: any) => Promise<boolean>;
    onCreateVariant: (data: any) => Promise<boolean>;
    onDeleteVariant: (id: string) => Promise<boolean>;
    categories: Category[];
}> = ({ product, onClose, onSaveProduct, onSaveVariant, onCreateVariant, onDeleteVariant, categories }) => {
    const [formData, setFormData] = useState<ProductUpdate>({ ...product, categories: undefined, product_variants: undefined } as any);
    const [newVariantWeight, setNewVariantWeight] = useState('');
    const [newVariantPrice, setNewVariantPrice] = useState('');
    const [newVariantMrp, setNewVariantMrp] = useState('');
    const [newVariantStock, setNewVariantStock] = useState('100');
    const [isCreatingVar, setIsCreatingVar] = useState(false);

    const handleSaveBasic = async () => {
        if (await onSaveProduct(product.id, formData)) alert("Updated!");
    };

    const handleUpdateVariantInline = async (v: ProductVariant) => {
        await onSaveVariant(v.id, { net_weight: v.net_weight, price: v.price, mrp: v.mrp, stock_quantity: v.stock_quantity });
    };

    const handleAddVariant = async () => {
        if (!newVariantWeight) {
            alert("Please enter a Net Weight (e.g., '100g', '500g', or '1 Kg')");
            return;
        }
        const price = parseFloat(newVariantPrice);
        if (isNaN(price) || price <= 0) {
            alert("Please enter a valid price");
            return;
        }
        const mrp = parseFloat(newVariantMrp) || price;
        const stock = parseInt(newVariantStock) || 0;

        setIsCreatingVar(true);
        const success = await onCreateVariant({
            product_id: product.id,
            net_weight: newVariantWeight,
            price,
            mrp,
            stock_quantity: stock
        });
        setIsCreatingVar(false);

        if (success) {
            setNewVariantWeight('');
            setNewVariantPrice('');
            setNewVariantMrp('');
            setNewVariantStock('100');
        }
    };

    const handleDeleteVariantClick = async (vId: string) => {
        if (product.product_variants.length <= 1) {
            alert("Products must have at least one variant. You cannot delete the only variant.");
            return;
        }
        if (confirm("Are you sure you want to delete this variant?")) {
            await onDeleteVariant(vId);
        }
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
            <div className="bg-white p-8 md:p-12 rounded-[2rem] md:rounded-[3.5rem] shadow-2xl w-full max-w-6xl h-[90vh] flex flex-col border border-hav-gold/20">
                <div className="flex justify-between items-center mb-6 md:mb-10 flex-shrink-0">
                    <div><h3 className="text-2xl md:text-4xl font-serif font-black text-hav-forest">Product Editor</h3><p className="text-[10px] font-black uppercase tracking-[0.3em] text-hav-gold mt-2">ID: {product.id}</p></div>
                    <button onClick={onClose} className="p-2 md:p-4 hover:bg-hav-cream rounded-full transition-colors"><XIcon className="w-6 h-6 md:w-8 md:h-8" /></button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 md:gap-12 overflow-y-auto pr-2 md:pr-6 custom-scrollbar flex-grow">
                    <div className="space-y-8 md:space-y-10">
                        <section className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-hav-gold">Basic Information</h4>
                            <input value={formData.name || ''} onChange={e => setFormData({...formData, name: e.target.value})} className={modalInputStyles} placeholder="Product Name" />
                            <input value={formData.tagline || ''} onChange={e => setFormData({...formData, tagline: e.target.value})} className={modalInputStyles} placeholder="Tagline" />
                            <textarea rows={4} value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className={modalInputStyles} placeholder="Description" />
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-hav-gold">Product Images (URLs & Upload)</h4>
                            <ProductImageManager imageUrls={formData.image_urls || []} onChange={(urls) => setFormData({...formData, image_urls: urls})} />
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-hav-gold">Media & Content</h4>
                            <input value={formData.video_url || ''} onChange={e => setFormData({...formData, video_url: e.target.value})} className={modalInputStyles} placeholder="Video URL (YouTube/Vimeo)" />
                            <textarea value={formData.benefits || ''} onChange={e => setFormData({...formData, benefits: e.target.value})} className={modalInputStyles} placeholder="Benefits (one per line)" rows={3} />
                            <textarea value={formData.how_to_use || ''} onChange={e => setFormData({...formData, how_to_use: e.target.value})} className={modalInputStyles} placeholder="How to Use" rows={3} />
                        </section>

                        <section className="bg-hav-orange-50 p-6 md:p-8 rounded-3xl space-y-4">
                            <h4 className="font-black text-xs uppercase tracking-widest text-hav-forest">SEO & Meta Data</h4>
                            <input value={formData.meta_title || ''} onChange={e => setFormData({...formData, meta_title: e.target.value})} className={whiteInputStyles} placeholder="SEO Meta Title" />
                            <textarea value={formData.meta_description || ''} onChange={e => setFormData({...formData, meta_description: e.target.value})} className={whiteInputStyles} placeholder="SEO Meta Description" rows={2} />
                            <input value={formData.meta_keywords || ''} onChange={e => setFormData({...formData, meta_keywords: e.target.value})} className={whiteInputStyles} placeholder="SEO Meta Keywords (comma separated)" />
                        </section>
                    </div>

                    <div className="space-y-8 md:space-y-10">
                        <section className="bg-hav-forest p-6 md:p-8 rounded-[2rem] text-hav-gold shadow-xl">
                            <h4 className="text-xl font-serif font-bold mb-6">Variants & Pricing</h4>
                            <div className="space-y-4">
                                {product.product_variants.map(v => (
                                    <div key={v.id} className="grid grid-cols-12 gap-2 bg-white/10 p-3 rounded-xl items-end">
                                        <div className="col-span-3"><label className="text-[8px] font-black uppercase opacity-60">Weight</label><input value={v.net_weight} onChange={e => { v.net_weight = e.target.value; setFormData({...formData}); }} className="w-full bg-transparent border-b border-white/20 outline-none text-xs font-bold py-1"/></div>
                                        <div className="col-span-3"><label className="text-[8px] font-black uppercase opacity-60">Price</label><input type="number" value={v.price} onChange={e => { v.price = Number(e.target.value); setFormData({...formData}); }} className="w-full bg-transparent border-b border-white/20 outline-none text-xs font-bold py-1"/></div>
                                        <div className="col-span-2"><label className="text-[8px] font-black uppercase opacity-60">Stock</label><input type="number" value={v.stock_quantity} onChange={e => { v.stock_quantity = Number(e.target.value); setFormData({...formData}); }} className="w-full bg-transparent border-b border-white/20 outline-none text-xs font-bold py-1"/></div>
                                        <button onClick={() => handleUpdateVariantInline(v)} className="col-span-2 bg-hav-gold text-hav-forest font-black py-1.5 rounded-lg text-[8px] uppercase tracking-widest hover:brightness-110">Sync</button>
                                        <button onClick={() => handleDeleteVariantClick(v.id)} className="col-span-2 bg-red-600 hover:bg-red-700 text-white font-black py-1.5 rounded-lg text-[8px] uppercase tracking-widest transition-colors">Delete</button>
                                    </div>
                                ))}
                            </div>

                            {/* Add New Variant Sub-form */}
                            <div className="mt-8 pt-6 border-t border-white/10">
                                <h5 className="text-xs font-black uppercase tracking-wider mb-4 text-white">Add New Product Variant</h5>
                                <div className="grid grid-cols-12 gap-2 items-end">
                                    <div className="col-span-3">
                                        <label className="text-[8px] font-black uppercase text-hav-gold/80 block mb-1">Weight</label>
                                        <input 
                                            value={newVariantWeight} 
                                            onChange={e => setNewVariantWeight(e.target.value)} 
                                            placeholder="e.g., 250g" 
                                            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-xs font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-hav-gold"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[8px] font-black uppercase text-hav-gold/80 block mb-1">Price (₹)</label>
                                        <input 
                                            type="number" 
                                            value={newVariantPrice} 
                                            onChange={e => setNewVariantPrice(e.target.value)} 
                                            placeholder="Price" 
                                            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-xs font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-hav-gold"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[8px] font-black uppercase text-hav-gold/80 block mb-1">MRP (₹)</label>
                                        <input 
                                            type="number" 
                                            value={newVariantMrp} 
                                            onChange={e => setNewVariantMrp(e.target.value)} 
                                            placeholder="MRP" 
                                            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-xs font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-hav-gold"
                                        />
                                    </div>
                                    <div className="col-span-3">
                                        <label className="text-[8px] font-black uppercase text-hav-gold/80 block mb-1">Stock</label>
                                        <input 
                                            type="number" 
                                            value={newVariantStock} 
                                            onChange={e => setNewVariantStock(e.target.value)} 
                                            placeholder="100" 
                                            className="w-full bg-white/10 border border-white/20 rounded-lg p-2 text-xs font-bold text-white placeholder:text-white/40 focus:outline-none focus:border-hav-gold"
                                        />
                                    </div>
                                </div>
                                <button 
                                    onClick={handleAddVariant} 
                                    disabled={isCreatingVar}
                                    className="mt-4 w-full bg-white text-hav-forest hover:bg-hav-gold hover:text-hav-forest font-black py-2.5 rounded-xl text-xs uppercase tracking-widest transition-all shadow-md disabled:bg-gray-400 disabled:text-gray-200"
                                >
                                    {isCreatingVar ? "Adding..." : "+ Create and Add Variant"}
                                </button>
                            </div>
                        </section>

                        <section className="space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-hav-gold">Attributes</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Category</label>
                                    <select value={formData.category_id || ''} onChange={e => setFormData({...formData, category_id: e.target.value})} className={modalInputStyles}>
                                        <option value="">Select Category</option>
                                        {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Spice Level</label>
                                    <select value={formData.spice_level || 'None'} onChange={e => setFormData({...formData, spice_level: e.target.value as any})} className={modalInputStyles}>
                                        <option value="None">None</option>
                                        <option value="Mild">Mild</option>
                                        <option value="Medium">Medium</option>
                                        <option value="Hot">Hot</option>
                                    </select>
                                </div>
                            </div>
                            <div className="flex flex-wrap gap-6 py-2">
                                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={formData.is_vegan} onChange={e => setFormData({...formData, is_vegan: e.target.checked})} className="w-5 h-5 accent-hav-forest"/><span className="text-xs font-black text-hav-forest uppercase">Vegan</span></label>
                                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={formData.is_sponsored} onChange={e => setFormData({...formData, is_sponsored: e.target.checked})} className="w-5 h-5 accent-hav-forest"/><span className="text-xs font-black text-hav-forest uppercase">Staff Pick</span></label>
                                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 accent-hav-forest"/><span className="text-xs font-black text-hav-forest uppercase">Active</span></label>
                                <label className="flex items-center gap-3 cursor-pointer"><input type="checkbox" checked={formData.is_bestseller} onChange={e => setFormData({...formData, is_bestseller: e.target.checked})} className="w-5 h-5 accent-hav-forest"/><span className="text-xs font-black text-hav-forest uppercase">Bestseller</span></label>
                            </div>
                            <textarea value={formData.ingredients?.join(', ') || ''} onChange={e => setFormData({...formData, ingredients: e.target.value.split(',').map(s => s.trim())})} className={modalInputStyles} placeholder="Ingredients (comma separated)" rows={3} />
                        </section>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-hav-gold/10 flex justify-end gap-4 flex-shrink-0"><button onClick={onClose} className="px-8 py-3 bg-gray-100 rounded-full font-black text-xs uppercase tracking-widest text-gray-400">Discard</button><button onClick={handleSaveBasic} className={primaryButtonStyles}>Save Changes</button></div>
            </div>
        </div>
    );
};

export const CouponModal: React.FC<{ 
    coupon: Coupon | null; onClose: () => void; 
    onSave: (data: CouponInsert | CouponUpdate, id?: string) => Promise<boolean>;
    products: Product[]; categories: Category[];
}> = ({ coupon, onClose, onSave, products, categories }) => {
    const [formData, setFormData] = useState<CouponInsert | CouponUpdate>(coupon || {
        code: '', discount_type: 'percentage', discount_value: 0, is_active: true, 
        applicable_for_new_customers: false, min_order_count: 0, show_in_banner: true,
        show_progress_bar: true, show_custom_message: false, buy_x_category_ids: [],
        buy_x_product_ids: [], get_y_variant_ids: [], buy_x_quantity: null, get_y_quantity: null,
        display_message: '', banner_text: '', max_discount_amount: null, min_cart_value: null,
        min_order_value_for_history: null, is_sponsored: false, limit_per_customer: 1
    });

    const allVariants = useMemo(() => products.flatMap(p => p.product_variants.map(v => ({...v, p_name: p.name}))), [products]);

    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-md overflow-y-auto">
            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-hav-gold/20">
                <div className="flex justify-between items-center mb-6 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-serif font-black text-hav-forest">Advanced Coupon Engine</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-hav-gold mt-1">Configure complex discount logic</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hav-cream rounded-full transition-colors"><XIcon className="w-6 h-6 md:w-7 md:h-7"/></button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 md:gap-8 overflow-y-auto pr-2 md:pr-4 flex-grow custom-scrollbar">
                    <div className="space-y-6">
                        <section className="bg-hav-cream/30 p-6 rounded-3xl border border-hav-gold/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Core Configuration</h4>
                            <div>
                                <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Coupon Code</label>
                                <input value={formData.code || ''} onChange={e => setFormData({...formData, code: e.target.value.toUpperCase()})} className={whiteInputStyles} placeholder="e.g. WELCOME50" />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Discount Type</label>
                                    <select value={formData.discount_type} onChange={e => setFormData({...formData, discount_type: e.target.value as any})} className={whiteInputStyles}>
                                        <option value="percentage">% Percentage</option>
                                        <option value="fixed">₹ Fixed Amount</option>
                                        <option value="free_shipping">Free Shipping</option>
                                        <option value="buy_x_get_y">Buy X Get Y (BOGO)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Value</label>
                                    <input type="number" value={formData.discount_value || ''} onChange={e => setFormData({...formData, discount_value: Number(e.target.value)})} className={whiteInputStyles} placeholder="Value" />
                                </div>
                            </div>
                        </section>

                        <section className="bg-hav-orange-50/50 p-6 rounded-3xl border border-hav-gold/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Limits & Constraints</h4>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] font-black uppercase text-hav-gold mb-1 block">Min Cart Value ₹</label><input type="number" value={formData.min_cart_value || ''} onChange={e => setFormData({...formData, min_cart_value: Number(e.target.value) || null})} className={whiteInputStyles} /></div>
                                <div><label className="text-[9px] font-black uppercase text-hav-gold mb-1 block">Max Discount ₹</label><input type="number" value={formData.max_discount_amount || ''} onChange={e => setFormData({...formData, max_discount_amount: Number(e.target.value) || null})} className={whiteInputStyles} /></div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div><label className="text-[9px] font-black uppercase text-hav-gold mb-1 block">Max Per Person</label><input type="number" value={formData.limit_per_customer || ''} onChange={e => setFormData({...formData, limit_per_customer: Number(e.target.value) || null})} className={whiteInputStyles} /></div>
                                <div><label className="text-[9px] font-black uppercase text-hav-gold mb-1 block">Total Usage Limit</label><input type="number" value={formData.usage_limit || ''} onChange={e => setFormData({...formData, usage_limit: Number(e.target.value) || null})} className={whiteInputStyles} /></div>
                            </div>
                        </section>

                        <section className="bg-hav-forest/5 p-6 rounded-3xl border border-hav-forest/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-hav-forest">Audience Targeting</h4>
                            <label className="flex items-center gap-3 cursor-pointer group">
                                <div className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-all ${formData.applicable_for_new_customers ? 'bg-hav-forest border-hav-forest' : 'border-hav-gold/30 bg-white'}`}>
                                    <input type="checkbox" checked={formData.applicable_for_new_customers} onChange={e => setFormData({...formData, applicable_for_new_customers: e.target.checked})} className="hidden"/>
                                    {formData.applicable_for_new_customers && <div className="w-2 h-2 bg-hav-gold rounded-full" />}
                                </div>
                                <span className="text-xs font-black uppercase text-hav-forest">First Time Customers Only</span>
                            </label>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-hav-gold">Min Prev Orders</label>
                                    <input type="number" value={formData.min_order_count || 0} onChange={e => setFormData({...formData, min_order_count: Number(e.target.value) || 0})} className={whiteInputStyles} />
                                </div>
                                <div className="space-y-1">
                                    <label className="text-[9px] font-black uppercase text-hav-gold">Min Prev Total Amount ₹</label>
                                    <input type="number" value={formData.min_order_value_for_history || ''} onChange={e => setFormData({...formData, min_order_value_for_history: Number(e.target.value) || null})} className={whiteInputStyles} />
                                </div>
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                         {formData.discount_type === 'buy_x_get_y' && (
                            <section className="bg-hav-forest p-6 rounded-[2rem] text-hav-gold space-y-4 shadow-xl border border-hav-gold/20">
                                <div className="flex items-center gap-3 mb-2">
                                    <div className="w-8 h-8 bg-hav-gold text-hav-forest rounded-full flex items-center justify-center font-black text-xs">BOGO</div>
                                    <h4 className="text-sm font-black uppercase tracking-widest">BOGO Configuration</h4>
                                </div>
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[9px] uppercase font-black opacity-60 mb-1 block">Buy X from Categories (Multi-select)</label>
                                        <select 
                                            multiple 
                                            className="w-full bg-white/10 rounded-xl p-3 text-xs h-32 outline-none focus:ring-2 focus:ring-hav-gold/50 transition-all" 
                                            value={formData.buy_x_category_ids || []} 
                                            onChange={e => setFormData({...formData, buy_x_category_ids: Array.from(e.target.selectedOptions, (o: any) => o.value)})}
                                        >
                                            {categories.map(c => <option key={c.id} value={c.id} className="py-1">{c.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] uppercase font-black opacity-60 mb-1 block">Buy Quantity (X)</label>
                                            <input type="number" value={formData.buy_x_quantity || ''} onChange={e => setFormData({...formData, buy_x_quantity: Number(e.target.value)})} className="w-full bg-white/10 rounded-xl p-3 text-xs border border-white/10 focus:border-hav-gold/50 outline-none" />
                                        </div>
                                        <div>
                                            <label className="text-[9px] uppercase font-black opacity-60 mb-1 block">Get Quantity (Y)</label>
                                            <input type="number" value={formData.get_y_quantity || ''} onChange={e => setFormData({...formData, get_y_quantity: Number(e.target.value)})} className="w-full bg-white/10 rounded-xl p-3 text-xs border border-white/10 focus:border-hav-gold/50 outline-none" />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="text-[9px] uppercase font-black opacity-60 mb-1 block">Free Variant (Y)</label>
                                        <select 
                                            value={formData.get_y_variant_id || ''} 
                                            onChange={e => setFormData({...formData, get_y_variant_id: e.target.value, get_y_variant_ids: [e.target.value]})} 
                                            className="w-full bg-white/10 rounded-xl p-3 text-xs border border-white/10 focus:border-hav-gold/50 outline-none"
                                        >
                                            <option value="" className="text-hav-forest">Select Free Item</option>
                                            {allVariants.map(v => <option key={v.id} value={v.id} className="text-hav-forest">{v.p_name} ({v.net_weight})</option>)}
                                        </select>
                                    </div>
                                </div>
                            </section>
                        )}

                        <section className="bg-hav-cream/30 p-6 rounded-3xl border border-hav-gold/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase tracking-widest text-hav-forest">Marketing & UI</h4>
                            <div>
                                <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Banner Text</label>
                                <input value={formData.banner_text || ''} onChange={e => setFormData({...formData, banner_text: e.target.value})} className={whiteInputStyles} placeholder="e.g. Get 20% OFF on your first order!" />
                            </div>
                            <div>
                                <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Detailed Terms</label>
                                <textarea value={formData.display_message || ''} onChange={e => setFormData({...formData, display_message: e.target.value})} className={whiteInputStyles} placeholder="Detailed Message / Terms" rows={3} />
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-2">
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={formData.show_in_banner} onChange={e => setFormData({...formData, show_in_banner: e.target.checked})} className="w-5 h-5 accent-hav-forest"/>
                                    <span className="text-xs font-bold text-hav-forest">Show in Banner</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={formData.show_progress_bar} onChange={e => setFormData({...formData, show_progress_bar: e.target.checked})} className="w-5 h-5 accent-hav-forest"/>
                                    <span className="text-xs font-bold text-hav-forest">Show Progress</span>
                                </label>
                                <label className="flex items-center gap-3 cursor-pointer">
                                    <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 accent-hav-forest"/>
                                    <span className="text-xs font-bold text-hav-forest">Active Status</span>
                                </label>
                            </div>
                        </section>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-hav-gold/10 flex justify-end gap-4 flex-shrink-0">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-50 rounded-full font-black text-xs text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all">Cancel</button>
                    <button 
                        onClick={async () => {
                            const success = await onSave(formData, coupon?.id);
                            if (success) onClose();
                        }} 
                        className={primaryButtonStyles}
                    >
                        Deploy Coupon
                    </button>
                </div>
            </div>
        </div>
    );
};


export const ComboModal: React.FC<{ combo: ProductCombo | null; products: Product[]; categories: Category[]; onClose: () => void; onSave: (data: ProductComboInsert, id?: string) => Promise<boolean>; }> = ({ combo, products, onClose, onSave }) => {
    const [formData, setFormData] = useState<ProductComboInsert>(combo || { name: '', description: '', price: 0, image_url: '', is_active: true, items: [] });
    const allVariants = useMemo(() => products.flatMap(p => p.product_variants.map(v => ({...v, p_name: p.name}))), [products]);

    return (
        <div className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white p-12 rounded-[4rem] shadow-2xl w-full max-w-5xl h-[95vh] flex flex-col border border-hav-gold/20">
                <div className="flex justify-between items-center mb-8"><h3 className="text-4xl font-serif font-black text-hav-forest">Bundle Builder</h3><button onClick={onClose}><XIcon className="w-9 h-9"/></button></div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 flex-grow overflow-hidden">
                    <div className="space-y-6 overflow-y-auto pr-4">
                        <input value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className={modalInputStyles} placeholder="Bundle Name" />
                        <input type="number" value={formData.price || ''} onChange={e => setFormData({...formData, price: Number(e.target.value)})} className={modalInputStyles} placeholder="Special Combo Price" />
                        <textarea value={formData.description || ''} onChange={e => setFormData({...formData, description: e.target.value})} className={modalInputStyles} placeholder="Description" rows={5} />
                        <input value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} className={modalInputStyles} placeholder="Image URL" />
                    </div>
                    <div className="bg-hav-orange-50 p-8 rounded-[3rem] flex flex-col h-full border border-hav-gold/10">
                        <h4 className="font-black text-xs uppercase tracking-widest text-hav-forest mb-6">Pack Contents</h4>
                        <div className="space-y-3 flex-grow overflow-y-auto pr-2">
                            {formData.items.map(item => {
                                const v = allVariants.find(av => av.id === item.variant_id);
                                return (
                                    <div key={item.variant_id} className="bg-white p-4 rounded-2xl flex items-center justify-between shadow-sm border border-hav-gold/5">
                                        <div className="flex-grow pr-4"><p className="font-black text-xs text-hav-forest leading-tight truncate">{v?.p_name}</p><p className="text-[10px] text-hav-gold font-bold uppercase mt-1">{v?.net_weight}</p></div>
                                        <div className="flex items-center gap-3"><input type="number" value={item.quantity} onChange={e => setFormData({...formData, items: formData.items.map(i => i.variant_id === item.variant_id ? {...i, quantity: Math.max(1, Number(e.target.value))} : i)})} className="w-12 text-center p-1 rounded-lg border-2 border-hav-gold/10 font-black text-xs" /><button onClick={() => setFormData({...formData, items: formData.items.filter(i => i.variant_id !== item.variant_id)})} className="text-red-500"><XIcon className="w-5 h-5"/></button></div>
                                    </div>
                                );
                            })}
                        </div>
                        <div className="pt-6 mt-6 border-t border-hav-gold/10"><select onChange={e => {if(e.target.value) setFormData({...formData, items: [...formData.items, {variant_id: e.target.value, quantity: 1}]})}} className={whiteInputStyles} value=""><option value="">+ Add Individual Product</option>{allVariants.map(v => <option key={v.id} value={v.id}>{v.p_name} ({v.net_weight})</option>)}</select></div>
                    </div>
                </div>
                <div className="mt-10 flex justify-end gap-4"><button onClick={onClose} className="px-8 py-3 font-black text-xs text-gray-400">Cancel</button><button onClick={() => {onSave(formData, combo?.id); onClose();}} className={primaryButtonStyles}>Publish Pack</button></div>
            </div>
        </div>
    );
};

export const PromoContentModal: React.FC<{
    content: PromotionalContent | null; onClose: () => void;
    onSave: (data: PromotionalContentInsert | PromotionalContentUpdate, id?: string) => Promise<boolean>;
    products: Product[]; categories: Category[]; recipes: Recipe[]; blogPosts: BlogPost[];
}> = ({ content, onClose, onSave, products, categories, recipes, blogPosts }) => {
    const [formData, setFormData] = useState<PromotionalContentInsert & { text_alignment?: 'left' | 'center' | 'right'; overlay_opacity?: number }>(() => {
        const base = (content || {
            type: 'image_carousel', is_active: true, sort_order: 0, layout_style: 'full_banner',
            title: '', subtitle: '', text: '', image_url: '', button_text: '', button_link_page: '', 
            button_link_context: null, carousel_duration_seconds: 7, color_scheme: 'green'
        }) as any;
        return {
            ...base,
            text_alignment: base.text_alignment || 'left',
            overlay_opacity: base.overlay_opacity !== undefined ? base.overlay_opacity : 20
        };
    });

    const previewContainerRef = useRef<HTMLDivElement>(null);
    const contextObj = formData.button_link_context || {};
    const buttonX = contextObj.button_x !== undefined ? contextObj.button_x : 50;
    const buttonY = contextObj.button_y !== undefined ? contextObj.button_y : 80;

    // Load & manage Infinite Shelf local storage configuration inside the banner modal
    const [shelfConfig, setShelfConfig] = useState(() => {
        try {
            const saved = localStorage.getItem('hav_infinite_shelf_config');
            if (saved) {
                return JSON.parse(saved);
            }
        } catch (e) {}
        return {
            isActive: true,
            line1: "Eat traditional.",
            line2: "Live Better.",
            underlineText: "Live Better.",
            btn1Text: "Order Today!",
            btn1Page: "shop",
            btn1ExternalUrl: "",
            btn2Text: "Explore Bundles",
            btn2Page: "combos",
            btn2ExternalUrl: ""
        };
    });

    const handleSaveShelfConfig = () => {
        try {
            localStorage.setItem('hav_infinite_shelf_config', JSON.stringify(shelfConfig));
            // Trigger storage event so client pages receive updates instantly
            window.dispatchEvent(new Event('storage'));
            alert("Infinite Moving Shelf configuration saved & synced perfectly!");
        } catch (e: any) {
            alert("Error saving: " + e.message);
        }
    };

    const handleSaveBanner = async () => {
        const success = await onSave(formData, content?.id);
        if (success) {
            onClose();
        }
    };

    return (
        <div className="fixed inset-0 bg-black/85 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-[#FAF8F5] text-gray-900 rounded-[2.5rem] shadow-2xl w-full max-w-6xl border border-hav-gold/20 flex flex-col h-[90vh]">
                
                {/* Header */}
                <div className="flex justify-between items-center px-8 py-5 border-b border-gray-200 flex-shrink-0 bg-white rounded-t-[2.5rem]">
                    <div>
                        <h3 className="text-2xl font-serif font-black text-hav-forest">Advanced Hero Banner & Infinite Moving Shelf Studio</h3>
                        <p className="text-xs text-hav-gold font-bold tracking-tight uppercase">Upload visual assets, craft button target routes, and align overlays</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-gray-100 rounded-full transition-all"><XIcon className="w-7 h-7 text-gray-400 hover:text-black"/></button>
                </div>

                {/* Main Tab Container */}
                <div className="grid grid-cols-1 lg:grid-cols-12 flex-grow overflow-hidden">
                    
                    {/* Left Panel: Form controls */}
                    <div className="lg:col-span-7 overflow-y-auto p-8 space-y-8 border-r border-gray-200 custom-scrollbar">
                        
                        {/* Section A: Live Banner Maker */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-5">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <span className="bg-hav-forest text-[#FCF2D5] text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide">STUDIO A</span>
                                <h4 className="text-sm font-black uppercase text-hav-forest font-sans">Visual Hero Banner Maker</h4>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Type</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value as any})} className={modalInputStyles}>
                                        <option value="image_carousel">Hero Carousel Banner</option>
                                        <option value="text_carousel">Moving Text Ticker (Ticker)</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Theme Scheme</label>
                                    <select value={formData.color_scheme || 'green'} onChange={e => setFormData({...formData, color_scheme: e.target.value as any})} className={modalInputStyles}>
                                        <option value="green">Forest Green (Primary)</option>
                                        <option value="beige">Classic Beige (Light Contrast)</option>
                                    </select>
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Text Content Alignment</label>
                                    <select value={formData.text_alignment} onChange={e => setFormData({...formData, text_alignment: e.target.value as any})} className={modalInputStyles}>
                                        <option value="left">Left Aligned</option>
                                        <option value="center">Centered</option>
                                        <option value="right">Right Aligned</option>
                                    </select>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Overlay Contrast Tint (% Darker)</label>
                                    <input 
                                        type="range" 
                                        min="0" 
                                        max="80" 
                                        value={formData.overlay_opacity} 
                                        onChange={e => setFormData({...formData, overlay_opacity: Number(e.target.value)})} 
                                        className="w-full"
                                    />
                                    <span className="text-[10px] text-gray-500 block text-right mt-0.5">{formData.overlay_opacity}% Contrast Mask</span>
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Heading Text</label>
                                <input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className={modalInputStyles} placeholder="e.g. Delicious Tradition" />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Subtitle / Description</label>
                                <textarea value={formData.subtitle || ''} onChange={e => setFormData({...formData, subtitle: e.target.value})} className={modalInputStyles} rows={2} placeholder="e.g. Handmade spices, fresh native sweets, natural pure oils" />
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Hero Image Address (URL)</label>
                                <div className="flex gap-2">
                                    <input value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} className={modalInputStyles} placeholder="https://picsum.photos/800/600 or any image URL" />
                                </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Primary Button Text</label>
                                    <input value={formData.button_text || ''} onChange={e => setFormData({...formData, button_text: e.target.value})} className={modalInputStyles} placeholder="e.g. Shop Now" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Primary Button Target Page / Link</label>
                                    <select value={formData.button_link_page || ''} onChange={e => setFormData({...formData, button_link_page: e.target.value})} className={modalInputStyles}>
                                        <option value="">No Button Action</option>
                                        <option value="shop">/shop (Main Store Page)</option>
                                        <option value="combos">/combos (Premium Combos)</option>
                                        <option value="recipes">/recipes (Traditional Culinary Recipes)</option>
                                        <option value="blog">/blog (Stories & Posts)</option>
                                        <option value="about">/about (How We Make It)</option>
                                        <option value="influencer">/influencer (Affiliate Partner Portal)</option>
                                    </select>
                                    <p className="text-[10px] text-gray-500 mt-1 italic">Or enter a custom sub-page, specific page path, or external link directly below:</p>
                                    <input value={formData.button_link_page || ''} onChange={e => setFormData({...formData, button_link_page: e.target.value})} className="mt-1 w-full border text-xs p-2 rounded" placeholder="https://wa.me/... or specific external link" />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Display Sequence Order</label>
                                    <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})} className={modalInputStyles} />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Carousel Duration (Seconds)</label>
                                    <input type="number" value={formData.carousel_duration_seconds || 5} onChange={e => setFormData({...formData, carousel_duration_seconds: Number(e.target.value)})} className={modalInputStyles} />
                                </div>
                            </div>

                            {formData.button_text && (
                                <div className="space-y-3 bg-hav-cream/30 p-4 rounded-xl border border-hav-gold/10">
                                    <label className="text-[10px] font-black uppercase text-hav-forest mb-1 block">Button Visual Drag Location (X/Y Offsets)</label>
                                    <div className="grid grid-cols-2 gap-4">
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-500 uppercase block">Horizontal (X): {buttonX}%</label>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={buttonX} 
                                                onChange={e => setFormData(prev => ({
                                                    ...prev,
                                                    button_link_context: {
                                                        ...(prev.button_link_context || {}),
                                                        custom_position: true,
                                                        button_x: Number(e.target.value)
                                                    }
                                                }))}
                                                className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer"
                                            />
                                        </div>
                                        <div>
                                            <label className="text-[9px] font-bold text-gray-500 uppercase block">Vertical (Y): {buttonY}%</label>
                                            <input 
                                                type="range" 
                                                min="0" 
                                                max="100" 
                                                value={buttonY} 
                                                onChange={e => setFormData(prev => ({
                                                    ...prev,
                                                    button_link_context: {
                                                        ...(prev.button_link_context || {}),
                                                        custom_position: true,
                                                        button_y: Number(e.target.value)
                                                    }
                                                }))}
                                                className="w-full h-1 bg-gray-200 rounded-lg cursor-pointer"
                                            />
                                        </div>
                                    </div>
                                    <span className="text-[9px] text-gray-400 block italic leading-none">• Drag the button directly on the preview to place it, or slide below.</span>
                                </div>
                            )}

                            <div className="pt-2 flex justify-end">
                                <button onClick={handleSaveBanner} className={`${primaryButtonStyles} w-full py-4 text-sm font-extrabold`}>
                                    Save & Deploy Hero Banner
                                </button>
                            </div>
                        </div>

                        {/* Section B: Infinite Shelf Manager */}
                        <div className="bg-white p-6 rounded-2xl border border-gray-200 space-y-5">
                            <div className="flex items-center gap-2 pb-2 border-b border-gray-100">
                                <span className="bg-[#C9A236] text-black text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wide">STUDIO B</span>
                                <h4 className="text-sm font-black uppercase text-hav-forest font-sans">Infinite Moving Shelf & Floating Text Manager</h4>
                            </div>

                            <div className="flex items-center justify-between bg-hav-cream/20 p-4 rounded-xl border border-hav-gold/20">
                                <div className="space-y-0.5 text-left">
                                    <span className="text-xs font-black text-hav-forest block">Infinite Shelf Roll Status</span>
                                    <span className="text-[11px] text-gray-500 block">Completely toggle on/off the entire visual product display section on the home page.</span>
                                </div>
                                <label className="relative inline-flex items-center cursor-pointer">
                                    <input 
                                        type="checkbox" 
                                        checked={shelfConfig.isActive} 
                                        onChange={e => setShelfConfig({...shelfConfig, isActive: e.target.checked})} 
                                        className="sr-only peer"
                                    />
                                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
                                </label>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Line 1 Floating Text</label>
                                    <input value={shelfConfig.line1} onChange={e => setShelfConfig({...shelfConfig, line1: e.target.value})} className={modalInputStyles} placeholder="Line 1" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Line 2 Floating Text</label>
                                    <input value={shelfConfig.line2} onChange={e => setShelfConfig({...shelfConfig, line2: e.target.value})} className={modalInputStyles} placeholder="Line 2" />
                                </div>
                            </div>

                            <div>
                                <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Underlined Phrase / Highlight Target</label>
                                <input value={shelfConfig.underlineText} onChange={e => setShelfConfig({...shelfConfig, underlineText: e.target.value})} className={modalInputStyles} placeholder="Text to receive dynamic swirl underline style" />
                                <span className="text-[10px] text-gray-500 mt-1 block italic">Enter the exact word or sub-phrase from above to highlight with the hand-crafted dynamic gold pencil underline.</span>
                            </div>

                            <div className="border-t border-dashed border-gray-200 pt-4 space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-500">Call to Action Button 1 (Order Today!)</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Button text</label>
                                        <input value={shelfConfig.btn1Text} onChange={e => setShelfConfig({...shelfConfig, btn1Text: e.target.value})} className={modalInputStyles} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Dest Page</label>
                                        <select value={shelfConfig.btn1Page} onChange={e => setShelfConfig({...shelfConfig, btn1Page: e.target.value})} className={modalInputStyles}>
                                            <option value="shop">shop</option>
                                            <option value="combos">combos</option>
                                            <option value="recipes">recipes</option>
                                            <option value="about">about</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">External URL Link (Overrides target page if set)</label>
                                    <input value={shelfConfig.btn1ExternalUrl} onChange={e => setShelfConfig({...shelfConfig, btn1ExternalUrl: e.target.value})} className={modalInputStyles} placeholder="https://..." />
                                </div>
                            </div>

                            <div className="border-t border-dashed border-gray-200 pt-4 space-y-4">
                                <h5 className="text-[10px] font-black uppercase tracking-wider text-gray-500">Call to Action Button 2 (Explore Bundles)</h5>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Button text</label>
                                        <input value={shelfConfig.btn2Text} onChange={e => setShelfConfig({...shelfConfig, btn2Text: e.target.value})} className={modalInputStyles} />
                                    </div>
                                    <div>
                                        <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Dest Page</label>
                                        <select value={shelfConfig.btn2Page} onChange={e => setShelfConfig({...shelfConfig, btn2Page: e.target.value})} className={modalInputStyles}>
                                            <option value="shop">shop</option>
                                            <option value="combos">combos</option>
                                            <option value="recipes">recipes</option>
                                            <option value="about">about</option>
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">External URL Link (Overrides target page if set)</label>
                                    <input value={shelfConfig.btn2ExternalUrl} onChange={e => setShelfConfig({...shelfConfig, btn2ExternalUrl: e.target.value})} className={modalInputStyles} placeholder="https://..." />
                                </div>
                            </div>

                            <button onClick={handleSaveShelfConfig} className="w-full py-3 bg-[#E9A02F] hover:bg-[#C93345] text-white font-extrabold uppercase tracking-widest text-[11px] rounded-full transition-all shadow">
                                Sync Infinite Moving Shelf Config
                            </button>
                        </div>
                    </div>

                    {/* Right Panel: Interactive Visual Preview of the Banner */}
                    <div className="lg:col-span-5 bg-gray-100 p-8 flex flex-col justify-between overflow-hidden">
                        <div className="flex flex-col h-full justify-between space-y-8">
                            <div className="text-left">
                                <span className="text-[10px] uppercase font-black tracking-widest text-hav-gold/80 block">Visual WYSIWYG Sandbox</span>
                                <h4 className="text-lg font-serif font-black text-gray-800">Dynamic Banner Composition Preview</h4>
                            </div>

                            {/* Canvas Sandbox Frame */}
                            <div 
                                ref={previewContainerRef}
                                className="relative w-full aspect-[4/3] rounded-3xl bg-hav-forest text-white overflow-hidden shadow-inner border border-gray-300 flex flex-col items-center justify-center p-6 select-none bg-cover bg-center" 
                                style={{ backgroundImage: formData.image_url ? `url(${formData.image_url})` : 'none' }}
                            >
                                {/* Contrast Mask */}
                                <div className="absolute inset-0 bg-black" style={{ opacity: (formData.overlay_opacity || 20) / 100 }}></div>

                                {/* Content overlay simulating aligned layout */}
                                <div className={`relative z-10 w-full flex flex-col h-full justify-center max-w-sm ${formData.text_alignment === 'left' ? 'items-start text-left' : formData.text_alignment === 'right' ? 'items-end text-right' : 'items-center text-center'}`}>
                                    <span className="text-[8px] bg-hav-gold text-hav-forest font-black px-1.5 py-0.5 rounded uppercase tracking-widest mb-2">
                                        Live Preview
                                    </span>
                                    <h2 className="text-xl md:text-2xl font-serif font-black text-white leading-tight mb-2 drop-shadow-md">
                                        {formData.title || "Traditional South Indian Gourmet"}
                                    </h2>
                                    <p className="text-[9px] text-white/80 leading-relaxed font-light mb-4 drop-shadow-md">
                                        {formData.subtitle || "Experience pristine pure flavors made lovingly in Karnataka. Small-batch recipes with no preservatives."}
                                    </p>
                                </div>

                                {formData.button_text && (
                                    <motion.div
                                        drag
                                        dragMomentum={false}
                                        dragElastic={0}
                                        onDrag={(event, info) => {
                                            if (previewContainerRef.current) {
                                                const rect = previewContainerRef.current.getBoundingClientRect();
                                                const xPercent = ((info.point.x - rect.left) / rect.width) * 100;
                                                const yPercent = ((info.point.y - rect.top) / rect.height) * 100;
                                                const boundedX = Math.round(Math.min(Math.max(xPercent, 0), 100));
                                                const boundedY = Math.round(Math.min(Math.max(yPercent, 0), 100));
                                                setFormData(prev => ({
                                                    ...prev,
                                                    button_link_context: {
                                                        ...(prev.button_link_context || {}),
                                                        custom_position: true,
                                                        button_x: boundedX,
                                                        button_y: boundedY
                                                    }
                                                }));
                                            }
                                        }}
                                        className="absolute cursor-move active:cursor-grabbing z-30 select-none"
                                        style={{
                                            left: `${buttonX}%`,
                                            top: `${buttonY}%`,
                                            transform: 'translate(-50%, -50%)'
                                        }}
                                    >
                                        <div className="px-4 py-1.5 bg-hav-gold hover:bg-white text-hav-forest font-black uppercase text-[8px] tracking-widest rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.5)] border border-white/20 select-none flex items-center gap-1 whitespace-nowrap">
                                            <span>🎯 {formData.button_text}</span>
                                            <span className="text-[6px] bg-black/10 text-hav-forest px-1 py-0.5 rounded uppercase font-sans font-bold">DRAG ME</span>
                                        </div>
                                    </motion.div>
                                )}
                            </div>

                            {/* Info checklist for the user */}
                            <div className="p-5 bg-white border rounded-2xl text-[11px] text-gray-600 leading-relaxed space-y-2 text-left shadow-xs">
                                <p className="font-bold text-gray-800 uppercase tracking-wide">💡 Design Recommendations:</p>
                                <p>• If using a busy background image, sliding the Contrast Tint to <b>35% or above</b> ensures complete contrast readibility.</p>
                                <p>• Set target links to external structures (like <b>https://wa.me/8296925577</b>) to integrate customer service messaging seamlessly.</p>
                                <p>• Save banner configurations, and then hit save on each row to update order positions sequentially.</p>
                            </div>
                        </div>
                    </div>

                </div>

                {/* Footer Controls */}
                <div className="px-8 py-5 bg-gray-50 border-t border-gray-200 flex justify-end gap-3 flex-shrink-0 rounded-b-[2.5rem]">
                    <button onClick={onClose} className="px-6 py-3 bg-white border rounded-full text-xs font-black uppercase tracking-wider text-gray-400 hover:text-black transition-all">
                        Cancel Sandbox
                    </button>
                </div>

            </div>
        </div>
    );
};
// Helper Modals (ItemsSold, Legal, etc.) are kept but simplified for space...
export const ItemsSoldModal: React.FC<{ items: SoldItemSummary[]; onClose: () => void; }> = ({ items, onClose }) => (
    <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
        <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-2xl border border-hav-gold/20 flex flex-col h-[70vh]">
            <div className="flex justify-between items-center mb-8">
                <h3 className="text-3xl font-serif font-black text-hav-forest">Inventory Heatmap</h3>
                <button onClick={onClose}><XIcon className="w-8 h-8"/></button>
            </div>
            <div className="flex-grow overflow-y-auto space-y-2 pr-4 custom-scrollbar">
                {items.map(item => (
                    <div key={item.product_id} className="flex justify-between items-center p-4 bg-hav-cream/30 rounded-2xl border border-hav-gold/5">
                        <span className="font-bold text-hav-forest">{item.product_name}</span>
                        <span className="font-black text-hav-gold uppercase tracking-tighter">{item.total_quantity_sold} Sold</span>
                    </div>
                ))}
            </div>
        </div>
    </div>
);
export const LegalDocumentEditor: React.FC<{ doc: LegalDocument; onClose: () => void; onSave: (id: string, updates: LegalDocumentUpdate) => Promise<boolean>; }> = ({ doc, onClose, onSave }) => {
    const [c, setC] = useState(doc.content || '');
    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-5xl border border-hav-gold/20 flex flex-col h-[90vh]">
                <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-serif font-black text-hav-forest">Edit {doc.title}</h3><button onClick={onClose}><XIcon className="w-8 h-8"/></button></div>
                <textarea value={c} onChange={e => setC(e.target.value)} className="flex-grow p-8 border-2 border-hav-gold/10 rounded-3xl font-mono text-sm outline-none focus:border-hav-forest transition-all" />
                <div className="mt-8 flex justify-end gap-4"><button onClick={onClose} className="px-8 py-3 text-xs font-black text-gray-400">Cancel</button><button onClick={async () => { if(await onSave(doc.id, { content: c })) onClose(); }} className={primaryButtonStyles}>Update Document</button></div>
            </div>
        </div>
    );
};
export const SaleBannerModal: React.FC<{ banner: SaleBanner | null; products: Product[]; onClose: () => void; onSave: (data: any, id?: string) => Promise<boolean>; }> = ({ banner, onClose, onSave }) => {
    const [f, setF] = useState<any>(banner || { title: '', is_active: true, sale_start: null, sale_end: null, background_css: '' });
    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md"><div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-lg border border-hav-gold/20">
            <div className="flex justify-between items-center mb-8"><h3 className="text-3xl font-serif font-black text-hav-forest">Announcement Bar</h3><button onClick={onClose}><XIcon className="w-8 h-8"/></button></div>
            <div className="space-y-6"><input value={f.title} onChange={e => setF({...f, title: e.target.value})} className={modalInputStyles} placeholder="Banner Text" /><input value={f.background_css || ''} onChange={e => setF({...f, background_css: e.target.value})} className={modalInputStyles} placeholder="Custom CSS Gradient" /><div className="flex gap-4"><input type="datetime-local" value={f.sale_start ? f.sale_start.substring(0, 16) : ''} onChange={e => setF({...f, sale_start: e.target.value})} className={modalInputStyles} /><input type="datetime-local" value={f.sale_end ? f.sale_end.substring(0, 16) : ''} onChange={e => setF({...f, sale_end: e.target.value})} className={modalInputStyles} /></div></div>
            <div className="mt-10 flex justify-end gap-4"><button onClick={onClose} className="px-8 py-3 text-xs font-black text-gray-400">Cancel</button><button onClick={async () => { if(await onSave(f, banner?.id)) onClose(); }} className={primaryButtonStyles}>Activate Banner</button></div>
        </div></div>
    );
};
export const RecipeModal: React.FC<{ recipe: Recipe | null; products: Product[]; onClose: () => void; onSave: (data: any, id?: string) => Promise<boolean>; }> = ({ recipe, products, onClose, onSave }) => {
    const [f, setF] = useState<any>(recipe || { 
        name: '', 
        sub_heading: '', 
        description: '', 
        imageUrl: '', 
        videoUrl: '', 
        products: [], 
        ingredients: [], 
        instructions: [] 
    });

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-hav-gold/20">
                <div className="flex justify-between items-center mb-6 md:mb-8 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-serif font-black text-hav-forest">Culinary Editor</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-hav-gold mt-1">Craft recipes and link products</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hav-cream rounded-full transition-colors"><XIcon className="w-7 h-7"/></button>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 md:pr-4 flex-grow custom-scrollbar">
                    <div className="space-y-6">
                        <section className="bg-hav-cream/30 p-6 rounded-3xl border border-hav-gold/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">General Information</h4>
                            <div className="space-y-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Recipe Heading</label>
                                    <input value={f.name} onChange={e => setF({...f, name: e.target.value})} className={whiteInputStyles} placeholder="e.g. Spicy Mango Chutney" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Sub-heading</label>
                                    <input value={f.sub_heading || ''} onChange={e => setF({...f, sub_heading: e.target.value})} className={whiteInputStyles} placeholder="e.g. A traditional family secret" />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Short Description</label>
                                    <textarea value={f.description} onChange={e => setF({...f, description: e.target.value})} className={whiteInputStyles} placeholder="Describe the dish..." rows={3} />
                                </div>
                            </div>
                        </section>

                        <section className="bg-hav-orange-50/50 p-6 rounded-3xl border border-hav-gold/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Visual Assets</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Main Image URL</label>
                                    <input value={f.imageUrl} onChange={e => setF({...f, imageUrl: e.target.value})} className={whiteInputStyles} placeholder="https://..." />
                                </div>
                                <div>
                                    <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Video Link (Optional)</label>
                                    <input value={f.videoUrl || ''} onChange={e => setF({...f, videoUrl: e.target.value})} className={whiteInputStyles} placeholder="YouTube/Vimeo" />
                                </div>
                            </div>
                        </section>

                        <section className="bg-hav-forest/5 p-6 rounded-3xl border border-hav-forest/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Linked Products</h4>
                            <p className="text-[10px] text-hav-olive italic">Select products used in this recipe to show them on the recipe page.</p>
                            <select 
                                multiple 
                                className="w-full bg-white rounded-2xl p-4 text-xs h-40 border border-hav-gold/10 outline-none focus:ring-2 focus:ring-hav-gold/30 transition-all" 
                                value={f.products || []} 
                                onChange={e => setF({...f, products: Array.from(e.target.selectedOptions, (o: any) => o.value)})}
                            >
                                {products.map(p => <option key={p.id} value={p.id} className="py-1">{p.name}</option>)}
                            </select>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-white p-6 rounded-3xl border border-hav-gold/20 shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Ingredients</h4>
                            <p className="text-[10px] text-hav-gold font-bold">Enter each ingredient on a new line.</p>
                            <textarea 
                                value={f.ingredients?.join('\n') || ''} 
                                onChange={e => setF({...f, ingredients: e.target.value.split('\n').filter(s => s.trim())})} 
                                className={`${whiteInputStyles} min-h-[200px]`} 
                                placeholder="1 cup Mango&#10;2 tsp Salt&#10;..." 
                            />
                        </section>

                        <section className="bg-white p-6 rounded-3xl border border-hav-gold/20 shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Preparation Steps</h4>
                            <p className="text-[10px] text-hav-gold font-bold">Enter each step on a new line.</p>
                            <textarea 
                                value={f.instructions?.join('\n') || ''} 
                                onChange={e => setF({...f, instructions: e.target.value.split('\n').filter(s => s.trim())})} 
                                className={`${whiteInputStyles} min-h-[300px]`} 
                                placeholder="Step 1: Wash the mangoes...&#10;Step 2: Peel and dice...&#10;..." 
                            />
                        </section>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-hav-gold/10 flex justify-end gap-4 flex-shrink-0">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-50 rounded-full font-black text-xs text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all">Discard</button>
                    <button onClick={async () => { if(await onSave(f, recipe?.id)) onClose(); }} className={primaryButtonStyles}>Publish Recipe</button>
                </div>
            </div>
        </div>
    );
};

export const AboutSectionModal: React.FC<{ 
    section: AboutSection | null; onClose: () => void; 
    onSave: (data: AboutSectionInsert | AboutSectionUpdate, id?: string) => Promise<boolean>;
}> = ({ section, onClose, onSave }) => {
    const [formData, setFormData] = useState<AboutSectionInsert | AboutSectionUpdate>(section || {
        title: '', subtitle: '', content: '', image_url: '', video_url: '', 
        layout_type: 'text_left', sort_order: 0, is_active: true
    });

    return (
        <div className="fixed inset-0 bg-black/70 z-[60] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-2xl border border-hav-gold/20 flex flex-col">
                <div className="flex justify-between items-center mb-8 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-serif font-black text-hav-forest">{section ? 'Edit Section' : 'New About Section'}</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-hav-gold mt-1">Manage About page content blocks</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hav-cream rounded-full transition-colors"><XIcon className="w-6 h-6"/></button>
                </div>
                <div className="space-y-6 overflow-y-auto pr-2 custom-scrollbar">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Title</label>
                            <input value={formData.title || ''} onChange={e => setFormData({...formData, title: e.target.value})} className={modalInputStyles} placeholder="Section Title" />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Subtitle</label>
                            <input value={formData.subtitle || ''} onChange={e => setFormData({...formData, subtitle: e.target.value})} className={modalInputStyles} placeholder="Optional Subtitle" />
                        </div>
                    </div>
                    <div>
                        <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Content</label>
                        <textarea value={formData.content || ''} onChange={e => setFormData({...formData, content: e.target.value})} className={modalInputStyles} rows={5} placeholder="Main content text..." />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Image URL</label>
                            <input value={formData.image_url || ''} onChange={e => setFormData({...formData, image_url: e.target.value})} className={modalInputStyles} placeholder="https://..." />
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Video URL</label>
                            <input value={formData.video_url || ''} onChange={e => setFormData({...formData, video_url: e.target.value})} className={modalInputStyles} placeholder="YouTube/Vimeo" />
                        </div>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Layout Type</label>
                            <select value={formData.layout_type} onChange={e => setFormData({...formData, layout_type: e.target.value as any})} className={modalInputStyles}>
                                <option value="text_left">Text Left, Image Right</option>
                                <option value="text_right">Image Left, Text Right</option>
                                <option value="full_width">Full Width Text</option>
                            </select>
                        </div>
                        <div>
                            <label className="text-[10px] font-black uppercase text-hav-gold mb-1 block">Sort Order</label>
                            <input type="number" value={formData.sort_order} onChange={e => setFormData({...formData, sort_order: Number(e.target.value)})} className={modalInputStyles} />
                        </div>
                    </div>
                    <label className="flex items-center gap-3 cursor-pointer pt-2">
                        <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({...formData, is_active: e.target.checked})} className="w-5 h-5 accent-hav-forest"/>
                        <span className="text-xs font-black uppercase text-hav-forest">Active Section</span>
                    </label>
                </div>
                <div className="mt-8 pt-6 border-t border-hav-gold/10 flex justify-end gap-4 flex-shrink-0">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-50 rounded-full font-black text-xs text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all">Discard</button>
                    <button onClick={async () => { if(await onSave(formData, section?.id)) onClose(); }} className={primaryButtonStyles}>Save Section</button>
                </div>
            </div>
        </div>
    );
};

export const SiteContentEditor: React.FC<{ content: PageContent | null; onSave: (slug: string, content: any) => Promise<boolean>; onClose: () => void; }> = ({ content, onSave, onClose }) => {
    const [sections, setSections] = useState<any[]>(content?.content?.sections || []);

    const addSection = () => {
        setSections([...sections, { title: '', content: '', image_url: '', layout: 'text_left' }]);
    };

    const removeSection = (index: number) => {
        setSections(sections.filter((_, i) => i !== index));
    };

    const updateSection = (index: number, field: string, value: any) => {
        const newSections = [...sections];
        newSections[index] = { ...newSections[index], [field]: value };
        setSections(newSections);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white p-8 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-hav-gold/20">
                <div className="flex justify-between items-center mb-6 md:mb-8 flex-shrink-0">
                    <h3 className="text-2xl md:text-3xl font-serif font-black text-hav-forest">About Page Section Editor</h3>
                    <button onClick={onClose}><XIcon className="w-7 h-7"/></button>
                </div>
                <div className="flex-grow overflow-y-auto space-y-8 pr-2 md:pr-4 custom-scrollbar">
                    {sections.map((section, idx) => (
                        <div key={idx} className="bg-hav-orange-50 p-6 rounded-3xl border border-hav-gold/10 relative">
                            <button onClick={() => removeSection(idx)} className="absolute top-4 right-4 text-red-500 hover:bg-red-50 p-1 rounded">Remove</button>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="space-y-4">
                                    <input 
                                        value={section.title} 
                                        onChange={e => updateSection(idx, 'title', e.target.value)} 
                                        className={whiteInputStyles} 
                                        placeholder="Section Title" 
                                    />
                                    <textarea 
                                        value={section.content} 
                                        onChange={e => updateSection(idx, 'content', e.target.value)} 
                                        className={whiteInputStyles} 
                                        placeholder="Section Content" 
                                        rows={4} 
                                    />
                                </div>
                                <div className="space-y-4">
                                    <input 
                                        value={section.image_url} 
                                        onChange={e => updateSection(idx, 'image_url', e.target.value)} 
                                        className={whiteInputStyles} 
                                        placeholder="Image URL" 
                                    />
                                    <select 
                                        value={section.layout} 
                                        onChange={e => updateSection(idx, 'layout', e.target.value)} 
                                        className={whiteInputStyles}
                                    >
                                        <option value="text_left">Text Left, Image Right</option>
                                        <option value="text_right">Image Left, Text Right</option>
                                        <option value="full_width">Full Width Text</option>
                                    </select>
                                </div>
                            </div>
                        </div>
                    ))}
                    <button onClick={addSection} className="w-full py-4 border-2 border-dashed border-hav-gold/30 rounded-3xl text-hav-gold font-black uppercase tracking-widest hover:bg-hav-gold/5 transition-colors">+ Add New Section</button>
                </div>
                <div className="mt-8 pt-6 border-t border-hav-gold/10 flex justify-end gap-4 flex-shrink-0">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-100 rounded-full font-black text-xs text-gray-400 uppercase tracking-widest">Discard</button>
                    <button onClick={async () => { if(await onSave('about', { sections })) onClose(); }} className={primaryButtonStyles}>Publish About Page</button>
                </div>
            </div>
        </div>
    );
};
export const OrderDetailsModal: React.FC<{ 
    order: AdminOrder; 
    onClose: () => void; 
    onUpdateOrder: (id: string, updates: OrderUpdate) => Promise<boolean>;
}> = ({ order, onClose, onUpdateOrder }) => {
    const [trackingInfo, setTrackingInfo] = useState({
        tracking_id: order.tracking_id || '',
        tracking_link: order.tracking_link || '',
        courier_name: order.courier_name || ''
    });
    const [isSaving, setIsSaving] = useState(false);

    const handleSaveTracking = async () => {
        setIsSaving(true);
        const success = await onUpdateOrder(order.id, trackingInfo);
        if (success) alert("Tracking information updated!");
        setIsSaving(false);
    };

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white p-10 rounded-[3rem] shadow-2xl w-full max-w-3xl border border-hav-gold/20 max-h-[90vh] overflow-y-auto custom-scrollbar">
                <div className="flex justify-between items-center mb-8"><h3 className="text-2xl font-serif font-black text-hav-forest">Order #{order.order_number}</h3><button onClick={onClose}><XIcon className="w-8 h-8"/></button></div>
                <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div className="bg-hav-orange-50 p-6 rounded-2xl border border-hav-gold/10">
                            <h4 className="font-black text-[10px] uppercase text-hav-gold mb-3 tracking-widest">Customer Profile</h4>
                            <p className="text-sm font-bold text-hav-forest">{order.userName}</p>
                            <p className="text-xs text-hav-olive">{order.userEmail}</p>
                            <p className="text-xs text-hav-olive">Mobile: {order.shipping_address?.phone_number || order.shipping_address?.mobile || order.userMobile || 'N/A'}</p>
                        </div>
                        <div className="bg-hav-orange-50 p-6 rounded-2xl border border-hav-gold/10">
                            <h4 className="font-black text-[10px] uppercase text-hav-gold mb-3 tracking-widest">Shipping Address</h4>
                            <p className="text-sm font-bold text-hav-forest">{order.shipping_address?.name || order.userName}</p>
                            <p className="text-xs text-hav-olive">{order.shipping_address?.address_line_1}</p>
                            {order.shipping_address?.address_line_2 && <p className="text-xs text-hav-olive">{order.shipping_address?.address_line_2}</p>}
                            <p className="text-xs text-hav-olive">{order.shipping_address?.city}, {order.shipping_address?.state} - {order.shipping_address?.postal_code}</p>
                            <p className="text-xs text-hav-olive">{order.shipping_address?.country}</p>
                            <p className="text-xs text-hav-olive mt-2 font-bold text-hav-forest">Mobile: {order.shipping_address?.phone_number || order.shipping_address?.mobile || 'N/A'}</p>
                        </div>
                    </div>

                    {/* Tracking Information Section */}
                    <div className="bg-hav-forest/5 p-6 rounded-2xl border border-hav-forest/10">
                        <h4 className="font-black text-[10px] uppercase text-hav-forest mb-4 tracking-widest">Tracking Information</h4>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div>
                                <label className="text-[9px] font-black uppercase text-hav-gold mb-1 block">Courier Name</label>
                                <input 
                                    value={trackingInfo.courier_name} 
                                    onChange={e => setTrackingInfo({...trackingInfo, courier_name: e.target.value})} 
                                    className={whiteInputStyles} 
                                    placeholder="e.g. Delhivery, BlueDart"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-hav-gold mb-1 block">Tracking ID</label>
                                <input 
                                    value={trackingInfo.tracking_id} 
                                    onChange={e => setTrackingInfo({...trackingInfo, tracking_id: e.target.value})} 
                                    className={whiteInputStyles} 
                                    placeholder="Tracking Number"
                                />
                            </div>
                            <div>
                                <label className="text-[9px] font-black uppercase text-hav-gold mb-1 block">Tracking Link</label>
                                <input 
                                    value={trackingInfo.tracking_link} 
                                    onChange={e => setTrackingInfo({...trackingInfo, tracking_link: e.target.value})} 
                                    className={whiteInputStyles} 
                                    placeholder="https://..."
                                />
                            </div>
                        </div>
                        <div className="mt-4 flex justify-end">
                            <button 
                                onClick={handleSaveTracking} 
                                disabled={isSaving}
                                className="bg-hav-forest text-hav-gold px-6 py-2 rounded-full text-[10px] font-black uppercase tracking-widest hover:brightness-110 transition-all disabled:opacity-50"
                            >
                                {isSaving ? 'Saving...' : 'Update Tracking'}
                            </button>
                        </div>
                    </div>

                    <div className="bg-hav-orange-50 p-6 rounded-2xl border border-hav-gold/10">
                        <h4 className="font-black text-[10px] uppercase text-hav-gold mb-3 tracking-widest">Order Info</h4>
                        <div className="grid grid-cols-2 gap-4 text-xs">
                            <div>
                                <p className="text-hav-olive/60 uppercase font-bold tracking-tighter">Payment Method</p>
                                <p className="font-bold text-hav-forest">{order.payment_method || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-hav-olive/60 uppercase font-bold tracking-tighter">Payment ID</p>
                                <p className="font-bold text-hav-forest break-all">{order.payment_id || 'N/A'}</p>
                            </div>
                            <div>
                                <p className="text-hav-olive/60 uppercase font-bold tracking-tighter">Coupon Used</p>
                                <p className="font-bold text-hav-forest">{order.coupon_code ? `"${order.coupon_code}"` : 'None'}</p>
                            </div>
                            <div>
                                <p className="text-hav-olive/60 uppercase font-bold tracking-tighter">Discount Amount</p>
                                <p className="font-bold text-green-600">₹{(order.discount_amount || 0).toFixed(2)}</p>
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-black text-[10px] uppercase text-hav-gold mb-3 tracking-widest">Items Ordered</h4>
                        {order.items.map((item, i) => (
                            <div key={i} className="flex justify-between text-sm p-3 bg-gray-50 rounded-xl">
                                <span className="font-medium text-hav-forest">{item.name} <span className="text-xs opacity-60">({item.net_weight})</span> x {item.quantity}</span>
                                <span className="font-bold">₹{((item.price || 0) * item.quantity).toFixed(2)}</span>
                            </div>
                        ))}
                    </div>
                    <div className="space-y-2 pt-6 border-t border-hav-gold/10">
                        <div className="flex justify-between text-sm text-hav-olive font-bold">
                            <span>Subtotal</span>
                            <span>₹{((order.total || 0) - (order.shipping_amount || 0) + (order.discount_amount || 0) + (order.points_redeemed || 0)).toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm text-hav-olive font-bold">
                            <span>Shipping</span>
                            <span>₹{(order.shipping_amount || 0).toFixed(2)}</span>
                        </div>
                        {(order.discount_amount || 0) > 0 && (
                            <div className="flex justify-between text-sm text-green-600 font-bold">
                                <span>Coupon Discount</span>
                                <span>- ₹{(order.discount_amount || 0).toFixed(2)}</span>
                            </div>
                        )}
                        {(order.points_redeemed || 0) > 0 && (
                            <div className="flex justify-between text-sm text-green-600 font-bold">
                                <span>Wallet Deduction</span>
                                <span>- ₹{(order.points_redeemed || 0).toFixed(2)}</span>
                            </div>
                        )}
                        <div className="flex justify-between font-black text-2xl text-hav-forest pt-2 border-t border-hav-gold/20">
                            <span>Final Total</span>
                            <span>₹{(order.total || 0).toFixed(2)}</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
export const CreateProductModal: React.FC<{ categories: Category[]; onClose: () => void; onSave: (p: ProductInsert, v: any[]) => Promise<boolean>; }> = ({ categories, onClose, onSave }) => {
    const [p, setP] = useState<ProductInsert>({ 
        id: '', name: '', tagline: '', description: '', gst_rate: 5, 
        image_urls: [], is_vegan: false, is_sponsored: false, is_bestseller: false,
        spice_level: 'None', benefits: '', how_to_use: '', 
        ingredients: [], meta_title: '', meta_description: '', 
        meta_keywords: '', video_url: null 
    });
    const [v, setV] = useState({ net_weight: '', price: 0, mrp: 0, stock_quantity: 0 });

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col border border-hav-gold/20">
                <div className="flex justify-between items-center mb-6 md:mb-8 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-serif font-black text-hav-forest">Product Onboarding</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-hav-gold mt-1">Register a new product to the catalog</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hav-cream rounded-full transition-colors"><XIcon className="w-7 h-7"/></button>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 overflow-y-auto pr-2 md:pr-4 flex-grow custom-scrollbar">
                    <div className="space-y-6">
                        <section className="bg-hav-cream/30 p-6 rounded-3xl border border-hav-gold/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">General Information</h4>
                            <div className="space-y-4">
                                <input value={p.name} onChange={e => setP({...p, name: e.target.value})} className={whiteInputStyles} placeholder="Product Name" />
                                <input value={p.tagline} onChange={e => setP({...p, tagline: e.target.value})} className={whiteInputStyles} placeholder="Short Tagline" />
                                <textarea value={p.description} onChange={e => setP({...p, description: e.target.value})} className={whiteInputStyles} placeholder="Full Description" rows={4} />
                            </div>
                        </section>

                        <section className="bg-hav-forest/5 p-6 rounded-3xl border border-hav-forest/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Category & Attributes</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <select value={p.category_id || ''} onChange={e => setP({...p, category_id: e.target.value})} className={whiteInputStyles}>
                                    <option value="">Select Category</option>
                                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                                </select>
                                <select value={p.spice_level || 'None'} onChange={e => setP({...p, spice_level: e.target.value as any})} className={whiteInputStyles}>
                                    <option value="None">No Spice</option>
                                    <option value="Mild">Mild</option>
                                    <option value="Medium">Medium</option>
                                    <option value="Hot">Hot</option>
                                </select>
                            </div>
                            <div className="flex flex-wrap gap-6 pt-2">
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={p.is_vegan} onChange={e => setP({...p, is_vegan: e.target.checked})} className="w-4 h-4 accent-hav-forest"/><span className="text-xs font-bold text-hav-forest">Vegan</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={p.is_sponsored} onChange={e => setP({...p, is_sponsored: e.target.checked})} className="w-4 h-4 accent-hav-forest"/><span className="text-xs font-bold text-hav-forest">Staff Pick</span></label>
                                <label className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={p.is_bestseller} onChange={e => setP({...p, is_bestseller: e.target.checked})} className="w-4 h-4 accent-hav-forest"/><span className="text-xs font-bold text-hav-forest">Bestseller</span></label>
                            </div>
                        </section>

                        <section className="bg-hav-orange-50/50 p-6 rounded-3xl border border-hav-gold/10 space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Initial Variant (Pricing)</h4>
                            <div className="grid grid-cols-2 gap-4">
                                <input placeholder="Weight (e.g. 100g)" value={v.net_weight} onChange={e => setV({...v, net_weight: e.target.value})} className={whiteInputStyles} />
                                <input type="number" placeholder="Offer Price (₹)" value={v.price || ''} onChange={e => setV({...v, price: Number(e.target.value)})} className={whiteInputStyles} />
                                <input type="number" placeholder="MRP (₹)" value={v.mrp || ''} onChange={e => setV({...v, mrp: Number(e.target.value)})} className={whiteInputStyles} />
                                <input type="number" placeholder="Initial Stock" value={v.stock_quantity || ''} onChange={e => setV({...v, stock_quantity: Number(e.target.value)})} className={whiteInputStyles} />
                            </div>
                        </section>
                    </div>

                    <div className="space-y-6">
                        <section className="bg-white p-6 rounded-3xl border border-hav-gold/20 shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">SEO & Meta Data</h4>
                            <div className="space-y-4">
                                <input value={p.meta_title || ''} onChange={e => setP({...p, meta_title: e.target.value})} className={modalInputStyles} placeholder="SEO Meta Title" />
                                <textarea value={p.meta_description || ''} onChange={e => setP({...p, meta_description: e.target.value})} className={modalInputStyles} placeholder="SEO Meta Description" rows={2} />
                                <input value={p.meta_keywords || ''} onChange={e => setP({...p, meta_keywords: e.target.value})} className={modalInputStyles} placeholder="SEO Meta Keywords (comma separated)" />
                            </div>
                        </section>

                        <section className="bg-white p-6 rounded-3xl border border-hav-gold/20 shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Product Images (URLs & Upload)</h4>
                            <ProductImageManager imageUrls={p.image_urls || []} onChange={(urls) => setP({...p, image_urls: urls})} />
                        </section>

                        <section className="bg-white p-6 rounded-3xl border border-hav-gold/20 shadow-sm space-y-4">
                            <h4 className="text-[10px] font-black uppercase text-hav-forest tracking-widest">Content Details</h4>
                            <div className="space-y-4">
                                <input value={p.video_url || ''} onChange={e => setP({...p, video_url: e.target.value})} className={modalInputStyles} placeholder="Video URL (YouTube/Vimeo)" />
                                <textarea value={p.benefits || ''} onChange={e => setP({...p, benefits: e.target.value})} className={modalInputStyles} placeholder="Benefits (one per line)" rows={3} />
                                <textarea value={p.how_to_use || ''} onChange={e => setP({...p, how_to_use: e.target.value})} className={modalInputStyles} placeholder="How to Use" rows={3} />
                            </div>
                        </section>
                    </div>
                </div>
                <div className="mt-8 pt-6 border-t border-hav-gold/10 flex justify-end gap-4 flex-shrink-0">
                    <button onClick={onClose} className="px-8 py-3 bg-gray-50 rounded-full font-black text-xs text-gray-400 uppercase tracking-widest hover:bg-gray-100 transition-all">Discard</button>
                    <button onClick={async () => { if(await onSave(p, [v])) onClose(); }} className={primaryButtonStyles}>Onboard Product</button>
                </div>
            </div>
        </div>
    );
};

export const UserDetailModal: React.FC<{
    user: Profile;
    orders: Order[];
    onClose: () => void;
}> = ({ user, orders, onClose }) => {
    const userOrders = useMemo(() => orders.filter(o => o.user_id === user.id), [orders, user.id]);
    const totalSpent = useMemo(() => userOrders.reduce((sum, o) => sum + (o.total || 0), 0), [userOrders]);

    return (
        <div className="fixed inset-0 bg-black/70 z-[100] flex items-center justify-center p-4 backdrop-blur-md">
            <div className="bg-white p-6 md:p-10 rounded-[2rem] md:rounded-[3rem] shadow-2xl w-full max-w-4xl h-[85vh] flex flex-col border border-hav-gold/20">
                <div className="flex justify-between items-center mb-8 flex-shrink-0">
                    <div>
                        <h3 className="text-2xl md:text-3xl font-serif font-black text-hav-forest">User Profile</h3>
                        <p className="text-[10px] font-black uppercase tracking-widest text-hav-gold mt-1">Detailed customer information & history</p>
                    </div>
                    <button onClick={onClose} className="p-2 hover:bg-hav-cream rounded-full transition-colors"><XIcon className="w-7 h-7"/></button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8 overflow-y-auto pr-2 custom-scrollbar flex-grow">
                    <div className="md:col-span-1 space-y-6">
                        <div className="bg-hav-cream/30 p-6 rounded-3xl border border-hav-gold/10">
                            <div className="w-20 h-20 bg-hav-forest rounded-full flex items-center justify-center text-hav-gold text-3xl font-serif mb-4 mx-auto">
                                {user.name?.[0] || 'U'}
                            </div>
                            <h4 className="text-center font-black text-hav-forest text-lg">{user.name}</h4>
                            <p className="text-center text-xs text-hav-olive mb-4">{user.email}</p>
                            
                            <div className="space-y-3 pt-4 border-t border-hav-gold/10">
                                <div className="flex justify-between text-[10px] font-black uppercase text-hav-gold">
                                    <span>Mobile</span>
                                    <span className="text-hav-forest">{user.mobile || 'N/A'}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase text-hav-gold">
                                    <span>Joined</span>
                                    <span className="text-hav-forest">{new Date(user.created_at).toLocaleDateString()}</span>
                                </div>
                                <div className="flex justify-between text-[10px] font-black uppercase text-hav-gold">
                                    <span>Role</span>
                                    <span className="text-hav-forest">{user.is_admin ? 'Admin' : user.is_influencer ? 'Influencer' : 'Customer'}</span>
                                </div>
                            </div>
                        </div>

                        <div className="bg-hav-forest p-6 rounded-3xl text-hav-gold shadow-lg">
                            <h5 className="text-[10px] font-black uppercase tracking-widest mb-4 opacity-70">Lifetime Value</h5>
                            <div className="text-3xl font-serif font-black">₹{(totalSpent || 0).toFixed(2)}</div>
                            <p className="text-[10px] font-bold mt-1 opacity-60">{userOrders.length} Successful Orders</p>
                        </div>
                    </div>

                    <div className="md:col-span-2 space-y-6">
                        <h4 className="text-sm font-black uppercase tracking-widest text-hav-forest">Order History</h4>
                        <div className="space-y-3">
                            {userOrders.length > 0 ? (
                                userOrders.map(order => (
                                    <div key={order.id} className="p-4 bg-white border border-hav-gold/10 rounded-2xl flex justify-between items-center hover:shadow-md transition-shadow">
                                        <div>
                                            <p className="font-bold text-hav-forest">Order #{order.order_number}</p>
                                            <p className="text-[10px] text-hav-olive">{new Date(order.created_at).toLocaleDateString()} • {order.items.length} items</p>
                                        </div>
                                        <div className="text-right">
                                            <p className="font-black text-hav-forest">₹{(order.total || 0).toFixed(2)}</p>
                                            <span className={`text-[8px] font-black uppercase px-2 py-0.5 rounded-full ${
                                                order.status === 'delivered' ? 'bg-green-100 text-green-700' : 
                                                order.status === 'cancelled' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                                            }`}>
                                                {order.status}
                                            </span>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="text-center py-10 bg-gray-50 rounded-2xl border-2 border-dashed border-gray-200">
                                    <p className="text-sm text-gray-400 font-bold">No orders found for this user</p>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};


