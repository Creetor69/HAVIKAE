import React from 'react';

const LoadingSpinner: React.FC = () => (
  <div className="flex flex-col items-center justify-center space-y-4">
    <div className="w-16 h-16 border-4 border-hav-orange-200 border-t-hav-orange-600 rounded-full animate-spin" role="status">
        <span className="sr-only">Please wait while we bring our tasty and healthy foods to you.</span>
    </div>
    <p className="text-hav-brown font-semibold text-center max-w-xs">Please wait while we bring our tasty and healthy foods to you.</p>
  </div>
);

export default LoadingSpinner;