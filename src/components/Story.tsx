import React from 'react';

const Story: React.FC = () => {
  return (
    <section className="py-6 md:py-10 bg-hav-forest text-hav-gold relative overflow-hidden">
      {/* Background pattern hint */}
      <div className="absolute inset-0 opacity-[0.05]" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23C9A236' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`}}></div>
      
      <div className="container mx-auto px-4 text-center max-w-4xl relative z-10">
        <h2 className="text-2xl md:text-4xl font-serif font-bold text-hav-gold mb-4">From Our Kitchen to Yours</h2>
        <div className="w-12 h-1 bg-hav-gold mx-auto mb-6 rounded-full opacity-80"></div>
        
        <div className="space-y-4">
            <p className="text-sm md:text-lg leading-relaxed font-serif italic text-hav-cream/90">
              Havikar was born from a deep-rooted passion to preserve the rich culinary heritage of Karnataka. We wanted to create a space for the timeless, traditional recipes that tell the stories of our grandmothers' kitchens. 
            </p>
            
            <p className="text-xs md:text-sm leading-relaxed font-medium text-hav-wheat/80 max-w-2xl mx-auto">
              Every product is a piece of our history, crafted in small batches for unparalleled quality. We believe in clean, natural ingredients—no preservatives, no artificial colors.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 py-2">
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border border-hav-gold/30 flex items-center justify-center text-2xl mb-2 bg-white/5 shadow-inner">🍯</div>
                    <h4 className="text-hav-gold font-black uppercase tracking-widest text-[8px] mb-1">Small Batch Purity</h4>
                    <p className="text-hav-wheat/60 text-[8px] leading-relaxed">Handcrafted in limited quantities to preserve the soul of every ingredient.</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border border-hav-gold/30 flex items-center justify-center text-2xl mb-2 bg-white/5 shadow-inner">🥥</div>
                    <h4 className="text-hav-gold font-black uppercase tracking-widest text-[8px] mb-1">Stone-Ground Quality</h4>
                    <p className="text-hav-wheat/60 text-[8px] leading-relaxed">Using age-old stone-grinding methods to retain natural oils and nutrients.</p>
                </div>
                <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-full border border-hav-gold/30 flex items-center justify-center text-2xl mb-2 bg-white/5 shadow-inner">🌿</div>
                    <h4 className="text-hav-gold font-black uppercase tracking-widest text-[8px] mb-1">Heirloom Recipes</h4>
                    <p className="text-hav-wheat/60 text-[8px] leading-relaxed">Passed down through generations, our recipes are a testament to time.</p>
                </div>
            </div>

            <p className="text-xs md:text-sm leading-relaxed font-medium text-hav-wheat/80 max-w-2xl mx-auto">
              From hand-roasting spices to stone-grinding flours, we follow age-old methods. At Havikar, every spoon is an invitation to experience nostalgia and the true flavour of life.
            </p>
        </div>
        
        <div className="mt-6 pt-3 border-t border-hav-gold/20">
            <span className="font-serif italic text-hav-gold text-lg">The Havikar Family</span>
        </div>
      </div>
    </section>
  );
};

export default Story;