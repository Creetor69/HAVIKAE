
import React from 'react';
import { Page, PageContext, Product, Category, Recipe, BlogPost } from '../types';
import ChevronRightIcon from './icons/ChevronRightIcon';

interface BreadcrumbsProps {
  currentRoute: { page: Page; context: PageContext };
  navigateTo: (page: Page, context?: PageContext) => void;
  products: Product[];
  categories: Category[];
  recipes: Recipe[];
  blogPosts: BlogPost[];
}

const BreadcrumbLink: React.FC<{ onClick: () => void; children: React.ReactNode }> = ({ onClick, children }) => (
  <button onClick={onClick} className="transition-colors hover:text-hav-orange-700 hover:underline">
    {children}
  </button>
);

const Breadcrumbs: React.FC<BreadcrumbsProps> = ({ currentRoute, navigateTo, products, categories, recipes, blogPosts }) => {
  const breadcrumbs: { label: string; page?: Page; context?: PageContext }[] = [];

  // Always start with Home
  breadcrumbs.push({ label: 'Home', page: 'home' });

  const { page, context } = currentRoute;

  switch (page) {
    case 'shop':
      if (context.category) {
        breadcrumbs.push({ label: 'Shop', page: 'shop' });
        breadcrumbs.push({ label: context.category });
      } else {
        breadcrumbs.push({ label: 'Shop' });
      }
      break;
    case 'product':
      const product = products.find(p => p.id === context.productId);
      breadcrumbs.push({ label: 'Shop', page: 'shop' });
      if (product) {
        if (product.categories) {
          breadcrumbs.push({ label: product.categories.name, page: 'shop', context: { category: product.categories.name } });
        }
        breadcrumbs.push({ label: product.name });
      } else {
        breadcrumbs.push({ label: 'Product' });
      }
      break;
    case 'recipes':
      breadcrumbs.push({ label: 'Recipes' });
      break;
    case 'recipeDetail':
      const recipe = recipes.find(r => r.id === context.recipeId);
      breadcrumbs.push({ label: 'Recipes', page: 'recipes' });
      breadcrumbs.push({ label: recipe ? recipe.name : 'Recipe' });
      break;
    case 'about':
      breadcrumbs.push({ label: 'About Us' });
      break;
    case 'contact':
      breadcrumbs.push({ label: 'Contact Us' });
      break;
    case 'profile':
      breadcrumbs.push({ label: 'My Account' });
      break;
    case 'checkout':
      breadcrumbs.push({ label: 'Shop', page: 'shop' });
      breadcrumbs.push({ label: 'Checkout' });
      break;
    case 'wishlist':
        breadcrumbs.push({ label: 'My Account', page: 'profile' });
        breadcrumbs.push({ label: 'Wishlist' });
        break;
    case 'compare':
        breadcrumbs.push({ label: 'Shop', page: 'shop' });
        breadcrumbs.push({ label: 'Compare Products' });
        break;
    case 'legal':
        breadcrumbs.push({ label: 'Legal' });
        break;
    case 'influencer':
        breadcrumbs.push({ label: 'Influencer Hub' });
        break;
    case 'sitemap':
        breadcrumbs.push({ label: 'Sitemap' });
        break;
    case 'login':
    case 'signup':
        breadcrumbs.push({ label: 'Account' });
        break;
    case 'notFound':
        breadcrumbs.push({ label: '404 Not Found' });
        break;
    default:
        const defaultLabel = page.charAt(0).toUpperCase() + page.slice(1);
        breadcrumbs.push({ label: defaultLabel });
        break;
  }
  
  return (
    <nav aria-label="Breadcrumb" className="bg-hav-orange-50 py-3 border-b border-t border-hav-orange-200">
      <div className="container mx-auto px-4">
        <ol className="flex items-center space-x-1 text-sm text-hav-brown">
          {breadcrumbs.map((crumb, index) => (
            <li key={index} className="flex items-center">
              {index > 0 && <ChevronRightIcon className="w-4 h-4 text-hav-orange-400 mx-1" />}
              {index === breadcrumbs.length - 1 ? (
                <span className="font-semibold text-hav-orange-800" aria-current="page">
                  {crumb.label}
                </span>
              ) : (
                <BreadcrumbLink onClick={() => navigateTo(crumb.page!, crumb.context)}>
                  {crumb.label}
                </BreadcrumbLink>
              )}
            </li>
          ))}
        </ol>
      </div>
    </nav>
  );
};

export default Breadcrumbs;
