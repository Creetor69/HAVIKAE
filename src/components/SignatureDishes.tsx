
import React from 'react';
import { motion } from 'framer-motion';
import { Page, PageContext } from '../types';
import { recipesData } from '../data/recipes';

interface SignatureDishesProps {
  navigateTo: (page: Page, context?: PageContext) => void;
}

const SignatureDishes: React.FC<SignatureDishesProps> = ({ navigateTo }) => {
  // Take the first 4 recipes as signature creations
  const signatureRecipes = recipesData.slice(0, 4);

  return (
    <section className="py-24 bg-[#f5f5f0] overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="text-center mb-20">
          <motion.span 
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            className="text-hav-gold font-bold uppercase tracking-[0.3em] text-xs mb-4 block"
          >
            The Havikar Selection
          </motion.span>
          <motion.h2 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-4xl md:text-6xl font-serif font-bold text-hav-forest"
          >
            Signature Creations
          </motion.h2>
          <motion.div 
            initial={{ width: 0 }}
            whileInView={{ width: "80px" }}
            className="h-1 bg-hav-gold mx-auto mt-6 rounded-full"
          ></motion.div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12">
          {signatureRecipes.map((recipe, index) => (
            <motion.div
              key={recipe.id}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              viewport={{ once: true }}
              className="group cursor-pointer"
              onClick={() => navigateTo('recipeDetail', { recipeId: recipe.id })}
            >
              <div className="relative mb-8 aspect-[3/4] overflow-hidden rounded-[2rem] shadow-xl transition-transform duration-500 group-hover:-translate-y-2">
                <img 
                  src={recipe.imageUrl} 
                  alt={recipe.name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-hav-forest/60 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="absolute top-6 right-6">
                  <span className="bg-white/90 backdrop-blur-sm text-hav-forest text-[10px] font-black uppercase tracking-widest px-4 py-2 rounded-full shadow-lg">
                    Recipe
                  </span>
                </div>
              </div>
              
              <h3 className="text-2xl font-serif font-bold text-hav-forest mb-3 group-hover:text-hav-gold transition-colors">
                {recipe.name}
              </h3>
              <p className="text-hav-olive/80 text-sm leading-relaxed font-medium italic line-clamp-3">
                {recipe.description}
              </p>
              
              <div className="mt-6 flex items-center justify-between">
                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                  <div className="h-[1px] w-8 bg-hav-gold"></div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-hav-gold">View Recipe</span>
                </div>
                <button 
                  className="text-[10px] font-black uppercase tracking-widest text-hav-forest hover:text-hav-gold transition-colors underline underline-offset-4"
                >
                  Learn More
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default SignatureDishes;
