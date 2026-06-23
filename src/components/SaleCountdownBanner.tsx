import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SaleBanner, Page, PageContext } from '../types';
import XIcon from './icons/XIcon';
import { Flame } from 'lucide-react';

interface SaleCountdownBannerProps {
  banner: SaleBanner;
  navigateTo: (page: Page, context?: PageContext) => void;
}

const calculateTimeLeft = (targetTimestamp: number) => {
    const difference = targetTimestamp - Date.now();
    if (difference <= 0) {
        return null;
    }
    return {
        days: Math.floor(difference / (1000 * 60 * 60 * 24)),
        hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((difference / 1000 / 60) % 60),
        seconds: Math.floor((difference / 1000) % 60),
    };
};

const CountdownUnit: React.FC<{ value: number; unit: string }> = ({ value, unit }) => (
    <div className="text-center w-12 md:w-16 bg-black/20 rounded-lg p-1 border border-white/20 backdrop-blur-sm shadow-inner">
        <span className="block text-xl md:text-2xl font-black font-mono tracking-tighter drop-shadow-md">{String(value).padStart(2, '0')}</span>
        <span className="block text-[8px] md:text-[10px] uppercase font-bold tracking-widest text-white/80">{unit}</span>
    </div>
);

const SaleCountdownBanner: React.FC<SaleCountdownBannerProps> = ({ banner, navigateTo }) => {
    const bannerId = `hideSaleBanner_${banner.id}`;
    const [isDismissed, setIsDismissed] = useState(() => !!sessionStorage.getItem(bannerId));

    const countdownDetails = useMemo(() => {
        const nowTimestamp = Date.now();
        const startTimestamp = banner.sale_start ? new Date(banner.sale_start).getTime() : null;
        const endTimestamp = banner.sale_end ? new Date(banner.sale_end).getTime() : null;

        if (startTimestamp && startTimestamp > nowTimestamp) {
            return { targetTimestamp: startTimestamp, message: 'Sale starts in:' };
        }
        if (endTimestamp && endTimestamp > nowTimestamp) {
            return { targetTimestamp: endTimestamp, message: 'Sale Ends In' };
        }
        return { targetTimestamp: null, message: '' };
    }, [banner.sale_start, banner.sale_end]);

    const [timeLeft, setTimeLeft] = useState(() => 
        countdownDetails.targetTimestamp ? calculateTimeLeft(countdownDetails.targetTimestamp) : null
    );
    
    useEffect(() => {
        if (!countdownDetails.targetTimestamp || isDismissed) return;
        
        const timer = setInterval(() => {
            const newTimeLeft = calculateTimeLeft(countdownDetails.targetTimestamp!);
            setTimeLeft(newTimeLeft);
            if (!newTimeLeft) {
                clearInterval(timer);
            }
        }, 1000);

        return () => clearInterval(timer);
    }, [countdownDetails.targetTimestamp, isDismissed]);

    const handleClose = () => {
        sessionStorage.setItem(bannerId, 'true');
        setIsDismissed(true);
    };

    const handleNavigation = () => {
        if (banner.button_link_page) {
          const link = banner.button_link_page;
          if (link.startsWith('http')) {
              window.open(link, '_blank');
          } else {
              navigateTo(link as Page, banner.button_link_context || undefined);
          }
        }
    }

    const defaultBackground = 'linear-gradient(to right, #dc2626, #991b1b)'; // Fierce red default
    const backgroundStyle = banner.background_css || defaultBackground;

    const showBanner = !isDismissed;
    const showCountdown = !!(countdownDetails.targetTimestamp && timeLeft);

    return (
        <AnimatePresence>
            {showBanner && (
                <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ type: 'tween', ease: 'easeInOut' }}
                    className="text-white overflow-hidden relative shadow-lg shadow-black/20"
                    style={{ background: backgroundStyle }}
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
                    
                    <div className="container mx-auto px-4 py-3 flex flex-col md:flex-row items-center justify-center gap-3 md:gap-8 relative z-10">
                        {showCountdown ? (
                            <>
                                <div className="flex items-center gap-3 text-center md:text-left flex-shrink-0 relative">
                                    {/* Urgency Pulse */}
                                    <div className="absolute -left-4 top-1/2 -translate-y-1/2 w-2 h-2 rounded-full bg-white opacity-0 md:opacity-100 animate-ping"></div>
                                    <Flame className="w-6 h-6 md:w-8 md:h-8 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.8)] animate-pulse" />
                                    <div>
                                        <h3 className="font-black text-sm md:text-xl uppercase tracking-wider drop-shadow-md">{banner.title}</h3>
                                        <p className="text-[10px] md:text-xs font-bold text-white/90 uppercase tracking-[0.2em]">{countdownDetails.message}</p>
                                    </div>
                                </div>
                                
                                <div className="flex items-center gap-2 md:gap-3">
                                    <CountdownUnit value={timeLeft!.days} unit="Days" />
                                    <span className="font-bold text-xl md:text-2xl text-white/50 animate-pulse">:</span>
                                    <CountdownUnit value={timeLeft!.hours} unit="Hrs" />
                                    <span className="font-bold text-xl md:text-2xl text-white/50 animate-pulse">:</span>
                                    <CountdownUnit value={timeLeft!.minutes} unit="Min" />
                                    <span className="font-bold text-xl md:text-2xl text-white/50 animate-pulse">:</span>
                                    <CountdownUnit value={timeLeft!.seconds} unit="Sec" />
                                </div>
                            </>
                        ) : (
                            <div className="flex items-center gap-3 text-center md:text-left">
                                 <Flame className="w-5 h-5 text-yellow-300 drop-shadow-[0_0_8px_rgba(253,224,71,0.5)] animate-pulse" />
                                 <h3 className="font-black text-sm md:text-base uppercase tracking-wider drop-shadow-md">{banner.title}</h3>
                            </div>
                        )}

                        {banner.button_text && (
                            <button
                                onClick={handleNavigation}
                                className="mt-2 md:mt-0 bg-white text-red-700 hover:bg-yellow-100 font-black py-2 px-6 rounded-lg text-xs tracking-widest uppercase transition-all shadow-[0_4px_14px_0_rgba(255,255,255,0.39)] hover:shadow-[0_6px_20px_rgba(255,255,255,0.23)] hover:-translate-y-0.5 active:translate-y-0 relative overflow-hidden group"
                            >
                                <span className="relative z-10 flex items-center gap-2">
                                    {banner.button_text} <span className="text-lg leading-none group-hover:translate-x-1 transition-transform">→</span>
                                </span>
                            </button>
                        )}
                        
                        <button onClick={handleClose} className="absolute right-2 md:right-4 top-1/2 -translate-y-1/2 p-2 rounded-full hover:bg-white/20 transition-colors" aria-label="Close banner">
                            <XIcon className="w-4 h-4 md:w-5 md:h-5"/>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SaleCountdownBanner;