
import React from 'react';
import { MessageCircle } from 'lucide-react';

interface WhatsAppFloatProps {
  whatsappNumber?: string | null;
}

const WhatsAppFloat: React.FC<WhatsAppFloatProps> = ({ whatsappNumber }) => {
  const rawNumber = whatsappNumber || "8296925577";
  // Clean special characters if any
  const cleaned = rawNumber.replace(/\D/g, '');
  const phoneNumber = cleaned.startsWith('91') || cleaned.length > 10 ? cleaned : '91' + cleaned;
  
  const message = "Hi Havikar! I'd like to know more about your products.";
  const url = `https://wa.me/${phoneNumber}?text=${encodeURIComponent(message)}`;

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="fixed bottom-8 right-8 z-[60] bg-[#25D366] text-white p-4 rounded-full shadow-2xl hover:scale-110 transition-transform flex items-center justify-center group"
      aria-label="Chat on WhatsApp"
    >
      <MessageCircle size={32} fill="currentColor" />
      <span className="absolute right-full mr-4 bg-white text-hav-forest px-4 py-2 rounded-xl text-sm font-bold shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none border border-hav-gold/20">
        Chat with us
      </span>
    </a>
  );
};

export default WhatsAppFloat;
