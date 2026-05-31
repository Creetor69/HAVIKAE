
import React, { useState, useRef, useMemo, useEffect } from 'react';
import type { Page, PageContext, AppNotification } from '../types';
import type { User, CartItem, Product, Category, Recipe } from '../types';
import UserIcon from './icons/UserIcon';
import ShoppingCartIcon from './icons/ShoppingCartIcon';
import SearchIcon from './icons/SearchIcon';
import HeartIcon from './icons/HeartIcon';
import MenuIcon from './icons/MenuIcon';
import ChevronDownIcon from './icons/ChevronDownIcon';
import BellIcon from './icons/BellIcon';
import MobileMenu from './MobileMenu';
import Breadcrumbs from './Breadcrumbs';
import { Store } from 'lucide-react';

interface HeaderProps {
  navigateTo: (page: Page, context?: PageContext) => void;
  currentRoute: { page: Page; context: PageContext };
  user: User | null;
  cart: CartItem[];
  toggleCart: () => void;
  toggleSearch: () => void;
  products: Product[];
  wishlistCount: number;
  onLogout: () => void;
  categories: Category[];
  recipes: Recipe[];
  logoUrl?: string | null;
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
}

const CustomLink: React.FC<{ 
    page: Page; 
    context?: PageContext; 
    className?: string; 
    onClick?: () => void;
    navigateTo: (page: Page, context?: PageContext) => void; 
    children: React.ReactNode 
}> = ({ page, context, className, onClick, navigateTo, children }) => {
    const handleClick = (e: React.MouseEvent) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) return;
        e.preventDefault();
        if (onClick) onClick();
        navigateTo(page, context);
    };
    return (
        <a href={`/${page}`} onClick={handleClick} className={className}>
            {children}
        </a>
    );
}

const NavLink: React.FC<{ page: Page; currentPage: Page; navigateTo: (page: Page) => void; children: React.ReactNode; isFlashing?: boolean }> = ({ page, currentPage, navigateTo, children, isFlashing }) => {
  const isActive = currentPage === page;
  return (
    <CustomLink
      page={page}
      navigateTo={navigateTo}
      className={`px-3 py-1.5 text-base font-serif font-semibold transition-all duration-300 rounded-md hover:[text-shadow:0_0_8px_rgba(242,196,76,0.6)] ${
        isActive
          ? 'text-hav-wheat border-b-2 border-hav-wheat'
          : 'text-hav-gold hover:text-hav-wheat'
      } ${isFlashing ? 'animate-pulse text-white font-bold' : ''}`}
    >
      {children}
    </CustomLink>
  );
};

