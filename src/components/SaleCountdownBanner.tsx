import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { SaleBanner, Page, PageContext } from '../types';
import XIcon from './icons/XIcon';

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
    <div className="text-center">
        <span className="text-2xl md:text-3xl font-bold">{String(value).padStart(2, '0')}</span>
        <span className="block text-xs uppercase">{unit}</span>
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
            return { targetTimestamp: endTimestamp, message: 'Sale ends in:' };
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

    const defaultBackground = 'linear-gradient(to right, #f97316, #ea580c)';
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
                    className="text-white overflow-hidden"
                    style={{ background: backgroundStyle }}
                >
                    <div className="container mx-auto px-4 py-2 flex flex-col md:flex-row items-center justify-center text-center gap-2 md:gap-6 relative">
                        {showCountdown ? (
                            <>
                                <div className="flex-shrink-0">
                                    <h3 className="font-bold text-lg md:text-xl">{banner.title}</h3>
                                    <p className="text-sm">{countdownDetails.message}</p>
                                </div>
                                <div className="flex items-center gap-4">
                                    <CountdownUnit value={timeLeft!.days} unit="Days" />
                                    <CountdownUnit value={timeLeft!.hours} unit="Hours" />
                                    <CountdownUnit value={timeLeft!.minutes} unit="Mins" />
                                    <CountdownUnit value={timeLeft!.seconds} unit="Secs" />
                                </div>
                            </>
                        ) : (
                             <h3 className="font-bold text-lg md:text-xl">{banner.title}</h3>
                        )}

                        {banner.button_text && (
                            <button
                                onClick={handleNavigation}
                                className="mt-2 md:mt-0 bg-white/20 hover:bg-white/30 text-white font-bold py-2 px-6 rounded-full transition-colors backdrop-blur-sm border border-white/30"
                            >
                                {banner.button_text}
                            </button>
                        )}
                        
                        <button onClick={handleClose} className="absolute top-1/2 right-4 -translate-y-1/2 p-2 rounded-full hover:bg-black/20" aria-label="Close banner">
                            <XIcon className="w-5 h-5"/>
                        </button>
                    </div>
                </motion.div>
            )}
        </AnimatePresence>
    );
};

export default SaleCountdownBanner;