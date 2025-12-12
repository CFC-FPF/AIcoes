import React from 'react';
import { Navbar } from '../../components/layout';
import { HeroSection } from '../../components/sections';

const Landing: React.FC = () => {
  const handleSearch = (query: string) => {
    // Add your search logic here
    console.log('Searching for:', query);
    // For example: navigate to results page, call API, etc.
  };

  return (
    <div className="min-h-screen bg-[#0a1628] text-white">
      <Navbar />
      <HeroSection onSearch={handleSearch} />
    </div>
  );
};

export default Landing;