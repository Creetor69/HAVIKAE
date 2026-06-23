
import React from 'react';
import { motion, AnimatePresence, Transition } from 'framer-motion';
import Header from './Header';
import Footer from './Footer';
import CartSidebar from './CartSidebar';
import SearchOverlay from './SearchOverlay';
import WhatsAppFloat from './WhatsAppFloat';
import ComparisonBar from './ComparisonBar';
import SaleCountdownBanner from './SaleCountdownBanner';
import StickyCouponBanner from './StickyCouponBanner';
import { Page, PageContext, AppNotification } from '../types';
import type { User, CartItem, Product, SaleBanner, Category, Recipe, BlogPost, StoreSettings } from '../types';
import { useLiteMode } from '../hooks/useLiteMode';


interface LayoutProps {
  children: React.ReactNode;
  navigateTo: (page: Page, context?: PageContext) => void;
  currentRoute: { page: Page; context: PageContext };
  user: User | null;
  onLogout: () => void;
  cart: CartItem[];
  isCartOpen: boolean;
  toggleCart: () => void;
  updateCartQuantity: (variantId: string, newQuantity: number) => void;
  removeFromCart: (variantId: string) => void;
  navigateToCheckout: () => void;
  isSearchOpen: boolean;
  toggleSearch: () => void;
  products: Product[];
  wishlist: string[];
  saleBanner: SaleBanner | null;
  categories: Category[];
  recipes: Recipe[];
  blogPosts: BlogPost[];
  logoUrl?: string | null;
  storeSettings: StoreSettings | null;
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
}

const pageVariants = {
  initial: {
    opacity: 0,
    y: 20,
  },
  in: {
    opacity: 1,
    y: 0,
  },
  out: {
    opacity: 0,
    y: -20,
  },
};

const pageTransition: Transition = {
  type: "tween",
  ease: "anticipate",
  duration: 0.3
};

const Layout: React.FC<LayoutProps> = ({ 
  children, 
  navigateTo, 
  currentRoute, 
  user, 
  onLogout,
  cart,
  isCartOpen,
  toggleCart,
  updateCartQuantity,
  removeFromCart,
  navigateToCheckout,
  isSearchOpen,
  toggleSearch,
  products,
  wishlist,
  saleBanner,
  categories,
  recipes,
  blogPosts,
  logoUrl,
  storeSettings,
  notifications,
  unreadCount,
  markAsRead
}) => {
  const { isLiteMode } = useLiteMode();

  const activeVariants = isLiteMode ? {
    initial: { opacity: 1, y: 0 },
    in: { opacity: 1, y: 0 },
    out: { opacity: 1, y: 0 }
  } : pageVariants;

  const activeTransition: Transition = isLiteMode ? { duration: 0 } : pageTransition;

  return (
    <div className="bg-transparent text-hav-olive font-sans min-h-screen flex flex-col">
      <div className="sticky top-0 z-50 shadow-md">
        {saleBanner && <SaleCountdownBanner banner={saleBanner} navigateTo={navigateTo} />}
        <Header 
          navigateTo={navigateTo} 
          currentRoute={currentRoute} 
          user={user} 
          onLogout={onLogout}
          cart={cart}
          toggleCart={toggleCart} 
          toggleSearch={toggleSearch}
          products={products}
          wishlistCount={wishlist.length}
          categories={categories}
          recipes={recipes}
          blogPosts={[]}
          logoUrl={logoUrl}
          notifications={notifications}
          unreadCount={unreadCount}
          markAsRead={markAsRead}
        />
        {/* Banner now sits inside the sticky container, below Breadcrumbs (which are in Header) */}
        <StickyCouponBanner 
          cart={cart} 
          navigateTo={navigateTo} 
          storeSettings={storeSettings} 
          currentPage={currentRoute.page} 
        />
      </div>
      <AnimatePresence mode="wait">
        <motion.main
          key={currentRoute.page + JSON.stringify(currentRoute.context)}
          initial="initial"
          animate="in"
          exit="out"
          variants={activeVariants}
          transition={activeTransition}
          className="flex-grow"
        >
          {children}
        </motion.main>
      </AnimatePresence>
      <CartSidebar 
        isOpen={isCartOpen} 
        toggleCart={toggleCart} 
        cart={cart}
        updateCartQuantity={updateCartQuantity}
        removeFromCart={removeFromCart}
        navigateToCheckout={navigateToCheckout}
        storeSettings={storeSettings}
      />
      <SearchOverlay 
        isOpen={isSearchOpen}
        onClose={toggleSearch}
        navigateTo={navigateTo}
        products={products}
      />

      <WhatsAppFloat whatsappNumber={storeSettings?.whatsapp_number} />

      <Footer navigateTo={navigateTo} storeSettings={storeSettings} />
    </div>
  );
};

export default Layout;
