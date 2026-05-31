
import React from 'react';
import { Page, PageContext } from '../types';
import { recipesData } from '../data/recipes';

interface RecipeInfo {
  id: string;
  name: string;
  imageUrl: string;
}

const RecipeCard: React.FC<{ recipe: RecipeInfo }> = ({ recipe }) => (
  <div 
    className="relative rounded-xl overflow-hidden shadow-[0_0_15px_rgba(255,255,255,0.2)] hover:shadow-[0_0_35px_rgba(255,255,255,0.6)] border-2 border-white/30 hover:border-white h-32 md:h-40 flex items-end p-3 text-white group transition-all duration-500"
    style={{ backgroundImage: `url(${recipe.imageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center' }}
  >
    <div className="absolute inset-0 bg-gradient-to-t from-hav-forest/90 via-hav-forest/40 to-transparent transition-opacity duration-300 opacity-70 group-hover:opacity-90"></div>
    <div className="relative z-10 transform group-hover:-translate-y-1 transition-transform duration-300">
      <h3 className="text-lg font-serif font-bold text-hav-gold mb-0.5 drop-shadow-lg">{recipe.name}</h3>
      <span className="text-[10px] text-hav-cream border-b border-hav-gold pb-0.5 inline-block drop-shadow-md">View Recipe &rarr;</span>
    </div>
  </div>
);

interface RecipesProps {
  navigateTo: (page: Page, context?: PageContext) => void;
}

const Recipes: React.FC<RecipesProps> = ({ navigateTo }) => {
  const featuredRecipes = recipesData.slice(0, 3);
  
  return (
    <section className="py-6 md:py-10 bg-transparent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-6">
            <h2 className="text-2xl md:text-4xl font-serif font-bold text-hav-forest">Cook with Havikar</h2>
            <p className="mt-2 text-sm text-hav-olive max-w-2xl mx-auto">Bring the authentic aroma of South India into your kitchen with our curated traditional recipes.</p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {featuredRecipes.map(recipe => (
            <div 
                key={recipe.id} 
                className="cursor-pointer transition-transform duration-300 transform hover:-translate-y-1" 
                onClick={() => navigateTo('recipeDetail', { recipeId: recipe.id })}
            >
                <RecipeCard recipe={recipe} />
            </div>
          ))}
        </div>
        <div className="text-center mt-8">
            <button 
                onClick={() => navigateTo('recipes')}
                className="bg-hav-forest hover:bg-hav-olive text-hav-gold font-bold py-2 px-8 rounded transition-all shadow-lg hover:shadow-xl border border-hav-gold/30 text-sm"
            >
                View All Recipes
            </button>
        </div>
      </div>
    </section>
  );
};

export default Recipes;
