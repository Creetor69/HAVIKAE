
import React from 'react';

const HavikarLogoIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg viewBox="0 0 200 100" className={className} xmlns="http://www.w3.org/2000/svg">
    <text x="50%" y="50%" dominantBaseline="middle" textAnchor="middle" fontFamily="serif" fontWeight="900" fontSize="40" fill="currentColor">HAVIKAR</text>
    <path d="M20 80 Q 100 100 180 80" fill="none" stroke="currentColor" strokeWidth="4" />
  </svg>
);

export default HavikarLogoIcon;
