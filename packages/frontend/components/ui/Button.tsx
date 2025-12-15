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
      className={`px-input-x py-input-y bg-gradient-to-r from-purple-700 to-indigo-800 hover:from-brand-light hover:to-brand-dark text-white font-semibold rounded-component transition-colors ${className}`}
    >
      {children}
    </button>
  );
};

export default Button;