
import React from 'react';
import { motion } from 'framer-motion';
import StarIcon from './icons/StarIcon';

const testimonials: any[] = []; // Reviews will be updated soon

const Testimonials: React.FC = () => {
  if (testimonials.length === 0) return null; // Hide section until reviews are provided

  return (
    <section className="py-12 md:py-16 bg-[#fdfbf7] relative overflow-hidden">
      {/* Decorative elements */}
      <div className="absolute top-0 left-0 w-64 h-64 bg-hav-gold/5 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-hav-forest/5 rounded-full blur-3xl translate-x-1/3 translate-y-1/3"></div>

      <div className="container mx-auto px-4 relative z-10">
        <div className="text-center mb-20">
          <span className="text-hav-gold font-black uppercase tracking-[0.3em] text-[10px] mb-4 block">Kind Words</span>
          <h2 className="text-4xl md:text-6xl font-serif font-bold text-hav-forest">Voices of Tradition</h2>
          <div className="w-20 h-1 bg-hav-gold mx-auto mt-6 rounded-full"></div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {testimonials.map((testimonial, index) => (
            <motion.div 
              key={index}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="relative group"
            >
              <div className="bg-white border border-hav-gold/20 p-10 rounded-[2.5rem] shadow-sm group-hover:shadow-xl transition-all duration-500 h-full flex flex-col">
                <div className="text-hav-gold mb-8 flex gap-1">
                    {[1,2,3,4,5].map(i => <StarIcon key={i} className="w-4 h-4 fill-current" />)}
                </div>
                
                <div className="relative mb-8 flex-grow">
                  <span className="absolute -top-4 -left-4 text-6xl text-hav-gold/10 font-serif">"</span>
                  <p className="text-lg text-hav-forest/80 italic leading-relaxed relative z-10">
                    {testimonial.quote}
                  </p>
                </div>

                <div className="flex items-center gap-4 pt-8 border-t border-hav-gold/10">
                  <div className="w-12 h-12 rounded-full bg-hav-cream flex items-center justify-center text-hav-gold font-serif text-xl border border-hav-gold/20">
                    {testimonial.author[0]}
                  </div>
                  <div>
                    <p className="font-bold text-hav-forest tracking-tight">{testimonial.author}</p>
                    <p className="text-[10px] text-hav-gold font-black uppercase tracking-widest">{testimonial.location}</p>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
