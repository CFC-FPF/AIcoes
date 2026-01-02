import React from 'react';
import Card from './Card';

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

interface KeyMetricsCardProps {
  marketCap?: string;
  peRatio?: string;
  volume?: string;
  fiftyTwoWeekHigh?: string;
}

/**
 * KeyMetricsCard - Displays key financial metrics
 * Shows Market Cap, P/E Ratio, Volume, and 52W High
 * Uses Card component for consistent styling
 */
const KeyMetricsCard: React.FC<KeyMetricsCardProps> = ({
  marketCap = '$2.8T',
  peRatio = '28.5',
  volume = '52.3M',
  fiftyTwoWeekHigh = '$198.23',
}) => {
  return (
    <Card>
      <h2 className="text-white text-xl font-bold mb-4">Key Metrics</h2>
      <div className="grid grid-cols-2 gap-4">
        <MetricItem label="Market Cap" value={marketCap} />
        <MetricItem label="P/E Ratio" value={peRatio} />
        <MetricItem label="Volume" value={volume} />
        <MetricItem label="52W High" value={fiftyTwoWeekHigh} />
      </div>
    </Card>
  );
};

export default KeyMetricsCard;