const Header: React.FC<HeaderProps> = ({ navigateTo, currentRoute, user, cart, toggleCart, toggleSearch, products, wishlistCount, onLogout, categories, recipes, logoUrl, notifications, unreadCount, markAsRead }) => {
  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
    const currentPage = currentRoute.page;
    const [isShopDropdownOpen, setIsShopDropdownOpen] = useState(false);
    const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
    const dropdownRef = useRef<HTMLDivElement>(null);
    const notificationsRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
                setIsShopDropdownOpen(false);
            }
            if (notificationsRef.current && !notificationsRef.current.contains(event.target as Node)) {
                setIsNotificationsOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    return (
        <header className="bg-hav-forest shadow-lg sticky top-0 z-50 border-b border-hav-gold/20">
            <div className="max-w-7xl mx-auto px-2 sm:px-4 md:px-6 flex justify-between items-center py-0.5">
                <CustomLink page="home" navigateTo={navigateTo} className="focus:outline-none flex items-center group -ml-2 sm:-ml-4">
                    <div className="relative">
                        {logoUrl ? (
                            <img src={logoUrl} alt="Havikar" className="h-14 md:h-18 w-auto transition-all duration-500 ease-in-out group-hover:scale-105 object-contain drop-shadow-[0_0_10px_rgba(201,162,54,0.3)]" width="160" height="72" loading="lazy" />
                        ) : (
                            <img src="https://someuoatqyrqbkbiqggi.supabase.co/storage/v1/object/public/media/AIEnhancer_logowithoutbg-removebg-preview.png" alt="Havikar" className="h-14 md:h-18 w-auto transition-all duration-500 ease-in-out group-hover:scale-105 object-contain drop-shadow-[0_0_10px_rgba(201,162,54,0.3)]" width="160" height="72" loading="lazy" />
                        )}
                    </div>
                </CustomLink>
                <nav className="hidden md:flex items-center space-x-1">
                    <NavLink page="home" currentPage={currentPage} navigateTo={navigateTo}>Home</NavLink>
                    
                    {/* Shop Dropdown */}
                    <div className="relative" ref={dropdownRef}>
                        <button 
                            onMouseEnter={() => setIsShopDropdownOpen(true)}
                            onClick={() => navigateTo('shop')}
                            className={`px-3 py-1.5 text-base font-serif font-semibold transition-all duration-300 rounded-md flex items-center gap-1 hover:[text-shadow:0_0_8px_rgba(242,196,76,0.6)] ${
                                currentPage === 'shop'
                                    ? 'text-hav-wheat border-b-2 border-hav-wheat'
                                    : 'text-hav-gold hover:text-hav-wheat'
                            }`}
                        >
                            Shop
                            <ChevronDownIcon className={`w-3.5 h-3.5 transition-transform duration-300 ${isShopDropdownOpen ? 'rotate-180' : ''}`} />
                        </button>
                        
                        {isShopDropdownOpen && (
                            <div 
                                className="absolute top-full left-0 w-64 bg-hav-forest border border-hav-gold/20 shadow-2xl rounded-xl py-4 mt-1 animate-fadeIn"
                                onMouseLeave={() => setIsShopDropdownOpen(false)}
                            >
                                <div className="px-4 mb-2 pb-2 border-b border-hav-gold/10 flex flex-col gap-2">
                                    <button 
                                        onClick={() => { navigateTo('shop'); setIsShopDropdownOpen(false); }}
                                        className="text-hav-gold hover:text-hav-wheat font-bold text-sm uppercase tracking-widest text-left"
                                    >
                                        All Collections
                                    </button>
                                    <button 
                                        onClick={() => { navigateTo('shop'); setIsShopDropdownOpen(false); }}
                                        className="text-hav-gold hover:text-hav-wheat font-bold text-xs uppercase tracking-widest text-left opacity-70"
                                    >
                                        View All Products
                                    </button>
                                </div>
                                <div className="max-h-80 overflow-y-auto">
                                    {categories.map(cat => (
                                        <button 
                                            key={cat.id}
                                            onClick={() => { navigateTo('shop', { category: cat.name }); setIsShopDropdownOpen(false); }}
                                            className="w-full text-left px-6 py-3 text-hav-gold hover:bg-hav-gold/10 hover:text-hav-wheat transition-colors text-base font-serif"
                                        >
                                            {cat.name}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    <NavLink page="combos" currentPage={currentPage} navigateTo={navigateTo}>Bundles</NavLink>
                    <NavLink page="recipes" currentPage={currentPage} navigateTo={navigateTo}>Recipes</NavLink>
                    <NavLink page="influencer" currentPage={currentPage} navigateTo={navigateTo} isFlashing={true}>Partners</NavLink>
                    <NavLink page="about" currentPage={currentPage} navigateTo={navigateTo}>About</NavLink>
                    <NavLink page="contact" currentPage={currentPage} navigateTo={navigateTo}>Contact</NavLink>
                </nav>
        <div className="flex items-center space-x-4">
          {user && (
            <div 
              className="hidden md:flex items-center bg-hav-gold/10 border border-hav-gold/20 rounded-full px-3 py-1 gap-2 group hover:bg-hav-gold/20 transition-all cursor-pointer" 
              onClick={() => navigateTo('profile')}
              title="Wallet Balance"
            >
              <div className="w-5 h-5 bg-hav-gold rounded-full flex items-center justify-center text-[10px] font-bold text-hav-forest">₹</div>
              <span className="text-xs font-bold text-hav-gold group-hover:text-hav-wheat">₹{(user.reward_points || 0).toFixed(2)}</span>
            </div>
          )}
          <button onClick={toggleSearch} className="text-hav-gold hover:text-hav-wheat transition-all duration-300 hover:scale-110" aria-label="Search"><SearchIcon className="w-6 h-6" /></button>
          
          {user && (
            <div className="relative" ref={notificationsRef}>
              <button 
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)} 
                className="relative text-hav-gold hover:text-hav-wheat transition-all duration-300 hover:scale-110" 
                aria-label="Notifications"
              >
                <BellIcon className="w-6 h-6" />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white text-[10px] font-bold rounded-full w-4 h-4 flex items-center justify-center border border-hav-forest animate-pulse">
                    {unreadCount}
                  </span>
                )}
              </button>

              {isNotificationsOpen && (
                <div className="absolute top-full right-0 w-80 bg-white border border-hav-gold/20 shadow-2xl rounded-xl py-2 mt-2 animate-fadeIn z-[60]">
                  <div className="px-4 py-2 border-b border-hav-gold/10 flex justify-between items-center">
                    <h3 className="text-sm font-bold text-hav-forest">Notifications</h3>
                    {unreadCount > 0 && (
                      <span className="text-[10px] bg-hav-gold/20 text-hav-forest px-2 py-0.5 rounded-full font-bold">
                        {unreadCount} New
                      </span>
                    )}
                  </div>
                  <div className="max-h-96 overflow-y-auto">
                    {notifications.length > 0 ? (
                      notifications.map(n => (
                        <div 
                          key={n.id} 
                          onClick={() => {
                            if (!n.is_read) markAsRead(n.id);
                            if (n.order_id) navigateTo('profile');
                            setIsNotificationsOpen(false);
                          }}
                          className={`px-4 py-3 hover:bg-hav-cream transition-colors cursor-pointer border-b border-hav-gold/5 last:border-0 ${!n.is_read ? 'bg-hav-gold/5' : ''}`}
                        >
                          <div className="flex justify-between items-start mb-1">
                            <p className={`text-xs font-bold ${!n.is_read ? 'text-hav-forest' : 'text-hav-olive'}`}>{n.title}</p>
                            <span className="text-[9px] text-hav-olive/50">{new Date(n.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-[11px] text-hav-olive leading-relaxed">{n.message}</p>
                        </div>
                      ))
                    ) : (
                      <div className="px-4 py-8 text-center">
                        <BellIcon className="w-8 h-8 text-hav-gold/30 mx-auto mb-2" />
                        <p className="text-xs text-hav-olive/50">No notifications yet</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {user && user.is_admin && (
            <div className="w-6 h-6" />
          )}
          {user ? (
            <>
            <CustomLink page="wishlist" navigateTo={navigateTo} className="relative hidden md:block text-hav-gold hover:text-hav-wheat transition-all duration-300 hover:scale-110" aria-label="Wishlist">
              <HeartIcon className="w-6 h-6" />
              {wishlistCount > 0 && <span className="absolute -top-2 -right-2 bg-red-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-hav-forest">{wishlistCount}</span>}
            </CustomLink>
            <CustomLink page="profile" navigateTo={navigateTo} className="hidden md:block text-hav-gold hover:text-hav-wheat transition-all duration-300 hover:scale-110" aria-label="Profile"><UserIcon className="w-6 h-6" /></CustomLink>
            </>
          ) : (
            <div className="hidden md:flex items-center space-x-2">
                <CustomLink page="login" navigateTo={navigateTo} className="text-xs font-bold text-hav-gold border border-hav-gold hover:bg-hav-gold hover:text-hav-forest transition-all duration-300 px-3 py-1 rounded-md">Login</CustomLink>
                <CustomLink page="signup" navigateTo={navigateTo} className="text-xs font-bold bg-hav-gold text-hav-forest hover:bg-hav-wheat transition-all duration-300 px-3 py-1 rounded-md">Sign Up</CustomLink>
            </div>
          )}
          <button onClick={toggleCart} className="relative text-hav-gold hover:text-hav-wheat transition-all duration-300 hover:scale-110" aria-label="Cart">
            <ShoppingCartIcon className="w-6 h-6" />
            {cartItemCount > 0 && <span className="absolute -top-2 -right-2 bg-orange-600 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center border border-hav-forest">{cartItemCount}</span>}
          </button>
          <div className="md:hidden"><button onClick={() => setIsMobileMenuOpen(true)} className="text-hav-gold hover:text-hav-wheat transition-all duration-300 p-1" aria-label="Open Menu"><MenuIcon className="w-6 h-6" /></button></div>
        </div>
      </div>
      
      <MobileMenu
        isOpen={isMobileMenuOpen}
        onClose={() => setIsMobileMenuOpen(false)}
        navigateTo={navigateTo}
        user={user}
        onLogout={onLogout}
        shopCategories={categories.map(c => c.name)}
        featuredRecipes={recipes.slice(0, 5)}
      />

    </header>
  );
};

export default Header;
