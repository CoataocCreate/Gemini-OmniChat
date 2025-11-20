import React from 'react';

export const GeminiLogo: React.FC<{ className?: string }> = ({ className = "w-6 h-6" }) => (
  <svg 
    viewBox="0 0 24 24" 
    fill="none" 
    xmlns="http://www.w3.org/2000/svg" 
    className={className}
  >
    <path 
      d="M12.5 2C12.5 2 12.5 8.5 18.5 11.5C12.5 14.5 12.5 21.5 12.5 21.5C12.5 21.5 12.5 14.5 5.5 11.5C12.5 8.5 12.5 2 12.5 2Z" 
      className="fill-current"
    />
    <path 
      d="M18.5 15.5C18.5 15.5 18.5 17.5 20.5 18.5C18.5 19.5 18.5 21.5 18.5 21.5C18.5 21.5 18.5 19.5 16.5 18.5C18.5 17.5 18.5 15.5 18.5 15.5Z" 
      className="fill-current opacity-70"
    />
  </svg>
);