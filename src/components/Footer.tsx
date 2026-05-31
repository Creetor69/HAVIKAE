
import React from 'react';
import InstagramIcon from './icons/InstagramIcon';
import WhatsAppIcon from './icons/WhatsAppIcon';
import FacebookIcon from './icons/FacebookIcon';
import CreditCardIcon from './icons/CreditCardIcon';
import { Page, PageContext, StoreSettings } from '../types';

interface FooterProps {
  navigateTo: (page: Page, context?: PageContext) => void;
  storeSettings: StoreSettings | null;
}

const getHref = (page: Page, context: PageContext = {}) => {
    switch(page) {
        case 'home': return '/';
        case 'shop': return context.category ? `/shop/${encodeURIComponent(context.category)}` : '/shop';
        case 'product': return `/product/${context.productId}`;
        case 'recipes': return '/recipes';
        case 'about': return '/about';
        case 'contact': return '/contact';
        case 'influencer': return '/influencer';
        case 'sitemap': return '/sitemap';
        case 'legal': return `/legal/${context.documentId}`;
        case 'social': return '/social';
        default: return '/';
    }
};

const FooterLink: React.FC<{ page: Page; context?: PageContext; navigateTo: (page: Page, context?: PageContext) => void; children: React.ReactNode }> = ({ page, context, navigateTo, children }) => {
    const href = getHref(page, context);
    return (
        <a 
            href={href}
            onClick={(e) => {
                if (e.ctrlKey || e.metaKey || e.shiftKey) return;
                e.preventDefault();
                navigateTo(page, context);
            }}
            className="text-hav-cream hover:text-hav-gold transition-all duration-300 hover:pl-1"
        >
            {children}
        </a>
    );
};

