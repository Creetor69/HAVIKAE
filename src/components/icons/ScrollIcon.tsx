
import React from 'react';

const ScrollIcon: React.FC<{ className?: string }> = ({ className }) => (
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
    <path d="M8 21h12a2 2 0 0 0 2-2v-2H10v2a2 2 0 1 1-4 0V5a2 2 0 1 0-4 0v3h10" />
    <path d="M19 17a2 2 0 0 0 2-2" />
    <path d="M15 17a2 2 0 0 0 2-2" />
    <path d="M11 17a2 2 0 0 0 2-2" />
  </svg>
);

export default ScrollIcon;
