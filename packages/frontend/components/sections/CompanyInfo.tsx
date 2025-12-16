import React from 'react';
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
 * - Company description
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
      <div className="mb-6">
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

      {/* Company description */}
      <div className="text-gray-300 text-sm leading-relaxed">
        {stock.description || 'N/A'}
      </div>
    </Card>
  );
};

export default CompanyInfo;
