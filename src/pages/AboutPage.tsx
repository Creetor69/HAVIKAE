
import React from 'react';
import { Page, PageContext } from '../types';

interface AboutPageProps {
  navigateTo: (page: Page, context?: PageContext) => void;
  content?: Record<string, any>;
}

const AboutPage: React.FC<AboutPageProps> = ({ navigateTo, content }) => {
  const sections = content?.sections || [];

  return (
    <div className="bg-hav-cream min-h-screen">
        <header className="relative h-[60vh] bg-cover bg-center flex items-center justify-center text-center" style={{ backgroundImage: `url('https://images.unsplash.com/photo-1625242668994-06721511a052?auto=format&fit=crop&w=2070&q=80')` }}>
            <div className="absolute inset-0 bg-black/60"></div>
            <div className="relative z-10 px-4">
                <h1 className="text-5xl md:text-8xl font-serif font-bold text-hav-gold mb-6 drop-shadow-2xl">The Havikar Journey</h1>
                <p className="text-xl md:text-3xl text-white font-light tracking-wide max-w-3xl mx-auto italic">Rooted in tradition, crafted for the soul.</p>
            </div>
        </header>

        <main className="container mx-auto px-4 py-24 max-w-6xl">
            {sections.length > 0 ? (
                <div className="space-y-32">
                    {sections.map((section: any, idx: number) => (
                        <div key={idx} className={`flex flex-col ${section.layout === 'text_right' ? 'md:flex-row-reverse' : section.layout === 'full_width' ? 'items-center' : 'md:flex-row'} gap-12 items-center`}>
                            {section.layout !== 'full_width' && section.image_url && (
                                <div className="w-full md:w-1/2">
                                    <img src={section.image_url} alt={section.title} className="w-full h-[400px] object-cover rounded-[3rem] shadow-2xl border-4 border-white" loading="lazy" />
                                </div>
                            )}
                            <div className={`${section.layout === 'full_width' ? 'w-full text-center max-w-4xl' : 'w-full md:w-1/2'} space-y-6`}>
                                <h2 className="text-4xl md:text-5xl font-serif font-bold text-hav-forest">{section.title}</h2>
                                <div className="prose prose-lg prose-hav-olive text-hav-olive leading-relaxed whitespace-pre-wrap">
                                    {section.content}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="prose prose-xl prose-hav-olive text-hav-olive leading-relaxed space-y-12 max-w-4xl mx-auto">
                    <p className="text-2xl md:text-3xl font-serif italic border-l-4 border-hav-gold pl-8 py-4 bg-white/30 rounded-r-2xl">
                        Havikar was born from a deep-rooted passion to preserve the rich culinary heritage of Karnataka. In a world moving at a breakneck pace, we wanted to create a space for the timeless, traditional recipes that tell the stories of our grandmothers' kitchens.
                    </p>

                    <div className="space-y-8 text-xl font-medium">
                        <p>
                            Every product we offer is more than just food; it's a piece of our history, crafted in small, deliberate batches to ensure unparalleled quality and freshness. We believe in the power of clean, natural ingredients. That's why we say no to preservatives, artificial colors, and anything that doesn't belong in a traditional pantry.
                        </p>
                        <p>
                            From hand-roasting spices to stone-grinding flours, we follow age-old methods to bring you the authentic taste of home. Our journey is inspired by Ayurvedic principles, which teach that food is medicine. This ancient wisdom guides our hands in crafting every product, from our healthy Indian snacks and traditional spice blends to our rejuvenating herbal drinks.
                        </p>
                        <p>
                            As a natural food brand, we believe in a purity you can taste, a freshness you can feel, and a quality you can trust. Welcome to the family, where every bite is an invitation to experience nostalgia and the true flavour of life.
                        </p>
                    </div>
                </div>
            )}

            <div className="mt-24 text-center">
                <button 
                    onClick={() => navigateTo('shop')}
                    className="bg-hav-forest text-hav-gold font-black py-6 px-16 rounded-full shadow-2xl hover:scale-105 transition-all uppercase tracking-[0.2em] text-sm"
                >
                    Taste the Purity
                </button>
            </div>
        </main>
    </div>
  );
};

export default AboutPage;
