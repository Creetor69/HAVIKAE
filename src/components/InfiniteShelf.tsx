import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Star, ShoppingBag, MapPin, ShieldAlert, Sparkles } from 'lucide-react';
import { Product, Page, PageContext } from '../types';

interface InfiniteShelfProps {
    products: Product[];
    navigateTo: (page: Page, context?: PageContext) => void;
    storeSettings?: any;
}

interface InfiniteShelfConfig {
    isActive: boolean;
    line1: string;
    line2: string;
    underlineText: string;
    btn1Text: string;
    btn1Page: string;
    btn1ExternalUrl: string;
    btn1_x?: number;
    btn1_y?: number;
    btn2Text: string;
    btn2Page: string;
    btn2ExternalUrl: string;
    btn2_x?: number;
    btn2_y?: number;
}

const InfiniteShelf: React.FC<InfiniteShelfProps> = ({ products, navigateTo, storeSettings }) => {
    const [config, setConfig] = useState<InfiniteShelfConfig>({
        isActive: true,
        line1: "Eat traditional.",
        line2: "Live Better.",
        underlineText: "Live Better.",
        btn1Text: "Order Today!",
        btn1Page: "shop",
        btn1ExternalUrl: "",
        btn1_x: 40,
        btn1_y: 80,
        btn2Text: "Explore Bundles",
        btn2Page: "combos",
        btn2ExternalUrl: "",
        btn2_x: 60,
        btn2_y: 80
    });

    // Sync configuration from local storage built in the admin panel
    useEffect(() => {
        const loadConfig = () => {
            try {
                // First attempt loading from DB storeSettings
                if (storeSettings && storeSettings.infinite_shelf_config) {
                    setConfig(prev => ({
                        ...prev,
                        ...storeSettings.infinite_shelf_config
                    }));
                    return;
                }

                // Fallback to localStorage
                const saved = localStorage.getItem('hav_infinite_shelf_config');
                if (saved) {
                    const parsed = JSON.parse(saved);
                    setConfig(prev => ({
                        ...prev,
                        ...parsed
                    }));
                }
            } catch (e) {
                console.warn("Could not read infinite shelf config:", e);
            }
        };

        loadConfig();
        // Respond to storage changes (e.g. from admin panel in same origin)
        window.addEventListener('storage', loadConfig);
        return () => window.removeEventListener('storage', loadConfig);
    }, [storeSettings]);

    // Ensure we have enough items for a seamless loop on any screen size
    const duplicationFactor = Math.max(10, products.length > 0 ? Math.ceil(40 / products.length) : 0);
    const shelfProducts = Array(duplicationFactor).fill(products).flat();
    
    useEffect(() => {
        if (!config.isActive) return;
        
        // Auto-center the shelf on load
        const shelfElement = document.getElementById('infinite-shelf');
        if (shelfElement) {
            const rect = shelfElement.getBoundingClientRect();
            const scrollTarget = window.scrollY + rect.top - 80;
            window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        }
    }, [products.length, config.isActive]);

    // If turned off in configuration, do not render
    if (!config.isActive) {
        return null;
    }

    const handleButtonClick = (pageKey: string, extUrl: string) => {
        if (extUrl && extUrl.trim().startsWith('http')) {
            window.open(extUrl.trim(), '_blank');
        } else {
            navigateTo(pageKey as Page);
        }
    };

    // Parse whether text should be underlined
    const renderLineText = (line: string) => {
        if (!line) return "";
        const uText = config.underlineText;
        if (uText && line.toLowerCase().includes(uText.toLowerCase())) {
            const index = line.toLowerCase().indexOf(uText.toLowerCase());
            const before = line.substring(0, index);
            const match = line.substring(index, index + uText.length);
            const after = line.substring(index + uText.length);
            return (
                <span>
                    {before}
                    <span className="italic text-hav-wheat relative inline-block mx-1">
                        {match}
                        <svg className="absolute -bottom-1 left-0 w-full h-2 text-hav-gold/60" viewBox="0 0 100 10" preserveAspectRatio="none">
                            <path d="M0 5 C 20 0, 40 10, 60 0, 80 10, 100 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                        </svg>
                    </span>
                    {after}
                </span>
            );
        }
        return line;
    };

    return (
        <section id="infinite-shelf" className="relative w-full bg-hav-forest overflow-hidden py-12 md:py-0 mt-20 sm:mt-10 md:mt-0 perspective-[1500px]">
            {/* Ambient Background Glows */}
            <div className="absolute top-0 left-1/4 w-96 h-96 bg-hav-gold/20 rounded-full blur-[120px] animate-pulse pointer-events-none"></div>
            <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-hav-wheat/15 rounded-full blur-[120px] animate-pulse delay-700 pointer-events-none"></div>

            {/* Background Texture */}
            <div 
                className="absolute inset-0 opacity-[0.05] pointer-events-none" 
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A236' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                }}
            ></div>

            {/* Row 1: Moving Left - Seamless Loop */}
            <div className="flex py-4 md:py-6 relative z-20">
                <motion.div 
                    className="flex gap-4 md:gap-8 whitespace-nowrap"
                    animate={{ x: ["0%", "-50%"] }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 80, 
                        ease: "linear" 
                    }}
                >
                    {shelfProducts.map((product, idx) => (
                        <div 
                            key={`${product.id}-row1-${idx}`}
                            onClick={() => navigateTo('product', { productId: product.slug || product.id })}
                            className="w-20 h-16 md:w-40 md:h-32 bg-white rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group relative border-2 border-white/80 hover:border-white transition-all duration-500 transform-gpu hover:scale-110 shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.9)]"
                        >
                            <div className="absolute inset-0 bg-white opacity-100"></div>
                            
                            <img 
                                src={product.image_urls[0]} 
                                alt={product.name} 
                                className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)] brightness-100 contrast-110 relative z-10"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-hav-forest/90 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-3 z-20">
                                <span className="text-hav-gold font-serif font-bold text-xs md:text-base mb-1 text-center whitespace-normal">{product.name}</span>
                                <div className="h-px w-6 bg-hav-gold/50 mb-2"></div>
                                <span className="text-hav-cream text-[8px] uppercase tracking-widest font-bold">View</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Row 2: Moving Right - Seamless Loop */}
            <div className="flex py-4 md:py-6 relative z-20">
                <motion.div 
                    className="flex gap-4 md:gap-8 whitespace-nowrap"
                    animate={{ x: ["-50%", "0%"] }}
                    transition={{ 
                        repeat: Infinity, 
                        duration: 85, 
                        ease: "linear" 
                    }}
                >
                    {shelfProducts.map((product, idx) => (
                        <div 
                            key={`${product.id}-row2-${idx}`}
                            onClick={() => navigateTo('product', { productId: product.slug || product.id })}
                            className="w-20 h-16 md:w-40 md:h-32 bg-white rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group relative border-2 border-white/80 hover:border-white transition-all duration-500 transform-gpu hover:scale-110 shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.9)]"
                        >
                            <div className="absolute inset-0 bg-white opacity-100"></div>
 
                            <img 
                                src={product.image_urls[0]} 
                                alt={product.name} 
                                className="w-full h-full object-contain p-3 group-hover:scale-110 transition-transform duration-700 ease-out drop-shadow-[0_8px_16px_rgba(0,0,0,0.2)] brightness-100 contrast-110 relative z-10"
                                referrerPolicy="no-referrer"
                                loading="lazy"
                            />
                            <div className="absolute inset-0 bg-hav-forest/90 opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col items-center justify-center p-3 z-20">
                                <span className="text-hav-gold font-serif font-bold text-xs md:text-base mb-1 text-center whitespace-normal">{product.name}</span>
                                <div className="h-px w-6 bg-hav-gold/50 mb-2"></div>
                                <span className="text-hav-cream text-[8px] uppercase tracking-widest font-bold">View</span>
                            </div>
                        </div>
                    ))}
                </motion.div>
            </div>

            {/* Floating Particles */}
            <div className="absolute inset-0 pointer-events-none overflow-hidden z-10">
                {[...Array(15)].map((_, i) => (
                    <motion.div
                        key={i}
                        className="absolute w-1 h-1 bg-hav-gold/40 rounded-full"
                        initial={{ 
                            x: Math.random() * 100 + "%", 
                            y: Math.random() * 100 + "%",
                            opacity: 0 
                        }}
                        animate={{ 
                            y: [null, "-20%"],
                            opacity: [0, 1, 0]
                        }}
                        transition={{ 
                            duration: 5 + Math.random() * 5, 
                            repeat: Infinity, 
                            delay: Math.random() * 5 
                        }}
                    />
                ))}
            </div>

            {/* Centered Overlay Text - Innovative "Spotlight" Effect */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center px-4 py-8 relative pointer-events-auto"
                >
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.6)_0%,transparent_70%)] blur-xl -z-10 scale-150"></div>

                    {/* Doodle Elements */}
                    <div className="absolute -top-6 -left-6 w-12 h-12 text-hav-gold/30 rotate-[-15deg] pointer-events-none">
                        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20,80 Q40,20 80,40 T90,90" strokeLinecap="round" />
                            <circle cx="20" cy="80" r="3" fill="currentColor" />
                        </svg>
                    </div>

                    <h1 
                        className="text-4xl md:text-6xl lg:text-7xl font-serif font-bold text-hav-gold tracking-tight leading-[1.2] relative mb-6"
                        style={{
                            textShadow: `
                                0 0 10px rgba(0,0,0,0.8),
                                0 2px 4px rgba(0,0,0,0.9)
                            `
                        }}
                    >
                        <div className="absolute -top-4 left-1/4 w-8 h-8 text-hav-gold/40 opacity-50">
                            <svg viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10,40 C10,10 40,10 40,40 S10,40 25,25" strokeLinecap="round" />
                            </svg>
                        </div>

                        {renderLineText(config.line1)} <br />
                        {renderLineText(config.line2)}

                        <div className="absolute -bottom-2 -right-6 w-6 h-6 text-hav-wheat/40 opacity-50">
                            <svg viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5,45 Q25,5 45,45 M25,5 L25,45" strokeLinecap="round" />
                            </svg>
                        </div>
                    </h1>
                    
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-8 relative w-full md:min-h-[4rem]">
                        {config.btn1Text && (
                            <button 
                                onClick={() => handleButtonClick(config.btn1Page, config.btn1ExternalUrl)}
                                className="w-full sm:w-auto px-8 py-3 bg-hav-gold text-hav-forest font-bold tracking-wider uppercase text-sm rounded-full shadow-[0_0_20px_rgba(201,162,54,0.4)] hover:shadow-[0_0_30px_rgba(201,162,54,0.6)] hover:scale-105 transition-all duration-300 md:absolute border-2 border-transparent"
                                style={{
                                    left: config.btn1_x !== undefined ? `${config.btn1_x}%` : '40%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: (config as any).btn1BgColor || undefined,
                                    color: (config as any).btn1TextColor || undefined,
                                    borderColor: (config as any).btn1BorderColor || undefined,
                                    borderRadius: (config as any).btn1BorderRadius === 'sharp' ? '0px' :
                                                  (config as any).btn1BorderRadius === 'rounded-sm' ? '4px' :
                                                  (config as any).btn1BorderRadius === 'rounded' ? '8px' :
                                                  (config as any).btn1BorderRadius === 'rounded-xl' ? '14px' :
                                                  (config as any).btn1BorderRadius === 'pill' ? '9999px' : undefined
                                }}
                            >
                                {config.btn1Text}
                            </button>
                        )}
                        {config.btn2Text && (
                            <button 
                                onClick={() => handleButtonClick(config.btn2Page, config.btn2ExternalUrl)}
                                className="w-full sm:w-auto px-8 py-3 bg-black/40 backdrop-blur-sm border-2 border-hav-gold text-hav-gold font-bold tracking-wider uppercase text-sm rounded-full hover:bg-hav-gold/10 hover:scale-105 transition-all duration-300 md:absolute"
                                style={{
                                    left: config.btn2_x !== undefined ? `${config.btn2_x}%` : '60%',
                                    transform: 'translateX(-50%)',
                                    backgroundColor: (config as any).btn2BgColor || undefined,
                                    color: (config as any).btn2TextColor || undefined,
                                    borderColor: (config as any).btn2BorderColor || undefined,
                                    borderRadius: (config as any).btn2BorderRadius === 'sharp' ? '0px' :
                                                  (config as any).btn2BorderRadius === 'rounded-sm' ? '4px' :
                                                  (config as any).btn2BorderRadius === 'rounded' ? '8px' :
                                                  (config as any).btn2BorderRadius === 'rounded-xl' ? '14px' :
                                                  (config as any).btn2BorderRadius === 'pill' ? '9999px' : undefined
                                }}
                            >
                                {config.btn2Text}
                            </button>
                        )}
                    </div>
                </motion.div>
            </div>

            {/* Trust Strip - Custom designed as requested for key markers with Star indicators */}
            <div className="relative z-50 flex justify-center -mt-6 pb-6 w-full">
                <div className="bg-[#F5F1E5] py-4 px-6 md:py-5 md:px-12 rounded-3xl md:rounded-full border border-hav-gold/40 shadow-[0_10px_40px_rgba(0,0,0,0.25)] w-11/12 md:max-w-max">
                    <div className="flex flex-wrap items-center justify-center gap-4 md:gap-10">
                        {/* Rating Card with Gold Stars - Hidden on mobile */}
                        <div className="hidden sm:flex items-center gap-2.5 group">
                            <div className="bg-white p-2 rounded-full border border-hav-gold/20 flex items-center justify-center shadow-xs">
                                <Star className="w-4 h-4 text-amber-500" fill="currentColor" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[11px] md:text-sm font-black text-hav-forest drop-shadow-sm leading-none flex items-center gap-1">
                                    ⭐⭐⭐⭐⭐ <span className="text-amber-600 ml-1">4.8/5 Rating</span>
                                </span>
                            </div>
                        </div>

                        {/* Orders Delivered - Hidden on mobile */}
                        <div className="hidden sm:flex items-center gap-2.5 group">
                            <div className="bg-white p-2 rounded-full border border-hav-gold/20 flex items-center justify-center shadow-xs">
                                <ShoppingBag className="w-4 h-4 text-hav-forest" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[10px] md:text-xs font-black uppercase tracking-widest text-[#0F4A3C]">Over 1000+ Orders Delivered</span>
                            </div>
                        </div>

                        {/* Made in Karnataka - Shown on all sizes with size adaptation */}
                        <div className="flex items-center gap-2 group">
                            <div className="bg-white p-1.5 md:p-2 rounded-full border border-hav-gold/20 flex items-center justify-center shadow-xs">
                                <MapPin className="w-3.5 h-3.5 md:w-4 md:h-4 text-orange-600" fill="currentColor" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-orange-700">Made in Karnataka</span>
                            </div>
                        </div>

                        {/* Divider for mobile */}
                        <div className="sm:hidden text-hav-gold/40">•</div>

                        {/* No Preservatives - Shown on all sizes with size adaptation */}
                        <div className="flex items-center gap-2 group">
                            <div className="bg-white p-1.5 md:p-2 rounded-full border border-hav-gold/20 flex items-center justify-center shadow-xs">
                                <ShieldAlert className="w-3.5 h-3.5 md:w-4 md:h-4 text-green-700" />
                            </div>
                            <div className="flex flex-col text-left">
                                <span className="text-[9px] md:text-xs font-black uppercase tracking-widest text-green-800">No Preservatives</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.3)_100%)] pointer-events-none z-20"></div>
        </section>
    );
};

export default InfiniteShelf;
