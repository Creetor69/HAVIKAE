
import React from 'react';
import { Product, Page, PageContext } from '../types';
import StarRating from '../components/StarRating';
import DiscountDisplay from '../components/DiscountDisplay';

interface ComparePageProps {
  productIds: string[];
  products: Product[];
  navigateTo: (page: Page, context?: PageContext) => void;
}

const ComparePage: React.FC<ComparePageProps> = ({ productIds, products, navigateTo }) => {
  const productsToCompare = products.filter(p => productIds.includes(p.id));

  const renderValue = (value: any) => {
    if (typeof value === 'boolean') {
      return value ? 'Yes' : 'No';
    }
    if (Array.isArray(value)) {
      return value.join(', ');
    }
    return value || 'N/A';
  };
  
  const getPriceRange = (product: Product) => {
    if (!product.product_variants || product.product_variants.length === 0) {
        return 'N/A';
    }
    const prices = product.product_variants.map(v => v.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    if (minPrice === maxPrice) {
        return `₹${(minPrice || 0).toFixed(2)}`;
    }
    return `₹${(minPrice || 0).toFixed(2)} - ₹${(maxPrice || 0).toFixed(2)}`;
  }

  const attributes = [
    { key: 'price', label: 'Price' },
    { key: 'average_rating', label: 'Rating' },
    { key: 'categories', label: 'Category' },
    { key: 'spice_level', label: 'Spice Level' },
    { key: 'is_vegan', label: 'Vegan' },
    { key: 'ingredients', label: 'Ingredients' },
  ];

  if (productsToCompare.length === 0) {
    return (
        <div className="min-h-[70vh] flex flex-col items-center justify-center bg-hav-cream text-center p-4">
            <h1 className="text-4xl font-serif font-bold text-hav-orange-900">No Products to Compare</h1>
            <p className="mt-2 text-hav-brown">Please select some products from our shop to see a comparison.</p>
            <button onClick={() => navigateTo('shop')} className="mt-6 bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg">
                Go to Shop
            </button>
        </div>
    );
  }

  return (
    <div className="bg-hav-cream min-h-screen py-12">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-hav-orange-900">Product Comparison</h1>
          <p className="mt-2 text-lg text-hav-brown">Compare your selected items side-by-side.</p>
        </div>

        <div className="overflow-x-auto bg-white rounded-lg shadow-xl">
          <table className="w-full border-collapse">
            <thead className="bg-hav-orange-50">
              <tr>
                <th className="p-4 text-left text-lg font-serif font-bold text-hav-orange-900 sticky left-0 bg-hav-orange-50 z-10 w-48">Feature</th>
                {productsToCompare.map(product => (
                  <th key={product.id} className="p-4 border-l border-hav-orange-200 min-w-[250px] text-center">
                    <img
                      src={product.image_urls[0]}
                      alt={`Havikar ${product.name}`}
                      className="w-40 h-40 object-contain mx-auto mb-2 cursor-pointer mix-blend-multiply"
                      onClick={() => navigateTo('product', { productId: product.id })}
                    />
                    <h3
                      className="text-xl font-serif font-bold text-hav-orange-800 cursor-pointer hover:underline"
                      onClick={() => navigateTo('product', { productId: product.id })}
                    >
                      {product.name}
                    </h3>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {/* Add to Cart row */}
              <tr className="border-t border-hav-orange-200">
                  <td className="p-4 font-semibold text-hav-brown sticky left-0 bg-white z-10"></td>
                  {productsToCompare.map(product => {
                      const isOutOfStock = product.product_variants.every(v => v.stock_quantity <= 0);
                      return (
                          <td key={product.id} className="p-4 border-l border-hav-orange-200 text-center">
                               <button 
                                onClick={() => navigateTo('product', { productId: product.id })}
                                disabled={isOutOfStock}
                                className="bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-semibold py-2 px-4 rounded-full transition-colors text-sm disabled:bg-gray-400 disabled:cursor-not-allowed w-full"
                              >
                                {isOutOfStock ? 'Out of Stock' : 'View Options'}
                              </button>
                          </td>
                      )
                  })}
              </tr>
              {attributes.map(attr => (
                <tr key={attr.key} className="border-t border-hav-orange-100 odd:bg-white even:bg-hav-orange-50/50">
                  <td className="p-4 font-semibold text-hav-brown sticky left-0 bg-inherit z-10">{attr.label}</td>
                  {productsToCompare.map(product => (
                    <td key={product.id} className="p-4 border-l border-hav-orange-200 text-center">
                      {attr.key === 'price' ? (
                        <div className="flex flex-col items-center font-bold text-hav-orange-700">
                          {getPriceRange(product)}
                        </div>
                      ) : attr.key === 'average_rating' ? (
                        <div className="flex justify-center">
                          <StarRating rating={product.average_rating || 0} />
                        </div>
                      ) : attr.key === 'categories' ? (
                          renderValue(product.categories?.name)
                      ) : (
                        renderValue(product[attr.key as keyof Product])
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ComparePage;
