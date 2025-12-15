import React from 'react';

interface CardProps {
  children: React.ReactNode;
  className?: string;
}

/**
 * Card - Basic UI card component
 * Provides consistent styling with dark background and rounded corners
 * Used as a building block for section components
 */
const Card: React.FC<CardProps> = ({ children, className = '' }) => {
  return (
    <div className={`bg-bg-input rounded-component p-6 ${className}`}>
      {children}
    </div>
  );
};

export default Card;
