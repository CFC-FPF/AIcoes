import React from 'react';
import Card from './Card';

type SentimentType = 'bullish' | 'neutral' | 'ai-insight';

interface SentimentItemProps {
  type: SentimentType;
  title: string;
  description: string;
}

const SentimentItem: React.FC<SentimentItemProps> = ({ type, title, description }) => {
  const getStyles = () => {
    switch (type) {
      case 'bullish':
        return {
          bg: 'bg-emerald-950/40',
          border: 'border-emerald-500/30',
          icon: '📈',
          iconColor: 'text-emerald-400',
          titleColor: 'text-emerald-400',
        };
      case 'neutral':
        return {
          bg: 'bg-gray-900/40',
          border: 'border-gray-500/30',
          icon: '💲',
          iconColor: 'text-gray-400',
          titleColor: 'text-gray-400',
        };
      case 'ai-insight':
        return {
          bg: 'bg-purple-950/40',
          border: 'border-purple-500/30',
          icon: '🔮',
          iconColor: 'text-purple-400',
          titleColor: 'text-purple-400',
        };
    }
  };

  const styles = getStyles();

  return (
    <div className={`${styles.bg} border ${styles.border} rounded-lg p-4 mb-3 last:mb-0`}>
      <div className="flex items-start gap-3">
        <span className={`text-2xl ${styles.iconColor}`}>{styles.icon}</span>
        <div className="flex-1">
          <div className={`${styles.titleColor} font-semibold text-sm uppercase mb-2`}>
            {title}
          </div>
          <div className="text-gray-300 text-sm leading-relaxed">
            {description}
          </div>
        </div>
      </div>
    </div>
  );
};

interface SentimentData {
  type: SentimentType;
  title: string;
  description: string;
}

interface MarketSentimentCardProps {
  sentiments?: SentimentData[];
}

/**
 * MarketSentimentCard - Displays market sentiment indicators
 * Shows bullish, neutral, and AI-generated insights
 * Uses Card component for consistent styling
 */
const MarketSentimentCard: React.FC<MarketSentimentCardProps> = ({
  sentiments = [
    {
      type: 'bullish',
      title: 'BULLISH',
      description: 'Strong Q4 earnings beat expectations with 12% revenue growth',
    },
    {
      type: 'neutral',
      title: 'NEUTRAL',
      description: 'New product launch scheduled for next quarter',
    },
    {
      type: 'ai-insight',
      title: 'AI INSIGHT',
      description: 'Technical indicators suggest upward momentum with strong support at $175',
    },
  ],
}) => {
  return (
    <Card>
      <div className="flex items-center gap-2 mb-4">
        <span className="text-purple-400 text-xl">📊</span>
        <h2 className="text-white text-xl font-bold">Market Sentiment</h2>
      </div>
      <div>
        {sentiments.map((sentiment, index) => (
          <SentimentItem
            key={index}
            type={sentiment.type}
            title={sentiment.title}
            description={sentiment.description}
          />
        ))}
      </div>
    </Card>
  );
};

export default MarketSentimentCard;
