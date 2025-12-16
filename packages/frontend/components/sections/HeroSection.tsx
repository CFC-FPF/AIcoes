import React, { useState } from 'react';
import SearchBar from '../ui/SearchBar';
import Button from '../ui/Button';
import StatCard from '../ui/StatCard';

interface HeroSectionProps {
  onSearch?: (query: string) => void;
  className?: string;
  isSearching?: boolean;
}

const HeroSection: React.FC<HeroSectionProps> = ({
  onSearch,
  className = '',
  isSearching = false
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    } else {
      console.log('Searching for:', searchQuery);
    }
  };

  return (
    <main className={`flex flex-col items-center justify-center px-8 pt-32 pb-20 ${className}`}>
      {/* Title */}
      <h1 className="text-6xl font-bold text-center mb-4 leading-tight">
        AI Stock
        <br />
        Predictions
      </h1>
      
      {/* Subtitle */}
      <p className="text-gray-400 text-center mb-12 max-w-2xl">
        Search for any company to view stock analysis and AI-powered predictions
      </p>

      {/* Search Bar */}
      <div className="flex gap-4 w-full max-w-2xl mb-20">
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          onSearch={handleSearch}
          placeholder="Search for a company (e.g., Apple, Tesla...)"
          autoFocus
        />
        <Button onClick={handleSearch} loading={isSearching}>
          Search
        </Button>
      </div>

      {/* Stats */}
      <div className="flex gap-12 items-center">
        <StatCard value="15" label="Days History" color="blue" />
        
        <div className="w-px h-12 bg-gray-700"></div>
        
        <StatCard value="5" label="Days Prediction" color="purple" />
        
        <div className="w-px h-12 bg-gray-700"></div>
        
        <StatCard value="AI" label="Powered" color="emerald" />
      </div>
    </main>
  );
};

export default HeroSection;