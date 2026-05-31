
import React from 'react';
import { recipesData } from '../data/recipes';
import { Product, Recipe, Page, PageContext } from '../types';

interface RecipesPageProps {
  navigateTo: (page: Page, context?: PageContext) => void;
  products: Product[];
}

const RecipeCard: React.FC<{ recipe: Recipe; products: Product[]; navigateTo: (page: Page, context?: PageContext) => void; }> = ({ recipe, products, navigateTo }) => {
  const primaryProduct = products.find(p => p.id === recipe.products[0]);

  return (
    <div 
        className="bg-hav-orange-50 rounded-xl overflow-hidden shadow-lg flex flex-col md:flex-row cursor-pointer hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1"
        onClick={() => navigateTo('recipeDetail', { recipeId: recipe.id })}
    >
      <img src={recipe.imageUrl} alt={`Finished dish of ${recipe.name} made with Havikar products`} className="w-full md:w-1/3 h-64 md:h-auto object-cover" />
      <div className="p-6 flex flex-col justify-between">
        <div>
          <h3 className="text-3xl font-serif font-bold text-hav-orange-800">{recipe.name}</h3>
          <p className="mt-2 text-hav-brown">{recipe.description}</p>
        </div>
        {primaryProduct && (
          <div className="mt-4">
             <p className="text-sm text-hav-brown">Featuring: <span className="font-semibold">{primaryProduct.name}</span></p>
          </div>
        )}
      </div>
    </div>
  );
};

const RecipesPage: React.FC<RecipesPageProps> = ({ navigateTo, products }) => {
  return (
    <div className="bg-gradient-to-b from-hav-cream to-hav-orange-100 min-h-screen">
      <main className="container mx-auto px-4 py-8">
        <div className="text-center py-8">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-hav-orange-900">Cook with Havikar</h1>
          <p className="mt-2 text-lg text-hav-brown">Bring authentic South Indian flavours to your kitchen.</p>
        </div>
        
        <div className="space-y-12">
          {recipesData.map(recipe => (
            <RecipeCard key={recipe.name} recipe={recipe} products={products} navigateTo={navigateTo} />
          ))}
        </div>
      </main>
    </div>
  );
};

export default RecipesPage;
