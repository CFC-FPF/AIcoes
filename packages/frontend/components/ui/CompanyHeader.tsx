import React from 'react';

interface CompanyHeaderProps {
  name: string;
  ticker: string;
  logoUrl?: string;
  logoIcon?: React.ReactNode;
}

/**
 * CompanyHeader - Displays company name, ticker, and logo/icon
 * Used at the top of company information cards
 */
const CompanyHeader: React.FC<CompanyHeaderProps> = ({ name, ticker, logoUrl, logoIcon }) => {
  return (
    <div className="flex items-start justify-between mb-6">
      {/* Company name and ticker */}
      <div className="flex flex-col">
        <h1 className="text-2xl font-bold text-white">{name}</h1>
        <span className="text-sm text-gray-400 mt-1">{ticker}</span>
      </div>

      {/* Company logo or icon */}
      <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-brand-light to-brand-dark flex items-center justify-center flex-shrink-0">
        {logoUrl ? (
          <img src={logoUrl} alt={`${name} logo`} className="w-8 h-8 object-contain" />
        ) : logoIcon ? (
          logoIcon
        ) : (
          <span className="text-2xl font-bold text-white">{name.charAt(0)}</span>
        )}
      </div>
    </div>
  );
};

export default CompanyHeader;
