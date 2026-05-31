
import React from 'react';
import LeafIcon from './icons/LeafIcon';
import PotIcon from './icons/PotIcon';
import ScrollIcon from './icons/ScrollIcon';

const WhyHavikar: React.FC = () => {
  return (
    <section className="py-8 md:py-12 bg-hav-sage/10 backdrop-blur-sm border-y border-hav-gold/20">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-2xl md:text-3xl font-serif font-bold text-hav-forest mb-2">Why Havikar?</h2>
        <p className="text-hav-olive max-w-2xl mx-auto mb-8 text-sm">Rooted in tradition, crafted for wellness.</p>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 max-w-7xl mx-auto">
          <div className="flex flex-col items-center group">
            <div className="bg-hav-forest text-hav-gold rounded-full p-4 mb-4 shadow-lg shadow-hav-olive/10 group-hover:scale-110 transition-transform duration-300 border border-hav-gold">
              <LeafIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-hav-forest mb-1">Clean Ingredients</h3>
            <p className="text-hav-olive text-xs leading-relaxed">No preservatives or artificial additives. We believe in purity you can taste, sourcing only the finest natural ingredients.</p>
          </div>
          
          <div className="flex flex-col items-center group">
            <div className="bg-hav-forest text-hav-gold rounded-full p-4 mb-4 shadow-lg shadow-hav-olive/10 group-hover:scale-110 transition-transform duration-300 border border-hav-gold">
              <PotIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-hav-forest mb-1">Heritage Recipes</h3>
            <p className="text-hav-olive text-xs leading-relaxed">Authentic recipes passed down through generations, preserving the nostalgic flavours of a traditional South Indian home kitchen.</p>
          </div>
          
          <div className="flex flex-col items-center group">
            <div className="bg-hav-forest text-hav-gold rounded-full p-4 mb-4 shadow-lg shadow-hav-olive/10 group-hover:scale-110 transition-transform duration-300 border border-hav-gold">
              <ScrollIcon className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-serif font-bold text-hav-forest mb-1">Made in Karnataka</h3>
            <p className="text-hav-olive text-xs leading-relaxed">Proudly crafted in the heart of Karnataka, supporting local farmers and celebrating our rich regional culinary heritage.</p>
          </div>

          <div className="flex flex-col items-center group">
            <div className="bg-hav-forest text-hav-gold rounded-full p-4 mb-4 shadow-lg shadow-hav-olive/10 group-hover:scale-110 transition-transform duration-300 border border-hav-gold">
              <svg xmlns="http://www.w3.org/2000/svg" className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <h3 className="text-lg font-serif font-bold text-hav-forest mb-1">Quality Assured</h3>
            <p className="text-hav-olive text-xs leading-relaxed">FSSAI licensed and ISO 9001:2015 certified processes ensuring the highest standards of hygiene and safety.</p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default WhyHavikar;
