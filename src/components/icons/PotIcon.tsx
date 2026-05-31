
import React from 'react';

const PotIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className={className}
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    strokeLinecap="round"
    strokeLinejoin="round"
  >
    <path d="M5.5 13.5A3.5 3.5 0 0 1 9 10V7a4 4 0 0 1 8 0v3a3.5 3.5 0 0 1 3.5 3.5c0 2.2-2.8 4-8 4s-8-1.8-8-4Z" />
    <path d="M3 20h18" />
  </svg>
);

export default PotIcon;
