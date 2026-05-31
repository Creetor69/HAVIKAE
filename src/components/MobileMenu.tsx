
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Page, PageContext, User, Recipe } from '../types';
import XIcon from './icons/XIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import UserIcon from './icons/UserIcon';
import HeartIcon from './icons/HeartIcon';
import { Store } from 'lucide-react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
  navigateTo: (page: Page, context?: PageContext) => void;
  user: User | null;
  onLogout: () => void;
  shopCategories: string[];
  featuredRecipes: Recipe[];
}

const MobileLink: React.FC<{ 
    page: Page; 
    context?: PageContext; 
    onClick: () => void; 
    navigateTo: (page: Page, context?: PageContext) => void; 
    className: string;
    children: React.ReactNode 
}> = ({ page, context, onClick, navigateTo, className, children }) => {
    const handleClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        e.stopPropagation(); 
        navigateTo(page, context);
        onClick();
    };
    
    let href = '/';
    if (page !== 'home') href = `/${page}`;
    if (page === 'shop' && context?.category) href = `/shop/${encodeURIComponent(context.category)}`;
    if (page === 'recipeDetail' && context?.recipeId) href = `/recipeDetail/${context.recipeId}`;

    return (
        <a href={href} onClick={handleClick} className={`${className} cursor-pointer`}>
            {children}
        </a>
    );
};

const AccordionItem: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => {
  const [isOpen, setIsOpen] = useState(false);
  return (
    <div>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center py-3 text-lg font-semibold cursor-pointer"
      >
        <span>{title}</span>
        <ChevronDownIcon className={`w-5 h-5 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden pl-4"
          >
            <div className="py-2 border-l border-hav-orange-200">
                {children}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const MobileMenu: React.FC<MobileMenuProps> = ({
  isOpen,
  onClose,
  navigateTo,
  user,
  onLogout,
  shopCategories,
  featuredRecipes,
}) => {
  
  const handleLogout = () => {
    onLogout();
    onClose();
  };
  
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 bg-black/60 z-[60]"
            onClick={onClose}
            aria-hidden="true"
          />
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: '0%' }}
            exit={{ x: '-100%' }}
            transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            className="fixed top-0 left-0 h-full w-full max-w-xs bg-hav-cream shadow-2xl z-[70] flex flex-col"
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
          >
            <div className="flex justify-between items-center p-4 border-b border-hav-orange-200">
              <h2 className="text-xl font-serif font-bold text-hav-orange-900">Menu</h2>
              <button onClick={onClose} className="p-2 rounded-full hover:bg-hav-orange-100" aria-label="Close menu">
                <XIcon className="w-6 h-6 text-hav-brown" />
              </button>
            </div>

            <nav className="flex-grow p-4 overflow-y-auto divide-y divide-hav-orange-200">
              <MobileLink page="home" onClick={onClose} navigateTo={navigateTo} className="block w-full text-left py-3 text-lg font-semibold">Home</MobileLink>

              <AccordionItem title="Shop">
                {shopCategories.map(category => (
                    <MobileLink key={category} page="shop" context={{ category }} onClick={onClose} navigateTo={navigateTo} className="block w-full text-left py-2 pl-4 text-hav-brown hover:text-hav-orange-700">
                        {category}
                    </MobileLink>
                ))}
                <div className="border-t border-hav-orange-100 my-1 mx-4"></div>
                 <MobileLink page="shop" onClick={onClose} navigateTo={navigateTo} className="block w-full text-left py-2 pl-4 font-semibold text-hav-orange-800">
                    View All
                </MobileLink>
              </AccordionItem>

              <MobileLink page="combos" onClick={onClose} navigateTo={navigateTo} className="block w-full text-left py-3 text-lg font-semibold">Bundles</MobileLink>
              
              <AccordionItem title="Recipes">
                 {featuredRecipes.map(recipe => (
                    <MobileLink key={recipe.id} page="recipeDetail" context={{ recipeId: recipe.id }} onClick={onClose} navigateTo={navigateTo} className="block w-full text-left py-2 pl-4 text-hav-brown hover:text-hav-orange-700">
                        {recipe.name}
                    </MobileLink>
                ))}
                <div className="border-t border-hav-orange-100 my-1 mx-4"></div>
                 <MobileLink page="recipes" onClick={onClose} navigateTo={navigateTo} className="block w-full text-left py-2 pl-4 font-semibold text-hav-orange-800">
                    View All Recipes
                </MobileLink>
              </AccordionItem>
              
              <MobileLink page="influencer" onClick={onClose} navigateTo={navigateTo} className="block w-full text-left py-3 text-lg font-semibold animate-pulse text-hav-orange-600">Partners</MobileLink>
              <MobileLink page="about" onClick={onClose} navigateTo={navigateTo} className="block w-full text-left py-3 text-lg font-semibold">About</MobileLink>
              <MobileLink page="contact" onClick={onClose} navigateTo={navigateTo} className="block w-full text-left py-3 text-lg font-semibold">Contact</MobileLink>
            </nav>

            <div className="p-4 border-t border-hav-orange-200">
              {user ? (
                <div className="space-y-3">
                    <div className="flex items-center justify-between bg-hav-orange-100 p-3 rounded-xl border border-hav-orange-200">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-hav-forest rounded-full flex items-center justify-center text-xs font-bold text-hav-gold">₹</div>
                        <span className="text-sm font-bold text-hav-orange-900">Wallet Balance</span>
                      </div>
                      <span className="text-lg font-black text-hav-forest">₹{(user.reward_points || 0).toFixed(2)}</span>
                    </div>
                    <MobileLink page="profile" onClick={onClose} navigateTo={navigateTo} className="flex items-center gap-3 text-hav-brown font-semibold p-2 w-full text-left rounded-md hover:bg-hav-orange-100">
                        <UserIcon className="w-5 h-5"/>
                        My Account
                    </MobileLink>
                    <MobileLink page="wishlist" onClick={onClose} navigateTo={navigateTo} className="flex items-center gap-3 text-hav-brown font-semibold p-2 w-full text-left rounded-md hover:bg-hav-orange-100">
                        <HeartIcon className="w-5 h-5"/>
                        My Wishlist
                    </MobileLink>
                    <button onClick={handleLogout} className="w-full text-center bg-hav-orange-200 hover:bg-hav-orange-300 text-hav-orange-800 font-bold py-2 px-6 rounded-full transition-colors mt-2">
                        Logout
                    </button>
                </div>
              ) : (
                <div className="flex gap-3">
                    <MobileLink page="login" onClick={onClose} navigateTo={navigateTo} className="flex-1 text-center font-bold text-hav-orange-700 hover:text-hav-orange-800 transition-colors py-2 px-4 rounded-full border border-hav-orange-600">
                        Login
                    </MobileLink>
                     <MobileLink page="signup" onClick={onClose} navigateTo={navigateTo} className="flex-1 text-center font-bold bg-hav-orange-600 text-white hover:bg-hav-orange-700 transition-colors py-2 px-4 rounded-full">
                        Sign Up
                    </MobileLink>
                </div>
              )}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default MobileMenu;
