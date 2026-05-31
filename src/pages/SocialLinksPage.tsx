
import React, { useEffect, useState } from 'react';
import { supabase } from '../supabaseClient';
import { StoreSettings } from '../types';
import InstagramIcon from '../components/icons/InstagramIcon';
import FacebookIcon from '../components/icons/FacebookIcon';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import LoadingSpinner from '../components/LoadingSpinner';

const SocialLinksPage: React.FC = () => {
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchSettings = async () => {
      const { data } = await supabase!.from('store_settings').select('*').eq('id', 1).single();
      setSettings(data);
      setLoading(false);
    }
    fetchSettings();
  }, []);

  if (loading) return <div className="min-h-screen flex items-center justify-center bg-hav-cream"><LoadingSpinner /></div>;

  const whatsappLink = settings?.whatsapp_number 
    ? `https://wa.me/${settings.whatsapp_number}` 
    : "https://wa.me/918296925577";
  
  const instagramLink = settings?.instagram_url || "https://www.instagram.com/havikar_official";
  const facebookLink = settings?.facebook_url || "https://www.facebook.com/profile.php?id=61572846286006";
  const websiteLink = "/";

  return (
    <div className="min-h-screen bg-hav-cream flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Texture */}
        <div className="absolute inset-0 opacity-5 pointer-events-none" style={{backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z' fill='%230F4A3C' fill-rule='evenodd'/%3E%3C/svg%3E")`}}></div>

        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm p-8 rounded-3xl shadow-xl border border-hav-gold/20 text-center relative z-10">
            {settings?.logo_url ? (
                <img src={settings.logo_url} alt="Havikar" className="h-24 mx-auto mb-6 object-contain" />
            ) : (
                <div className="mb-6 flex justify-center text-hav-orange-600">
                    <img src="https://someuoatqyrqbkbiqggi.supabase.co/storage/v1/object/public/media/AIEnhancer_logowithoutbg-removebg-preview.png" alt="Havikar" className="h-20 w-auto object-contain" />
                </div>
            )}
            
            <h1 className="text-2xl font-serif font-bold text-hav-orange-900 mb-2">Connect with Havikar</h1>
            <p className="text-hav-brown mb-8 text-sm">Authentic South Indian Foods & More</p>

            <div className="space-y-4">
                <a href={websiteLink} className="flex items-center justify-center gap-3 w-full bg-hav-forest text-hav-gold font-bold py-4 px-6 rounded-full hover:bg-hav-forest/90 transition-transform hover:scale-105 shadow-md">
                    <span>Visit Website</span>
                </a>

                <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full bg-green-500 text-white font-bold py-4 px-6 rounded-full hover:bg-green-600 transition-transform hover:scale-105 shadow-md">
                    <WhatsAppIcon className="w-6 h-6" />
                    <span>Chat on WhatsApp</span>
                </a>

                <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full bg-gradient-to-r from-purple-500 to-pink-500 text-white font-bold py-4 px-6 rounded-full hover:opacity-90 transition-transform hover:scale-105 shadow-md">
                    <InstagramIcon className="w-6 h-6" />
                    <span>Follow on Instagram</span>
                </a>

                <a href={facebookLink} target="_blank" rel="noopener noreferrer" className="flex items-center justify-center gap-3 w-full bg-blue-600 text-white font-bold py-4 px-6 rounded-full hover:bg-blue-700 transition-transform hover:scale-105 shadow-md">
                    <FacebookIcon className="w-6 h-6" />
                    <span>Like on Facebook</span>
                </a>
                
                <a href="mailto:havikar@bhatco.com" className="flex items-center justify-center gap-3 w-full bg-hav-orange-100 text-hav-orange-800 font-bold py-4 px-6 rounded-full hover:bg-hav-orange-200 transition-transform hover:scale-105 shadow-md">
                    <span>Email Us</span>
                </a>
            </div>
            
            <div className="mt-8 pt-6 border-t border-hav-olive/10 text-xs text-hav-brown/60">
                &copy; {new Date().getFullYear()} Havikar. All rights reserved.
            </div>
        </div>
    </div>
  );
};

export default SocialLinksPage;
