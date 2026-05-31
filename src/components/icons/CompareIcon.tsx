
import React from 'react';

const CompareIcon: React.FC<{ className?: string }> = ({ className }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="M16 3h5v5" />
    <path d="M8 21H3v-5" />
    <path d="M12 12 21 3" />
    <path d="M12 12 3 21" />
  </svg>
);

export default CompareIcon;
