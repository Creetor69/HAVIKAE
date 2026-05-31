
import React from 'react';

const LoadingSpinner: React.FC = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-4 py-12">
      <div className="relative w-16 h-16">
        <div className="absolute inset-0 border-4 border-hav-gold/20 rounded-full"></div>
        <div className="absolute inset-0 border-4 border-hav-gold border-t-transparent rounded-full animate-spin"></div>
      </div>
      <p className="text-hav-forest font-serif italic animate-pulse">Loading Havikar goodness...</p>
    </div>
  );
};

export default LoadingSpinner;
