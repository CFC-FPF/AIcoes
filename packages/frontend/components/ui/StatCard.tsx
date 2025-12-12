import React from 'react';

interface StatCardProps {
  value: string | number;
  label: string;
  color?: 'blue' | 'purple' | 'emerald';
  className?: string;
}

const StatCard: React.FC<StatCardProps> = ({
  value,
  label,
  color = 'blue',
  className = '',
}) => {
  const colorClasses = {
    blue: 'text-blue-400',
    purple: 'text-purple-400',
    emerald: 'text-emerald-400',
  };

  return (
    <div className={`text-center ${className}`}>
      <div className={`text-4xl font-bold ${colorClasses[color]} mb-1`}>
        {value}
      </div>
      <div className="text-sm text-gray-400">{label}</div>
    </div>
  );
};

export default StatCard;