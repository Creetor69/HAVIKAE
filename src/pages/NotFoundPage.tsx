
import React from 'react';
import { Page, PageContext } from '../types';

interface NotFoundPageProps {
  navigateTo: (page: Page, context?: PageContext) => void;
}

const NotFoundPage: React.FC<NotFoundPageProps> = ({ navigateTo }) => {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center bg-hav-cream text-center px-4 py-16">
      <img
        src="https://someuoatqyrqbkbiqggi.supabase.co/storage/v1/object/public/media/3f1af040-6076-4357-a228-678410a7fb22_removalai_preview.png"
        alt="Havikar Logo"
        className="h-24 w-auto mb-4 opacity-50"
      />
      <h1 className="text-8xl md:text-9xl font-serif font-bold text-hav-orange-300">404</h1>
      <h2 className="mt-4 text-3xl md:text-4xl font-serif font-bold text-hav-orange-900">Page Not Found</h2>
      <p className="mt-4 max-w-md text-lg text-hav-brown">
        Oops! The page you're looking for doesn't exist. It might have been moved or deleted.
      </p>
      <button
        onClick={() => navigateTo('home')}
        className="mt-8 bg-hav-orange-600 hover:bg-hav-orange-700 text-white font-bold py-3 px-8 rounded-full transition-transform transform hover:scale-105 shadow-lg"
      >
        Return to Homepage
      </button>
    </div>
  );
};

export default NotFoundPage;