const Footer: React.FC<FooterProps> = ({ navigateTo, storeSettings }) => {
  const whatsappLink = storeSettings?.whatsapp_number 
    ? `https://wa.me/${storeSettings.whatsapp_number}` 
    : "https://wa.me/918296925577";
  
  const instagramLink = storeSettings?.instagram_url || "https://www.instagram.com/havikar_official";
  const facebookLink = storeSettings?.facebook_url || "https://www.facebook.com/profile.php?id=61572846286006";

  return (
    <footer className="bg-hav-forest text-hav-cream pt-12 pb-6 border-t-4 border-hav-gold">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 items-start text-center md:text-left">
          
          <div className="flex flex-col items-center md:items-start">
             <FooterLink page="home" navigateTo={navigateTo}>
                {storeSettings?.logo_url ? (
                    <img 
                      src={storeSettings.logo_url} 
                      alt="Havikar Logo" 
                      className="h-24 w-auto transition-all duration-500 ease-in-out hover:brightness-110 object-contain" 
                      loading="lazy"
                    />
                ) : (
                    <img 
                      src="https://someuoatqyrqbkbiqggi.supabase.co/storage/v1/object/public/media/AIEnhancer_logowithoutbg-removebg-preview.png" 
                      alt="Havikar Logo" 
                      className="h-24 w-auto transition-all duration-500 ease-in-out hover:brightness-110 object-contain" 
                      loading="lazy"
                    />
                )}
            </FooterLink>
            <p className="mt-4 text-sm text-hav-wheat/80">The Flavour of Life. <br/> Authentic South Indian tastes, delivered to you.</p>
             <div className="flex space-x-4 mt-6 justify-center md:justify-start">
                <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="text-hav-gold hover:text-hav-wheat transition-all duration-300 hover:scale-110">
                  <InstagramIcon className="w-6 h-6"/>
                </a>
                <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="text-hav-gold hover:text-hav-wheat transition-all duration-300 hover:scale-110">
                  <FacebookIcon className="w-6 h-6"/>
                </a>
                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="text-hav-gold hover:text-hav-wheat transition-all duration-300 hover:scale-110">
                   <WhatsAppIcon className="w-6 h-6"/>
                </a>
            </div>
          </div>

          <div>
            <h4 className="font-serif font-bold text-lg text-hav-gold mb-6 border-b border-hav-olive pb-2 inline-block md:block">Explore</h4>
            <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
              <li><FooterLink page="about" navigateTo={navigateTo}>About Us</FooterLink></li>
              <li><FooterLink page="recipes" navigateTo={navigateTo}>Recipes</FooterLink></li>
              <li><FooterLink page="contact" navigateTo={navigateTo}>Contact Us</FooterLink></li>
              <li><FooterLink page="sitemap" navigateTo={navigateTo}>Sitemap</FooterLink></li>
              <li><FooterLink page="influencer" navigateTo={navigateTo}>Partners</FooterLink></li>
              <li><FooterLink page="social" navigateTo={navigateTo}>Social Links</FooterLink></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif font-bold text-lg text-hav-gold mb-6 border-b border-hav-olive pb-2 inline-block md:block">Shop</h4>
            <ul className="space-y-3 text-sm flex flex-col items-center md:items-start">
              <li><FooterLink page="shop" navigateTo={navigateTo}>All Products</FooterLink></li>
              <li><FooterLink page="shop" context={{ category: 'Snacks' }} navigateTo={navigateTo}>Snacks</FooterLink></li>
              <li><FooterLink page="shop" context={{ category: 'Spice Blends' }} navigateTo={navigateTo}>Spice Blends</FooterLink></li>
              <li><FooterLink page="shop" context={{ category: 'Drinks' }} navigateTo={navigateTo}>Drinks</FooterLink></li>
            </ul>
          </div>
          
          <div>
            <h4 className="font-serif font-bold text-lg text-hav-gold mb-6 border-b border-hav-olive pb-2 inline-block md:block">Stay Connected</h4>
            <p className="text-sm text-hav-cream mb-4">Get recipes and exclusive offers.</p>
            <form className="flex max-w-xs mx-auto md:mx-0">
              <input type="email" placeholder="Your email" className="w-full rounded-l-md rounded-r-none px-3 py-2 bg-hav-cream text-hav-forest border border-hav-gold focus:outline-none focus:ring-1 focus:ring-hav-gold text-sm placeholder:text-hav-olive/50" />
              <button className="bg-hav-gold hover:bg-hav-wheat text-hav-forest font-bold py-2 px-4 rounded-r-md rounded-l-none transition-all duration-300 text-sm whitespace-nowrap">Sign Up</button>
            </form>
              <div className="mt-8">
                <h4 className="font-semibold text-hav-gold mb-2 text-xs uppercase tracking-wider">Certifications</h4>
                <div className="flex justify-center md:justify-start space-x-4 items-center opacity-80">
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[10px] text-hav-wheat font-bold">FSSAI Lic. No.</span>
                        <span className="text-[10px] text-hav-cream">21224194000714</span>
                    </div>
                    <div className="w-px h-6 bg-hav-gold/30"></div>
                    <div className="flex flex-col items-center md:items-start">
                        <span className="text-[10px] text-hav-wheat font-bold">ISO Certified</span>
                        <span className="text-[10px] text-hav-cream">9001:2015</span>
                    </div>
                </div>
            </div>
             <div className="mt-8">
                <h4 className="font-semibold text-hav-gold mb-2 text-xs uppercase tracking-wider">We Accept</h4>
                <div className="flex justify-center md:justify-start space-x-2 items-center opacity-80">
                    <CreditCardIcon className="w-8 h-8 text-hav-wheat" />
                    <span className="text-hav-cream text-xs">UPI & All major cards</span>
                </div>
            </div>
          </div>

        </div>
        
        <div className="border-t border-hav-olive mt-12 pt-6 text-sm text-hav-wheat/60">
            <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="flex items-center gap-2">
                    <p>&copy; {new Date().getFullYear()} Havikar. All Rights Reserved.</p>
                    <span className="hidden md:inline text-hav-gold/40">|</span>
                    <span className="flex items-center gap-1 text-hav-gold font-bold text-[10px] uppercase tracking-widest">
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor"><path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z"/></svg>
                        Made in Karnataka
                    </span>
                </div>
                <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                    <FooterLink page="legal" context={{ documentId: 'privacy-policy' }} navigateTo={navigateTo}>Privacy Policy</FooterLink>
                    <FooterLink page="legal" context={{ documentId: 'terms-and-conditions' }} navigateTo={navigateTo}>Terms & Conditions</FooterLink>
                    <FooterLink page="legal" context={{ documentId: 'shipping-policy' }} navigateTo={navigateTo}>Shipping Policy</FooterLink>
                    <FooterLink page="legal" context={{ documentId: 'disclaimer' }} navigateTo={navigateTo}>Disclaimer</FooterLink>
                </div>
            </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
