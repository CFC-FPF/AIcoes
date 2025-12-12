import React from 'react';

interface ButtonProps {
  onClick?: () => void;
  children: React.ReactNode;
  className?: string;
}

const Button: React.FC<ButtonProps> = ({ onClick, children, className = '' }) => {
  return (
   <button
      onClick={onClick}
      className={`px-input-x py-input-y bg-gradient-to-r from-brand-light to-brand-dark hover:from-purple-700 hover:to-indigo-800 text-white font-semibold rounded-component transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;