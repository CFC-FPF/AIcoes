import React from 'react';

interface ErrorMessageProps {
  message: string;
  className?: string;
}

/**
 * ErrorMessage - Reusable error display component
 * Shows error messages with consistent styling
 */
const ErrorMessage: React.FC<ErrorMessageProps> = ({
  message,
  className = '',
}) => {
  return (
    <div className={`text-red-400 p-4 ${className}`}>
      {message}
    </div>
  );
};

export default ErrorMessage;
