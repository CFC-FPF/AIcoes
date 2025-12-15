import React from 'react';
import Card from '../ui/Card';
import CompanyHeader from '../ui/CompanyHeader';
import InfoField from '../ui/InfoField';
import type { Stock } from '../../../shared/src/index'

interface CompanyInfoProps {
  name: string;
  ticker: string;
  branch: string;
  ceo: string;
  website: string;
  description: string;
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
  name,
  ticker,
  branch,
  ceo,
  website,
  description,
  logoUrl,
  logoIcon
  
}) => {
  return (
    <Card>
      {/* Company name, ticker, and logo */}
      <CompanyHeader
        name={name}
        ticker={ticker}
        logoUrl={logoUrl}
        logoIcon={logoIcon}
      />

      {/* Information fields section */}
      <div className="mb-6">
        {/* Branch/Industry field */}
        <InfoField
          label="Branch"
          value={branch}
        />

        {/* CEO field */}
        <InfoField
          label="CEO"
          value={ceo}
        />

        {/* Website field with link */}
        <InfoField
          label="Website"
          value={website}
          isLink={true}
          linkUrl={`https://${website}`}
        />
      </div>

      {/* Company description */}
      <div className="text-gray-300 text-sm leading-relaxed">
        {description}
      </div>
    </Card>
  );
};

export default CompanyInfo;
