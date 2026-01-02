import React, { useState } from 'react';
import Card from '../ui/Card';
import CompanyHeader from '../ui/CompanyHeader';
import InfoField from '../ui/InfoField';
import type { StockWithLatestPrice } from '../../../shared/src/index';

interface CompanyInfoProps {
  stock: StockWithLatestPrice;
  logoUrl?: string;
  logoIcon?: React.ReactNode;
}

/**
 * CompanyInfo - Main company information section
 * Displays comprehensive company details including:
 * - Company header (name, ticker, logo)
 * - Key information fields (branch, CEO, website)
 * - Company description (collapsible)
 *
 * Uses smaller UI components:
 * - Card: Basic card wrapper with consistent styling
 * - CompanyHeader: Company name, ticker, and logo display
 * - InfoField: Individual field rows with labels and values
 */
const CompanyInfo: React.FC<CompanyInfoProps> = ({
  stock,
  logoUrl,
  logoIcon
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card>
      {/* Company name, ticker, and logo */}
      <CompanyHeader
        name={stock.name}
        ticker={stock.symbol}
        logoUrl={logoUrl}
        logoIcon={logoIcon}
      />

      {/* Information fields section */}
      <div className="mb-4">
        {/* Branch/Industry field */}
        <InfoField
          label="Industry"
          value={stock.industry || 'N/A'}
        />

        {/* CEO field */}
        <InfoField
          label="CEO"
          value={stock.ceo_name || 'N/A'}
        />

        {/* Website field with link */}
        <InfoField
          label="Website"
          value={stock.website_url || 'N/A'}
          isLink={true}
          linkUrl={stock.website_url || '#'}
        />
      </div>

      {/* Collapsible description section */}
      {stock.description && (
        <div className="border-t border-gray-700 pt-3">
          {/* Expand/Collapse button */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="flex items-center justify-between w-full text-left text-sm text-gray-400 hover:text-white transition-colors py-2"
          >
            <span>Company Description</span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${isExpanded ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {/* Description content - only shown when expanded */}
          {isExpanded && (
            <div className="text-gray-400 text-sm leading-relaxed mt-2 pt-2 border-t border-gray-700">
              {stock.description}
            </div>
          )}
        </div>
      )}
    </Card>
  );
};

export default CompanyInfo;
