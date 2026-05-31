import React, { useState, useEffect } from 'react';
import InstagramIcon from '../components/icons/InstagramIcon';
import WhatsAppIcon from '../components/icons/WhatsAppIcon';
import EmailIcon from '../components/icons/EmailIcon';
import { supabase } from '../supabaseClient';
import { StoreSettings } from '../types';
import CheckCircleIcon from '../components/icons/CheckCircleIcon';

const ContactPage: React.FC = () => {
  const [formData, setFormData] = useState({ name: '', email: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'sending' | 'success' | 'error'>('idle');
  const [settings, setSettings] = useState<StoreSettings | null>(null);
  
  // Captcha State
  const [captcha, setCaptcha] = useState({ num1: 0, num2: 0 });
  const [captchaInput, setCaptchaInput] = useState('');

  useEffect(() => {
      const fetchSettings = async () => {
          const { data } = await supabase!.from('store_settings').select('*').eq('id', 1).single();
          setSettings(data);
      }
      fetchSettings();
      generateCaptcha();
  }, []);

  const generateCaptcha = () => {
      setCaptcha({
          num1: Math.floor(Math.random() * 10) + 1,
          num2: Math.floor(Math.random() * 10) + 1
      });
      setCaptchaInput('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      
      if (parseInt(captchaInput) !== captcha.num1 + captcha.num2) {
          alert("Incorrect CAPTCHA answer. Please try again.");
          generateCaptcha();
          return;
      }

      setStatus('sending');
      const { error } = await supabase!.from('contact_messages').insert(formData);
      if (error) {
          console.error(error);
          setStatus('error');
      } else {
          setStatus('success');
          setFormData({ name: '', email: '', message: '' });
          generateCaptcha();
      }
  };

  const whatsappLink = settings?.whatsapp_number 
    ? `https://wa.me/${settings.whatsapp_number}` 
    : "https://wa.me/918296925577";
  
  const instagramLink = settings?.instagram_url || "https://www.instagram.com/havikar_official";
  
  // Extract URL from iframe if needed, or use as is
  let mapUrl = "https://maps.app.goo.gl/uX3L9U2j7W6Y8k8k8"; // Default fallback
  if (settings?.maps_embed_url) {
      const input = settings.maps_embed_url.trim();
      if (input.startsWith('<iframe')) {
          const srcMatch = input.match(/src="([^"]+)"/);
          if (srcMatch && srcMatch[1]) {
              mapUrl = srcMatch[1];
          }
      } else {
          mapUrl = input;
      }
  }

  return (
    <div className="bg-hav-cream min-h-screen">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-12">
          <h1 className="text-5xl md:text-6xl font-serif font-bold text-hav-orange-900">Contact Havikar – Let’s Connect</h1>
          <p className="mt-2 text-lg text-hav-brown">For orders, collaborations, and distribution inquiries, contact Havikar — your trusted brand for natural, traditional Indian foods.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-6xl mx-auto">
          <div className="bg-hav-orange-50 p-8 rounded-lg shadow-lg border border-hav-olive/10 flex flex-col justify-center">
            {status === 'success' ? (
                <div className="text-center py-12 animate-fadeIn">
                    <CheckCircleIcon className="w-20 h-20 text-green-600 mx-auto mb-6" />
                    <h2 className="text-3xl font-serif font-bold text-hav-orange-900 mb-2">Message Sent Successfully!</h2>
                    <p className="text-hav-brown mb-8 text-lg">Thank you for reaching out. Our team will get back to you shortly.</p>
                    <button 
                        onClick={() => setStatus('idle')} 
                        className="bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-bold py-3 px-8 rounded-full transition-all shadow-md"
                    >
                        Send Another Message
                    </button>
                </div>
            ) : (
                <>
                <h2 className="text-2xl font-serif font-bold text-hav-orange-800 mb-6">Send us a Message</h2>
                <form className="space-y-4" onSubmit={handleSubmit}>
                <div>
                    <label htmlFor="name" className="block text-sm font-medium text-hav-brown">Name</label>
                    <input required type="text" id="name" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2 px-3 focus:ring-hav-orange-500 focus:border-hav-orange-500 bg-hav-cream" />
                </div>
                <div>
                    <label htmlFor="email" className="block text-sm font-medium text-hav-brown">Email</label>
                    <input required type="email" id="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2 px-3 focus:ring-hav-orange-500 focus:border-hav-orange-500 bg-hav-cream" />
                </div>
                <div>
                    <label htmlFor="message" className="block text-sm font-medium text-hav-brown">Message</label>
                    <textarea required id="message" rows={4} value={formData.message} onChange={e => setFormData({...formData, message: e.target.value})} className="mt-1 block w-full border border-hav-orange-200 rounded-md shadow-sm py-2 px-3 focus:ring-hav-orange-500 focus:border-hav-orange-500 bg-hav-cream"></textarea>
                </div>
                
                {/* CAPTCHA Field */}
                <div>
                    <label htmlFor="captcha" className="block text-sm font-medium text-hav-brown mb-1">
                        Security Check: What is {captcha.num1} + {captcha.num2}?
                    </label>
                    <input 
                        required 
                        type="number" 
                        id="captcha" 
                        value={captchaInput} 
                        onChange={e => setCaptchaInput(e.target.value)} 
                        className="block w-32 border border-hav-orange-200 rounded-md shadow-sm py-2 px-3 focus:ring-hav-orange-500 focus:border-hav-orange-500 bg-hav-cream" 
                        placeholder="?"
                    />
                </div>

                <button type="submit" disabled={status === 'sending'} className="w-full bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg disabled:opacity-50 disabled:transform-none">
                    {status === 'sending' ? 'Sending...' : 'Submit'}
                </button>
                {status === 'error' && <p className="text-red-500 text-center">Something went wrong. Please try again.</p>}
                </form>
                <p className="text-xs text-hav-brown mt-4 text-center">For wholesale inquiries, please fill the form or message us directly.</p>
                </>
            )}
          </div>
          
          <div className="space-y-8">
            <div className="bg-hav-orange-50 p-8 rounded-lg shadow-lg border border-hav-olive/10">
               <h3 className="text-xl font-serif font-bold text-hav-orange-800 mb-4">Connect Directly</h3>
               <a href={whatsappLink} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 p-4 rounded-md hover:bg-hav-orange-100 transition-colors">
                  <WhatsAppIcon className="w-8 h-8 text-hav-orange-600"/>
                  <div>
                      <p className="font-bold text-hav-brown">Chat on WhatsApp</p>
                      <p className="text-sm text-hav-brown">Customer Support</p>
                  </div>
               </a>
               <a href={instagramLink} target="_blank" rel="noopener noreferrer" className="flex items-center space-x-4 p-4 rounded-md hover:bg-hav-orange-100 transition-colors mt-2">
                  <InstagramIcon className="w-8 h-8 text-hav-orange-600"/>
                  <div>
                      <p className="font-bold text-hav-brown">Follow on Instagram</p>
                      <p className="text-sm text-hav-brown">@havikar_official</p>
                  </div>
               </a>
                <a href="mailto:havikar@bhatco.com" className="flex items-center space-x-4 p-4 rounded-md hover:bg-hav-orange-100 transition-colors mt-2">
                  <EmailIcon className="w-8 h-8 text-hav-orange-600"/>
                  <div>
                      <p className="font-bold text-hav-brown">Email Us</p>
                      <p className="text-sm text-hav-brown">havikar@bhatco.com</p>
                  </div>
               </a>
            </div>
            
            {/* STYLIZED MAP HYPERLINK (Replaced Iframe) */}
            <div className="bg-hav-forest text-hav-gold p-8 rounded-lg shadow-lg border border-hav-gold/20 flex flex-col items-center justify-center text-center">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <h4 className="text-xl font-serif font-bold mb-2">Visit Our Kitchen</h4>
                <p className="text-hav-cream/80 text-sm mb-6">Located in the heart of Karnataka. Come taste the purity.</p>
                <a 
                    href={mapUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="bg-hav-gold text-hav-forest font-bold py-3 px-8 rounded-full hover:bg-hav-wheat transition-all shadow-md transform hover:scale-105"
                >
                    Get Directions
                </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContactPage;