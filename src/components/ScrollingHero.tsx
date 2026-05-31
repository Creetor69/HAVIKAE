
import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import ChevronLeftIcon from './icons/ChevronLeftIcon';
import ChevronRightIcon from './icons/ChevronRightIcon';
import { Page, PromotionalContent } from '../types';

interface ScrollingHeroProps {
    navigateTo: (page: Page, context?: any) => void;
    offers: PromotionalContent[];
    durationSeconds: number;
}

const ScrollingHero: React.FC<ScrollingHeroProps> = ({ navigateTo, offers }) => {
  if (offers.length === 0) {
    return (
        <div className="relative w-full bg-hav-forest text-hav-gold flex items-center justify-center h-16 border-b border-hav-gold/20">
            <p className="font-serif font-semibold text-base tracking-wide">The Flavour of Life — Authentic Indian Foods</p>
        </div>
    );
  }

  // Duplicate offers significantly for seamless marquee on large screens
  const marqueeOffers = Array(15).fill(offers).flat();

  return (
    <div className="relative w-full bg-hav-forest text-hav-gold flex items-center h-12 md:h-16 border-b border-hav-gold/20 overflow-hidden group">
      <div className="flex animate-marquee whitespace-nowrap">
        {marqueeOffers.map((offer, idx) => (
          <div key={`${offer.id}-${idx}`} className="flex items-center px-8">
            <button 
              onClick={() => navigateTo(offer.button_link_page as Page, offer.button_link_context)} 
              className="flex items-center gap-4 hover:text-hav-wheat transition-colors focus:outline-none"
            >
              <span className="font-serif font-bold text-lg md:text-2xl uppercase tracking-tighter">
                {offer.text}
              </span>
              {offer.text.includes('%') || offer.text.toLowerCase().includes('off') ? (
                <span className="font-mono bg-hav-gold text-hav-forest px-2 py-0.5 rounded text-xs md:text-sm font-bold transform -rotate-2">
                  CODE: HAVIKAR20
                </span>
              ) : null}
              <span className="text-hav-gold/30 mx-4">✦</span>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ScrollingHero;
