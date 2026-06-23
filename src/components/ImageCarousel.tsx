import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromotionalContent, Page, PageContext, Product } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';
import { useLiteMode } from '../hooks/useLiteMode';

const slideVariants = {
  enter: {
    opacity: 0,
    scale: 1.05,
    zIndex: 1
  },
  center: {
    zIndex: 1,
    opacity: 1,
    scale: 1,
    transition: {
        duration: 1.5,
        ease: "easeInOut"
    }
  },
  exit: {
    zIndex: 0,
    opacity: 0,
    transition: {
        duration: 1.5,
        ease: "easeInOut"
    }
  }
};

const contentVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { 
        opacity: 1, 
        y: 0,
        transition: { duration: 1.0, ease: 'easeOut', delay: 0.5 }
    }
};

interface ImageCarouselProps {
  navigateTo: (page: Page, context?: PageContext) => void;
  slides: PromotionalContent[];
  durationSeconds: number; 
  theme?: 'green' | 'beige' | null;
  backgroundColor?: string | null;
  products?: Product[];
  addToCart?: (product: Product, selectedVariant: any, quantity?: number) => void;
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ navigateTo, slides, durationSeconds, theme = 'green', backgroundColor, products = [], addToCart }) => {
  const { isLiteMode } = useLiteMode();
  const [page, setPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const requestIdRef = useRef<number | null>(null);
  const pausedProgressRef = useRef<number>(0);

  const shouldPause = isPaused || isLiteMode;

  const index = Math.abs(page % slides.length);
  const slide = slides[index];

  const currentDurationSeconds = slide?.carousel_duration_seconds || durationSeconds;
  const currentDurationMs = currentDurationSeconds * 1000;

  useEffect(() => {
    if (slides.length <= 1) {
        setProgress(0);
        return;
    }

    const animate = (timestamp: number) => {
        if (shouldPause) {
            if (startTimeRef.current !== null) {
                 startTimeRef.current = timestamp - (pausedProgressRef.current / 100) * currentDurationMs;
            }
            requestIdRef.current = requestAnimationFrame(animate);
            return;
        }

        if (startTimeRef.current === null) {
            startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const newProgress = Math.min((elapsed / currentDurationMs) * 100, 100);
        
        if (Math.abs(newProgress - progress) > 0.5) {
             setProgress(newProgress);
        }
        
        pausedProgressRef.current = newProgress;

        if (elapsed >= currentDurationMs) {
            paginate(1);
            startTimeRef.current = timestamp;
            setProgress(0);
            pausedProgressRef.current = 0;
        }

        requestIdRef.current = requestAnimationFrame(animate);
    };

    requestIdRef.current = requestAnimationFrame(animate);

    return () => {
        if (requestIdRef.current) cancelAnimationFrame(requestIdRef.current);
    };
  }, [index, slides.length, currentDurationMs, shouldPause]); 

  const paginate = (newDirection: number) => {
    setPage(page + newDirection);
    startTimeRef.current = null;
    setProgress(0);
    pausedProgressRef.current = 0;
  };

  const togglePause = () => {
      setIsPaused(!isPaused);
  };

  const handleNavigation = () => {
    if (slide.button_link_page) {
      const link = slide.button_link_page;
      if (link.startsWith('http')) {
          window.open(link, '_blank');
      } else {
          navigateTo(link as Page, slide.button_link_context);
      }
    }
  }

  if (slides.length === 0) {
    return (
      <div className="relative w-full h-[60vh] md:h-[80vh] flex items-center justify-center bg-hav-cream">
         <div className="text-center p-8">
             <h1 className="text-4xl font-serif text-hav-orange-900">Welcome to Havikar</h1>
             <p className="mt-4 text-hav-brown">Authentic South Indian Foods</p>
         </div>
      </div>
    );
  }

  // Screen size dynamic layout detector
  const [activeDevice, setActiveDevice] = useState<'mobile' | 'tablet' | 'desktop' | 'widescreen'>('desktop');
  const [orientation, setOrientation] = useState<'portrait' | 'landscape'>('portrait');

  useEffect(() => {
    const checkDevice = () => {
      const width = window.innerWidth;
      const height = window.innerHeight;
      if (width < 640) {
        setActiveDevice('mobile');
      } else if (width < 1024) {
        setActiveDevice('tablet');
      } else if (width < 1440) {
        setActiveDevice('desktop');
      } else {
        setActiveDevice('widescreen');
      }
      setOrientation(height >= width ? 'portrait' : 'landscape');
    };
    checkDevice();
    window.addEventListener('resize', checkDevice);
    return () => window.removeEventListener('resize', checkDevice);
  }, []);

  // Position settings parsed from standard jsonb content
  const slideContext = slide?.button_link_context || {};
  const isCustomPosition = !!slideContext?.custom_position;

  const activeImageUrl = (() => {
    if (activeDevice === 'mobile') {
      const spec = slideContext[`image_url_mobile_${orientation}`];
      if (spec) return spec;
      const gen = slideContext.image_url_mobile;
      if (gen) return gen;
    } else if (activeDevice === 'tablet') {
      const spec = slideContext[`image_url_tablet_${orientation}`];
      if (spec) return spec;
      const gen = slideContext.image_url_tablet;
      if (gen) return gen;
    }
    return slide?.image_url;
  })();

  const getLayoutValue = (propName: string, defaultValue: any) => {
    const layouts = slideContext.layouts || {};
    let activeLayout = layouts[activeDevice] || {};
    if (activeDevice === 'widescreen' && (!activeLayout || Object.keys(activeLayout).length === 0)) {
      activeLayout = layouts['desktop'] || {};
    }
    if (activeLayout[propName] !== undefined) {
      return activeLayout[propName];
    }
    if (slideContext[propName] !== undefined) {
      return slideContext[propName];
    }
    return defaultValue;
  };

  const getLayoutButtonCoordinates = (buttonId: string, defaultX: number, defaultY: number, defaultScale?: number) => {
    const layouts = slideContext.layouts || {};
    let activeLayout = layouts[activeDevice] || {};
    if (activeDevice === 'widescreen' && (!activeLayout.buttons || activeLayout.buttons.length === 0)) {
      activeLayout = layouts['desktop'] || {};
    }
    const layoutBtns = activeLayout.buttons || [];
    const found = layoutBtns.find((b: any) => b.id === buttonId);

    const mainButtons = slideContext.buttons || [];
    const mainBtn = mainButtons.find((b: any) => b.id === buttonId) || {};

    const baseScale = mainBtn.scale !== undefined ? mainBtn.scale : (defaultScale ?? 100);
    const baseWidth = mainBtn.width;
    const baseHeight = mainBtn.height;

    if (found) {
      return {
        x: found.x !== undefined ? found.x : (mainBtn.x !== undefined ? mainBtn.x : defaultX),
        y: found.y !== undefined ? found.y : (mainBtn.y !== undefined ? mainBtn.y : defaultY),
        scale: found.scale !== undefined ? found.scale : baseScale,
        width: found.width !== undefined ? found.width : baseWidth,
        height: found.height !== undefined ? found.height : baseHeight,
      };
    }

    const deviceScaleMultiplier = activeDevice === 'mobile' ? 0.6 : activeDevice === 'tablet' ? 0.8 : 1.0;

    return { 
      x: mainBtn.x !== undefined ? mainBtn.x : defaultX, 
      y: mainBtn.y !== undefined ? mainBtn.y : defaultY, 
      scale: Math.round(baseScale * deviceScaleMultiplier),
      width: baseWidth && baseWidth > 0 ? Math.round(baseWidth * deviceScaleMultiplier) : baseWidth,
      height: baseHeight && baseHeight > 0 ? Math.round(baseHeight * deviceScaleMultiplier) : baseHeight,
    };
  };

  const buttonX = getLayoutValue('button_x', 50);
  const buttonY = getLayoutValue('button_y', 80);

  // Connected product support
  const connectedProductId = slideContext?.product_id;
  const connectedProduct = connectedProductId ? products.find(p => p.id === connectedProductId) : null;
  const showProductBadge = !!slideContext?.show_product_badge;

  const isBeige = (slideContext?.color_scheme === 'beige') || (theme === 'beige');
  const containerStyle = backgroundColor ? { backgroundColor } : {};
  const bgGradientClass = isBeige 
    ? "bg-gradient-to-br from-white/10 via-transparent to-black/5" 
    : "bg-gradient-to-br from-white/5 via-transparent to-black/20"; 

  const titleClass = isBeige ? "text-hav-forest" : "text-hav-gold";
  const subtitleClass = isBeige ? "text-hav-olive" : "text-hav-cream/90";
  const buttonClass = isBeige 
    ? "bg-hav-forest hover:bg-hav-orange-800 text-hav-gold" 
    : "bg-hav-gold hover:bg-white text-hav-forest";
  
  const textureColor = isBeige ? "#0F4A3C" : "#C9A236"; 
  const glowColor = isBeige ? "bg-hav-orange-200/40" : "bg-hav-gold/10";

  const isMobilePortrait = activeDevice === 'mobile' && orientation === 'portrait';

  const aspectClass = (() => {
    if (isMobilePortrait) {
      return 'h-auto';
    }
    const aspect = (!slideContext?.container_aspect || slideContext?.container_aspect === 'default') ? 'auto' : slideContext.container_aspect;
    if (slideContext?.image_mode === 'bg_over_content' || aspect === 'auto' || aspect === 'custom') {
      return 'h-auto';
    }
    switch (aspect) {
      case 'aspect-21/7':
        return 'h-auto aspect-[16/8] sm:aspect-[21/7] md:aspect-[21/5.7]';
      case 'aspect-16/9':
        return 'h-auto aspect-[16/8] sm:aspect-[16/7]';
      case 'aspect-4/3':
        return 'h-auto aspect-[4/3.2]';
      case 'aspect-1/1':
        return 'h-auto aspect-[1.2/1]';
      default:
        if (slideContext?.bg_fit === 'contain') {
          return 'h-auto aspect-[16/7] sm:aspect-[21/7] md:aspect-[21/5.7] max-h-[40vh] md:max-h-[45vh]';
        }
        return 'h-auto aspect-[9/13] sm:aspect-[3/3.2] md:aspect-[16/7] lg:aspect-[21/7]';
    }
  })();

  const customStyles = (() => {
    const styles: React.CSSProperties = { ...containerStyle };
    if (slideContext?.container_aspect === 'custom') {
      if (slideContext?.custom_height) {
        styles.height = slideContext.custom_height;
      }
      if (slideContext?.custom_width) {
        styles.maxWidth = slideContext.custom_width;
        styles.marginLeft = 'auto';
        styles.marginRight = 'auto';
      }
    }
    return styles;
  })();

  const handleSlideClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('a') || target.closest('.pointer-events-auto') || target.closest('[onclick]')) {
      return;
    }
    const targetPage = slideContext?.slide_link_page || slide.button_link_page;
    if (targetPage) {
      if (typeof targetPage === 'string' && targetPage.startsWith('http')) {
        window.open(targetPage, '_blank');
      } else {
        const context: PageContext = {};
        if (targetPage === 'product' && (slideContext?.slide_product_id || slideContext?.productId)) {
          context.productId = slideContext.slide_product_id || slideContext?.productId;
        } else if (targetPage === 'shop') {
          context.category = slideContext?.slide_category || slideContext?.category || slide.button_link_context?.slide_category || slide.button_link_context?.category;
        }
        navigateTo(targetPage as Page, context);
      }
    }
  };

  const isClickable = slideContext?.clickable_slide !== false;

  return (
    <div 
        onClick={isClickable ? handleSlideClick : undefined}
        className={`relative w-full ${aspectClass} overflow-hidden group ${isBeige ? 'bg-hav-cream' : 'bg-hav-forest'} ${isClickable ? 'cursor-pointer select-none' : ''}`}
        style={customStyles}
    >
      {/* Invisible relative template image to automatically resize container to perfectly match the current background image aspect ratio naturally! */}
      {(isMobilePortrait || slideContext?.image_mode === 'bg_over_content' || !slideContext?.container_aspect || slideContext?.container_aspect === 'default' || slideContext?.container_aspect === 'auto') && activeImageUrl && (
        <img 
          src={activeImageUrl}
          alt="Banner size reference"
          className="w-full h-auto opacity-0 pointer-events-none block"
          referrerPolicy="no-referrer"
        />
      )}

      <AnimatePresence initial={false}>
        <motion.div
          key={page}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          className="absolute inset-0 w-full h-full"
        >
            <div className={`absolute inset-0 ${bgGradientClass}`}></div>
            
            <div 
                className="absolute inset-0 opacity-10 pointer-events-none" 
                style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='${encodeURIComponent(textureColor)}' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
                    maskImage: 'radial-gradient(circle at center, black, transparent 80%)'
                }}
            ></div>

            {!isBeige && <div className="absolute inset-0 bg-black/20"></div>}

            {/* Full background cover mode, and Background Over Content mode if active */}
            {(slideContext.image_mode === 'bg' || slideContext.image_mode === 'bg_over_content') && activeImageUrl && (() => {
                const bgFit = slideContext.bg_fit || 'cover';
                const brightnessVal = slideContext.bg_brightness !== undefined ? slideContext.bg_brightness : 100;
                
                if (slideContext.image_mode === 'bg_over_content') {
                  return (
                    <img 
                      src={activeImageUrl}
                      alt="Background Banner"
                      className="absolute inset-0 w-full h-full object-cover select-none pointer-events-none"
                      style={{ 
                        filter: `brightness(${brightnessVal}%)`,
                        objectFit: bgFit as any
                      }}
                      referrerPolicy="no-referrer"
                    />
                  );
                }
                
                return (
                    <div 
                        className="absolute inset-0 bg-center select-none"
                        style={{ 
                            backgroundImage: `url(${activeImageUrl})`,
                            backgroundSize: bgFit,
                            backgroundRepeat: bgFit === 'contain' ? 'no-repeat' : undefined,
                            filter: `brightness(${brightnessVal}%)`
                        }}
                    />
                );
            })()}

            {/* If we are in 'draggable' mode, render the custom-positioned floating graphic */}
            {slideContext.image_mode === 'draggable' && activeImageUrl && !isLiteMode && (
                <div
                    className="absolute z-20 pointer-events-none select-none drop-shadow-2xl w-max min-w-max"
                    style={{
                        left: `${getLayoutValue('image_x', 50)}%`,
                        top: `${getLayoutValue('image_y', 50)}%`,
                        transform: `translate(-50%, -50%) scale(${(getLayoutValue('image_scale', 100)) / 100})`,
                    }}
                >
                    <img 
                        src={activeImageUrl} 
                        alt="Movable sliding asset"
                        className="max-h-[300px] w-auto pointer-events-none"
                        referrerPolicy="no-referrer"
                    />
                </div>
            )}

            <div className={`absolute inset-0 flex ${(activeDevice === 'mobile' || activeDevice === 'tablet') ? 'flex-col justify-center' : 'flex-col md:flex-row'} items-center justify-center container mx-auto px-4 z-10 h-full ${(activeDevice === 'mobile' || activeDevice === 'tablet') ? 'pb-4' : 'pb-16 md:pb-0'}`}>
                
                {/* Image Section - Left (Top on Mobile) */}
                {(slideContext.image_mode === 'split' || !slideContext.image_mode) && (
                    <div className={(activeDevice === 'mobile' || activeDevice === 'tablet') ? "w-full h-[45%] flex items-center justify-center p-4 order-1" : "w-full md:w-1/2 h-[55%] md:h-full flex items-center justify-center p-4 md:p-6 order-1"}>
                        <motion.div
                            className="relative w-full h-full flex items-center justify-center"
                            initial={isLiteMode ? {} : { scale: 0.95, opacity: 0 }}
                            animate={isLiteMode ? {} : { scale: 1, opacity: 1 }}
                            transition={isLiteMode ? { duration: 0 } : { duration: 1.5, ease: "easeOut" }}
                        >
                            <div className={`absolute w-2/3 h-2/3 ${glowColor} rounded-full blur-[60px]`}></div>
                            {isLiteMode ? (
                              <div className="border border-white/20 bg-white/5 backdrop-blur-md rounded-3xl p-8 max-w-sm text-center shadow-lg flex flex-col items-center justify-center select-none">
                                <span className="text-4xl mb-3">🍯</span>
                                <h3 className="text-sm font-serif font-bold text-white tracking-wider uppercase">Havikar Pure Spun</h3>
                                <p className="text-[10px] text-white/70 mt-1 leading-relaxed">High resolution promotional image suspended to ensure lightning fast load times on slow networks.</p>
                                <span className="text-[9px] bg-white/10 text-hav-gold font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full mt-4">Lite Connection On</span>
                              </div>
                            ) : (
                              activeImageUrl && (
                                <img 
                                    src={activeImageUrl} 
                                    alt={slide.title!} 
                                    loading={index === 0 ? "eager" : "lazy"}
                                    fetchPriority={index === 0 ? "high" : "auto"}
                                    decoding={index === 0 ? "sync" : "async"}
                                    className="max-h-full max-w-full w-auto h-auto object-contain drop-shadow-2xl z-10 hover:scale-105 transition-transform duration-700"
                                    referrerPolicy="no-referrer"
                                />
                              )
                            )}
                        </motion.div>
                    </div>
                )}

                {/* Text Section - Centered or Split depending on mode */}
                {!slideContext.text_custom && !getLayoutValue('hide_text', false) && slideContext.image_mode !== 'bg_over_content' && (
                    <motion.div 
                        className={`${(activeDevice === 'mobile' || activeDevice === 'tablet') ? 'h-[55%] w-full flex flex-col justify-center items-center text-center px-6 order-2' : 'h-[45%] md:h-full flex flex-col justify-center order-2 mt-4 md:mt-0'} ${
                            slideContext.image_mode === 'split' || !slideContext.image_mode
                                ? ((activeDevice === 'mobile' || activeDevice === 'tablet') ? "w-full items-center text-center" : "w-full md:w-1/2 items-center md:items-start text-center md:text-left px-6 md:pl-12")
                                : "w-full max-w-3xl items-center text-center px-8"
                        }`}
                        variants={contentVariants}
                        initial="initial"
                        animate="animate"
                    >
                        <h1 className={`text-xl sm:text-4xl md:text-6xl lg:text-7xl font-serif font-bold mb-2 md:mb-6 drop-shadow-lg leading-tight ${titleClass}`}>
                            {slide.title}
                        </h1>
                        
                        <p className={`text-[10px] sm:text-lg md:text-2xl mb-4 md:mb-10 font-light tracking-wide max-w-lg leading-relaxed drop-shadow-md ${subtitleClass}`}>
                            {slide.subtitle}
                        </p>
                        
                        {slide.button_text && !isCustomPosition && (
                            <button 
                                onClick={handleNavigation} 
                                className={`${buttonClass} font-bold py-2.5 px-6 md:py-4 md:px-10 rounded-full transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(201,162,54,0.4)] uppercase tracking-widest text-[10px] md:text-base border-2 border-transparent`}
                            >
                                {slide.button_text}
                            </button>
                        )}
                    </motion.div>
                )}

            </div>

            {/* Absolute custom positioned text overlay if enabled */}
            {slideContext.text_custom && !getLayoutValue('hide_text', false) && slideContext.image_mode !== 'bg_over_content' && (
                <div 
                    className={`absolute z-10 p-4 max-w-sm w-full select-none flex flex-col ${
                        slideContext.text_alignment === 'center' ? 'items-center text-center' :
                        slideContext.text_alignment === 'right' ? 'items-end text-right' :
                        'items-start text-left'
                    }`}
                    style={{
                        left: `${getLayoutValue('text_x', 50)}%`,
                        top: `${getLayoutValue('text_y', 40)}%`,
                        transform: `translate(-50%, -50%) scale(${(getLayoutValue('text_scale', 100)) / 100})`,
                    }}
                >
                    <h1 className={`text-xl sm:text-4xl md:text-5xl font-serif font-bold mb-2 drop-shadow-lg leading-tight ${titleClass}`}>
                        {slide.title}
                    </h1>
                    <p className={`text-[10px] sm:text-base md:text-lg font-light tracking-wide max-w-md leading-relaxed drop-shadow-md ${subtitleClass}`}>
                        {slide.subtitle}
                    </p>
                </div>
            )}

            {/* Absolute placed custom-positioned button overlay if enabled */}
            {isCustomPosition && (slideContext.buttons && Array.isArray(slideContext.buttons) && slideContext.buttons.length > 0 ? (
                slideContext.buttons.map((btn: any, bIdx: number) => {
                    const coords = getLayoutButtonCoordinates(btn.id, btn.x !== undefined ? btn.x : 50, btn.y !== undefined ? btn.y : 80, btn.scale);
                    const isHotspot = !!btn.is_hotspot;
                    return (
                        <button 
                            key={bIdx}
                            onClick={(e) => {
                                e.stopPropagation();
                                const link = btn.link_path || btn.link_page;
                                if (link) {
                                    if (link.startsWith('http')) {
                                        window.open(link, '_blank');
                                    } else {
                                        const mergedContext = {
                                            ...slideContext,
                                            ...(btn.context || {})
                                        };
                                        navigateTo(link as Page, mergedContext);
                                    }
                                }
                            }}
                            className={isHotspot 
                                ? "absolute z-20 cursor-pointer pointer-events-auto outline-none border-0 bg-transparent flex items-center justify-center"
                                : `${buttonClass} absolute z-20 font-black uppercase text-[9px] tracking-wider shadow-md whitespace-nowrap border flex items-center justify-center text-center overflow-hidden hover:scale-105 active:scale-95 transition-all duration-150`
                            }
                            style={{
                                left: `${coords.x}%`,
                                top: `${coords.y}%`,
                                transform: `translate(-50%, -50%) scale(${(coords.scale) / 100})`,
                                width: coords.width && coords.width > 0 ? `${coords.width}px` : (isHotspot ? '100px' : undefined),
                                height: coords.height && coords.height > 0 ? `${coords.height}px` : (isHotspot ? '44px' : undefined),
                                backgroundColor: isHotspot ? 'transparent' : (btn.bg_color || undefined),
                                color: isHotspot ? 'transparent' : (btn.text_color || undefined),
                                borderColor: isHotspot ? 'transparent' : (btn.border_color || undefined),
                                borderWidth: isHotspot ? '0px' : (btn.border_color ? '2px' : '0px'),
                                borderRadius: isHotspot ? '0px' : (
                                              btn.border_radius === 'sharp' ? '0px' :
                                              btn.border_radius === 'rounded-sm' ? '4px' :
                                              btn.border_radius === 'rounded font-black' ? '8px' :
                                              btn.border_radius === 'rounded' ? '8px' :
                                              btn.border_radius === 'rounded-xl' ? '14px' :
                                              btn.border_radius === 'pill' ? '9999px' : '9999px'
                                )
                            }}
                        >
                            {!isHotspot && (
                                <span className={`${coords.width && coords.width > 0 ? 'px-2 py-1' : 'px-4 py-2'} block truncate`}>{btn.text}</span>
                            )}
                        </button>
                    );
                })
            ) : (
                slide.button_text && (
                    <button 
                        onClick={handleNavigation} 
                        className={`${buttonClass} absolute z-20 font-bold py-2.5 px-5 md:py-4 md:px-10 rounded-full transition-all transform hover:scale-105 shadow-[0_4px_20px_rgba(0,0,0,0.4)] uppercase tracking-widest text-[10px] md:text-base border-2 border-white/25`}
                        style={{
                            left: `${buttonX}%`,
                            top: `${buttonY}%`,
                            transform: 'translate(-50%, -50%)'
                        }}
                    >
                        {slide.button_text}
                    </button>
                )
            ))}

            {connectedProduct && showProductBadge && (
                <div 
                    onClick={(e) => {
                        e.stopPropagation();
                        navigateTo('product', { productId: connectedProduct.id });
                    }}
                    className="absolute bottom-6 right-6 md:bottom-12 md:right-12 z-40 bg-white/95 backdrop-blur-md rounded-2xl border border-hav-gold/25 p-4 shadow-2xl max-w-[280px] text-gray-900 flex items-center gap-3 animate-fade-in group/card hover:scale-105 transition-transform duration-300 cursor-pointer"
                >
                    <img 
                        src={connectedProduct.image_urls?.[0]} 
                        alt={connectedProduct.name} 
                        className="w-16 h-16 object-cover rounded-xl border border-gray-100 shrink-0" 
                        referrerPolicy="no-referrer"
                    />
                    <div className="flex-1 text-left min-w-0">
                        <span className="text-[8px] bg-hav-gold text-hav-forest px-1.5 py-0.5 rounded-full font-black uppercase inline-block mb-1">
                            {connectedProduct.product_variants?.[0]?.net_weight || "Premium"}
                        </span>
                        <h4 className="font-serif font-bold text-xs text-hav-forest truncate leading-tight">
                            {connectedProduct.name}
                        </h4>
                        <div className="flex items-center gap-1 mt-0.5">
                            <span className="text-[#C9A236] text-[10px]">★</span>
                            <span className="text-[10px] text-gray-500 font-bold">{connectedProduct.average_rating || 4.8}</span>
                        </div>
                        <div className="flex items-center justify-between gap-1.5 mt-1">
                            <span className="text-xs font-black text-hav-forest">
                                ₹{connectedProduct.product_variants?.[0]?.price || 350}
                            </span>
                            {addToCart && connectedProduct.product_variants?.[0] && (
                                <button 
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        addToCart(connectedProduct, connectedProduct.product_variants[0], 1);
                                    }}
                                    className="bg-hav-forest text-[#C9A236] hover:bg-hav-gold hover:text-hav-forest font-bold text-[9px] px-2.5 py-1.5 rounded-lg uppercase tracking-wider transition-colors shadow active:scale-95 duration-200 whitespace-nowrap"
                                >
                                    + Add
                                </button>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-3 z-20">
        {slides.map((_, idx) => (
            <div 
                key={idx} 
                className={`h-1.5 rounded-full overflow-hidden cursor-pointer transition-all duration-300 backdrop-blur-sm ${isBeige ? 'bg-hav-forest/20' : 'bg-white/20'}`}
                style={{ width: idx === index ? '40px' : '12px' }}
                onClick={() => {
                    const dir = idx > index ? 1 : -1;
                    setPage(page + (idx - index));
                    startTimeRef.current = null;
                    setProgress(0);
                    pausedProgressRef.current = 0;
                }}
            >
                {idx === index && (
                    <motion.div 
                        className={`h-full ${isBeige ? 'bg-hav-forest' : 'bg-hav-gold'}`}
                        style={{ width: `${progress}%` }}
                        layoutId="progress"
                    />
                )}
            </div>
        ))}
      </div>

      <button 
        onClick={() => paginate(-1)} 
        className={`absolute left-4 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-hav-gold hover:text-hav-forest transition-all hidden md:block backdrop-blur-md border z-30 group-hover:opacity-100 opacity-50 ${isBeige ? 'bg-hav-forest/10 text-hav-forest border-hav-forest/20' : 'bg-black/20 text-white border-white/10'}`}
        aria-label="Previous Slide"
      >
        <ChevronLeftIcon className="w-8 h-8" />
      </button>
      
      <button 
        onClick={() => paginate(1)} 
        className={`absolute right-4 top-1/2 -translate-y-1/2 p-3 rounded-full hover:bg-hav-gold hover:text-hav-forest transition-all hidden md:block backdrop-blur-md border z-30 group-hover:opacity-100 opacity-50 ${isBeige ? 'bg-hav-forest/10 text-hav-forest border-hav-forest/20' : 'bg-black/20 text-white border-white/10'}`}
        aria-label="Next Slide"
      >
        <ChevronRightIcon className="w-8 h-8" />
      </button>

      <button
        onClick={togglePause}
        className={`absolute bottom-4 right-4 p-2 md:p-3 rounded-full hover:bg-hav-gold hover:text-hav-forest transition-all z-30 backdrop-blur-md border ${isBeige ? 'bg-hav-forest/10 text-hav-forest border-hav-forest/20' : 'bg-black/20 text-white border-white/10'}`}
        aria-label={isPaused ? "Play" : "Pause"}
      >
        {isPaused ? <PlayIcon className="w-4 h-4 md:w-6 md:h-6" /> : <PauseIcon className="w-4 h-4 md:w-6 md:h-6" />}
      </button>
    </div>
  );
};

export default ImageCarousel;