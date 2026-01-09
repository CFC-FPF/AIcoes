import React from 'react';
import Card from './Card';
import type { Stock } from '../../../shared/src/index';

interface MetricItemProps {
  label: string;
  value: string;
}

const MetricItem: React.FC<MetricItemProps> = ({ label, value }) => {
  return (
    <div className="bg-bg-dark rounded-lg p-4">
      <div className="text-gray-400 text-sm mb-1">{label}</div>
      <div className="text-white text-xl font-semibold">{value}</div>
    </div>
  );
};

/**
 * Converts raw market cap number to human-readable format
 * Example: 3500000000000 → "$3.50T" (trillions)
 *          450000000000  → "$450.00B" (billions)
 *          89000000      → "$89.00M" (millions)
 */
const formatMarketCap = (val: number | null | undefined): string => {
  if (!val) return 'N/A';
  if (val >= 1_000_000_000_000) return `$${(val / 1_000_000_000_000).toFixed(2)}T`;
  if (val >= 1_000_000_000) return `$${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `$${(val / 1_000_000).toFixed(2)}M`;
  return `$${val.toFixed(2)}`;
};

/**
 * Converts raw volume number to human-readable format (no $ sign)
 * Example: 52300000 → "52.30M" (millions)
 *          1500000  → "1.50M"
 *          85000    → "85.00K" (thousands)
 */
const formatVolume = (val: number | null | undefined): string => {
  if (!val) return 'N/A';
  if (val >= 1_000_000_000) return `${(val / 1_000_000_000).toFixed(2)}B`;
  if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(2)}M`;
  if (val >= 1_000) return `${(val / 1_000).toFixed(2)}K`;
  return val.toString();
};

interface KeyMetricsCardProps {
  stock: Stock;
}

/**
 * KeyMetricsCard - Displays key financial metrics
 * Shows Market Cap, P/E Ratio, Volume, and 52W High
 * Uses Card component for consistent styling
 */
const KeyMetricsCard: React.FC<KeyMetricsCardProps> = ({ stock }) => {
  return (
    <Card>
      <h2 className="text-white text-xl font-bold mb-4">Key Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        <MetricItem label="Market Cap" value={formatMarketCap(stock.market_cap)} />
        <MetricItem label="P/E Ratio" value={stock.pe_ratio?.toFixed(2) || 'N/A'} />
        <MetricItem label="Volume" value={formatVolume(stock.volume)} />
        <MetricItem label="52W High" value={stock.week_52_high ? `$${stock.week_52_high.toFixed(2)}` : 'N/A'} />
      </div>
    </Card>
  );
};

export default KeyMetricsCard;
