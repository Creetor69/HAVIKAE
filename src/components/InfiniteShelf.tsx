
import React, { useEffect } from 'react';
import { motion } from 'framer-motion';
import { Product, Page, PageContext } from '../types';

interface InfiniteShelfProps {
    products: Product[];
    navigateTo: (page: Page, context?: PageContext) => void;
}

const InfiniteShelf: React.FC<InfiniteShelfProps> = ({ products, navigateTo }) => {
    // Ensure we have enough items for a seamless loop on any screen size
    const duplicationFactor = Math.max(10, products.length > 0 ? Math.ceil(40 / products.length) : 0);
    const shelfProducts = Array(duplicationFactor).fill(products).flat();
    
    useEffect(() => {
        // Auto-center the shelf on load
        const shelfElement = document.getElementById('infinite-shelf');
        if (shelfElement) {
            const rect = shelfElement.getBoundingClientRect();
            // Scroll to the top of the shelf minus header height (approx 80px) so it fits in screen
            const scrollTarget = window.scrollY + rect.top - 80;
            window.scrollTo({ top: scrollTarget, behavior: 'smooth' });
        }
    }, [products.length]); // Re-center if products load later

    return (
        <section id="infinite-shelf" className="relative w-full bg-hav-forest overflow-hidden py-0 perspective-[1500px]">
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

            {/* Row 1: Moving Left - Seamless Loop (Slower) - MOVED TO MIDDLE LAYER */}
            <div className="flex py-10 md:py-16 relative z-20">
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
                            className="w-24 h-20 md:w-56 md:h-44 bg-white rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group relative border-2 border-white/80 hover:border-white transition-all duration-500 transform-gpu hover:scale-110 shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.9)]"
                        >
                            {/* Card Highlight - Brighter card background */}
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

            {/* Row 2: Moving Right - Seamless Loop (Slower) - MOVED TO MIDDLE LAYER */}
            <div className="flex py-10 md:py-16 relative z-20">
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
                            className="w-24 h-20 md:w-56 md:h-44 bg-white rounded-xl overflow-hidden flex-shrink-0 cursor-pointer group relative border-2 border-white/80 hover:border-white transition-all duration-500 transform-gpu hover:scale-110 shadow-[0_0_25px_rgba(255,255,255,0.4)] hover:shadow-[0_0_50px_rgba(255,255,255,0.9)]"
                        >
                            {/* Card Highlight - Brighter card background */}
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

            {/* Floating Particles for Immersion */}
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

            {/* Centered Overlay Text - Innovative "Tracing" & "Spotlight" Effect with Doodles - MOVED TO FRONT FOR MOBILE CLARITY */}
            <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-50">
                <motion.div 
                    initial={{ opacity: 0, scale: 0.9, y: 30 }}
                    animate={{ opacity: 1, scale: 1, y: 0 }}
                    transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                    className="text-center px-4 py-8 relative"
                >
                    {/* Softer Radial Spotlight - Reduced intensity to let products shine */}
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(0,0,0,0.4)_0%,transparent_70%)] blur-xl -z-10 scale-150"></div>

                    {/* Hand-drawn Arrow CTA - Innovative Doodle (Orange, Flipped, Left) - MOVED DOWN */}
                    <motion.div 
                        className="absolute top-12 -left-12 md:-left-24 w-24 md:w-32 text-orange-500 hidden sm:block"
                        animate={{ 
                            y: [0, -10, 0],
                            rotate: [-15, -10, -15]
                        }}
                        transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <div className="relative">
                            <span className="absolute -top-8 right-0 w-full font-sans font-bold text-[10px] md:text-xs text-white bg-orange-500 px-3 py-1 rounded-full whitespace-nowrap text-center shadow-[0_0_15px_rgba(249,115,22,0.8)] border border-orange-300 animate-pulse">Tap to explore</span>
                            <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                                <path d="M80,20 C60,20 20,40 30,80" />
                                <path d="M20,70 L30,80 L40,70" />
                            </svg>
                        </div>
                    </motion.div>

                    {/* Mobile Arrow CTA (Orange) - POSITIONED EXACTLY ABOVE 'PURITY' - DOODLE STYLE */}
                    <motion.div 
                        className="absolute -top-12 left-[15%] w-24 text-orange-500 sm:hidden flex flex-col items-center"
                        animate={{ 
                            y: [0, -6, 0],
                            rotate: [-10, -5, -10]
                        }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                    >
                        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="4" strokeLinecap="round" className="w-12 h-12">
                            {/* Curved arrow arching upwards towards products */}
                            <path d="M80,80 C80,30 40,20 20,20" />
                            <path d="M35,10 L20,20 L35,35" />
                        </svg>
                        <span className="block font-sans font-bold text-[9px] text-white bg-orange-500 px-3 py-1 rounded-full mt-1 shadow-[0_0_15px_rgba(249,115,22,0.8)] border border-orange-300 animate-pulse whitespace-nowrap">Tap to explore</span>
                    </motion.div>

                    {/* Doodle Elements around text */}
                    <div className="absolute -top-6 -left-6 w-12 h-12 text-hav-gold/30 rotate-[-15deg]">
                        <svg viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M20,80 Q40,20 80,40 T90,90" strokeLinecap="round" />
                            <circle cx="20" cy="80" r="3" fill="currentColor" />
                        </svg>
                    </div>

                    <h1 
                        className="text-2xl md:text-5xl font-serif font-bold text-hav-gold tracking-tight leading-[1.2] relative"
                        style={{
                            textShadow: `
                                0 0 10px rgba(0,0,0,0.8),
                                0 2px 4px rgba(0,0,0,0.9)
                            `
                        }}
                    >
                        {/* Hand-drawn swirl doodle above Taste */}
                        <div className="absolute -top-4 left-1/4 w-8 h-8 text-hav-gold/40 opacity-50">
                            <svg viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M10,40 C10,10 40,10 40,40 S10,40 25,25" strokeLinecap="round" />
                            </svg>
                        </div>

                        Purity You Can <span className="italic text-hav-wheat relative inline-block">
                            Taste.
                            <svg className="absolute -bottom-1 left-0 w-full h-2 text-hav-gold/60" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 C 20 0, 40 10, 60 0, 80 10, 100 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </span><br />
                        Tradition You Can <span className="italic text-hav-wheat relative inline-block">
                            Trust.
                            <svg className="absolute -bottom-1 left-0 w-full h-2 text-hav-gold/60" viewBox="0 0 100 10" preserveAspectRatio="none">
                                <path d="M0 5 C 10 10, 30 0, 50 10, 70 0, 90 10, 100 5" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
                            </svg>
                        </span>

                        {/* Hand-drawn leaf doodle next to Trust */}
                        <div className="absolute -bottom-2 -right-6 w-6 h-6 text-hav-wheat/40 opacity-50">
                            <svg viewBox="0 0 50 50" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M5,45 Q25,5 45,45 M25,5 L25,45" strokeLinecap="round" />
                            </svg>
                        </div>
                    </h1>
                    
                    <div className="mt-8 md:mt-10 flex items-center justify-center gap-2 px-2">
                        <div className="h-[1px] w-4 md:w-16 bg-gradient-to-r from-transparent via-hav-gold/40 to-transparent"></div>
                        <div 
                            className="px-6 py-2 bg-hav-gold rounded-full border-2 border-hav-forest/20 shadow-[0_0_30px_rgba(201,162,54,0.4)] relative overflow-hidden mx-1"
                        >
                            {/* Subtle doodle inside the badge */}
                            <div className="absolute inset-0 opacity-10 pointer-events-none">
                                <svg className="w-full h-full" viewBox="0 0 100 40" preserveAspectRatio="none">
                                    <path d="M0,20 Q25,10 50,20 T100,20" stroke="black" fill="none" strokeWidth="1" />
                                </svg>
                            </div>
                            <span className="text-hav-forest font-sans font-black tracking-[0.3em] text-[10px] md:text-xs uppercase relative z-10 whitespace-nowrap">The Soul of Karnataka</span>
                        </div>
                        <div className="h-[1px] w-4 md:w-16 bg-gradient-to-l from-transparent via-hav-gold/40 to-transparent"></div>
                    </div>
                </motion.div>
            </div>

            {/* Deep Vignette & Edge Fades - REMOVED SIDES TO AVOID BLANK SPACE FEEL */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_40%,rgba(0,0,0,0.3)_100%)] pointer-events-none z-20"></div>
        </section>
    );
};

export default InfiniteShelf;
