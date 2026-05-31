import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { PromotionalContent, Page, PageContext } from '../types';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import PlayIcon from './icons/PlayIcon';
import PauseIcon from './icons/PauseIcon';

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
}

const ImageCarousel: React.FC<ImageCarouselProps> = ({ navigateTo, slides, durationSeconds, theme = 'green', backgroundColor }) => {
  const [page, setPage] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const startTimeRef = useRef<number | null>(null);
  const requestIdRef = useRef<number | null>(null);
  const pausedProgressRef = useRef<number>(0);

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
        if (isPaused) {
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
  }, [index, slides.length, currentDurationMs, isPaused]); 

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

  const isBeige = theme === 'beige';
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

  return (
    <div 
        className={`relative w-full h-[60vh] md:h-[85vh] overflow-hidden group ${isBeige ? 'bg-hav-cream' : 'bg-hav-forest'}`}
        style={containerStyle}
    >
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

            <div className="absolute inset-0 flex flex-col md:flex-row items-center justify-center container mx-auto px-4 z-10 h-full pb-16 md:pb-0">
                
                {/* Image Section - Left (Top on Mobile) */}
                <div className="w-full md:w-1/2 h-[55%] md:h-full flex items-center justify-center p-4 md:p-6 order-1">
                    <motion.div
                        className="relative w-full h-full flex items-center justify-center"
                        initial={{ scale: 0.95, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ duration: 1.5, ease: "easeOut" }}
                    >
                        <div className={`absolute w-2/3 h-2/3 ${glowColor} rounded-full blur-[60px]`}></div>
                        <img 
                            src={slide.image_url!} 
                            alt={slide.title!} 
                            loading={index === 0 ? "eager" : "lazy"}
                            fetchPriority={index === 0 ? "high" : "auto"}
                            decoding={index === 0 ? "sync" : "async"}
                            className="max-h-full max-w-full w-auto h-auto object-contain drop-shadow-2xl z-10 hover:scale-105 transition-transform duration-700"
                        />
                    </motion.div>
                </div>

                {/* Text Section - Right (Bottom on Mobile) */}
                <motion.div 
                    className="w-full md:w-1/2 h-[45%] md:h-full flex flex-col items-center md:items-start justify-center md:justify-center text-center md:text-left px-6 md:pl-12 order-2 mt-4 md:mt-0"
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
                    
                    {slide.button_text && (
                        <button 
                            onClick={handleNavigation} 
                            className={`${buttonClass} font-bold py-2.5 px-6 md:py-4 md:px-10 rounded-full transition-all transform hover:scale-105 shadow-[0_0_30px_rgba(201,162,54,0.4)] uppercase tracking-widest text-[10px] md:text-base border-2 border-transparent`}
                        >
                            {slide.button_text}
                        </button>
                    )}
                </motion.div>

            </div>
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