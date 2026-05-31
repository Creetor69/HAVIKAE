
import React from 'react';
import { Product, Recipe, Page, PageContext } from '../types';
import PotIcon from '../components/icons/PotIcon';
import ScrollIcon from '../components/icons/ScrollIcon';
import VideoPlayer from '../components/VideoPlayer';
import ProductCard from '../components/ProductCard';

interface RecipeDetailPageProps {
  recipe: Recipe;
  navigateTo: (page: Page, context?: PageContext) => void;
  products: Product[];
}

const RecipeDetailPage: React.FC<RecipeDetailPageProps> = ({ recipe, navigateTo, products }) => {
    // Find full product objects based on IDs stored in recipe.products
    const requiredProducts = products.filter(p => recipe.products.includes(p.id));

    return (
    <div className="bg-hav-cream min-h-screen">
        <header className="relative h-[50vh]">
            <img src={recipe.imageUrl} alt={`Finished dish of ${recipe.name}`} className="w-full h-full object-cover"/>
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 p-8 md:p-12 text-white">
                <h1 className="text-4xl md:text-6xl font-serif font-bold drop-shadow-lg">{recipe.name}</h1>
                <p className="mt-2 text-lg max-w-2xl text-hav-orange-100">{recipe.description}</p>
            </div>
        </header>

        <main className="container mx-auto px-4 py-12">
            
            {/* Video Section */}
            {recipe.videoUrl && (
                <section className="mb-16">
                    <h2 className="text-3xl font-serif font-bold text-hav-orange-900 mb-6 flex items-center gap-3">
                        Watch Recipe Video
                    </h2>
                    <div className="max-w-4xl mx-auto">
                        <VideoPlayer url={recipe.videoUrl} />
                    </div>
                </section>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
                <section className="lg:col-span-1">
                    <div className="lg:sticky top-24 space-y-8">
                        <div className="bg-hav-orange-50 p-6 rounded-lg shadow-sm border border-hav-orange-200">
                            <h2 className="flex items-center text-2xl font-serif font-bold text-hav-orange-900 mb-4">
                                <ScrollIcon className="w-6 h-6 mr-2 text-hav-orange-700"/>
                                Ingredients
                            </h2>
                            <ul className="space-y-3 text-hav-brown list-disc list-inside">
                                {recipe.ingredients.map((item, index) => (
                                    <li key={index}>{item}</li>
                                ))}
                            </ul>
                        </div>

                        {/* Featured Products Sidebar */}
                        {requiredProducts.length > 0 && (
                            <div className="bg-white p-6 rounded-lg shadow-sm border border-hav-gold/30">
                                <h3 className="text-xl font-serif font-bold text-hav-forest mb-4">Shop The Ingredients</h3>
                                <div className="space-y-4">
                                    {requiredProducts.map(product => (
                                        <div 
                                            key={product.id}
                                            onClick={() => navigateTo('product', { productId: product.id })}
                                            className="flex items-center p-2 rounded-md hover:bg-hav-cream transition-colors cursor-pointer border border-transparent hover:border-hav-gold/20"
                                        >
                                            <img src={product.image_urls[0]} alt={product.name} className="w-14 h-14 object-contain mix-blend-multiply rounded-md mr-3"/>
                                            <div className="flex-grow">
                                                <p className="font-bold text-sm text-hav-forest leading-tight">{product.name}</p>
                                                <p className="text-xs text-hav-gold font-bold mt-1">View Product &rarr;</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                </section>
                
                <section className="lg:col-span-2">
                    <h2 className="flex items-center text-3xl font-serif font-bold text-hav-orange-900 mb-6">
                        <PotIcon className="w-8 h-8 mr-3 text-hav-orange-700"/>
                        Instructions
                    </h2>
                    <div className="space-y-6 text-hav-brown leading-relaxed">
                        {recipe.instructions.map((step, index) => (
                            <div key={index} className="flex items-start bg-white p-4 rounded-lg shadow-sm border border-hav-olive/5">
                                <div className="flex-shrink-0 bg-hav-orange-600 text-white rounded-full w-8 h-8 flex items-center justify-center font-bold mr-4 mt-1 shadow-md">{index + 1}</div>
                                <p className="mt-1">{step}</p>
                            </div>
                        ))}
                    </div>
                </section>
            </div>
        </main>
    </div>
    );
};

export default RecipeDetailPage;
