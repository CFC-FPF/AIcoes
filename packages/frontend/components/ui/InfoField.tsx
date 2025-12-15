import React from 'react';

interface InfoFieldProps {
  label: string;
  value: string | React.ReactNode;
  isLink?: boolean;
  linkUrl?: string;
  valueColor?: string;
}

/**
 * InfoField - Displays a labeled field with value
 * Used for displaying company details like Branch, CEO, Website
 * Supports link functionality for clickable values
 */
const InfoField: React.FC<InfoFieldProps> = ({
  label,
  value,
  isLink = false,
  linkUrl,
  valueColor = 'text-white'
}) => {
  return (
    <div className="flex items-center justify-between py-3 border-b border-gray-700 last:border-b-0">
      {/* Field label */}
      <span className="text-gray-400 text-sm">{label}</span>

      {/* Field value */}
      {isLink && linkUrl ? (
        <a
          href={linkUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-brand-light hover:text-brand-dark transition-colors flex items-center gap-2"
        >
          {value}
          {/* External link icon */}
          <svg
            className="w-4 h-4"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
            />
          </svg>
        </a>
      ) : (
        <span className={`font-medium ${valueColor}`}>{value}</span>
      )}
    </div>
  );
};

export default InfoField;
