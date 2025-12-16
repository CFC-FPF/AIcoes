import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout';
import { HeroSection } from '../../components/sections';

const Landing: React.FC = () => {
  const navigate = useNavigate();
  const [isSearching, setIsSearching] = useState(false);

  const handleSearch = async (query: string) => {
    // Validate search input
    if (!query.trim()) {
      return; // Don't search if empty
    }

    setIsSearching(true);

    // Small delay to show loading state, then navigate
    // The actual data fetch happens in Dashboard
    await new Promise(resolve => setTimeout(resolve, 300));

    // Navigate to dashboard with the stock symbol (uppercase)
    navigate(`/dashboard/${query.trim().toUpperCase()}`);

    // Note: setIsSearching(false) not needed as component will unmount
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col text-white">
      <Navbar />
      <main className="flex-1 flex items-center justify-center text-white">
        <HeroSection onSearch={handleSearch} isSearching={isSearching} />
      </main>
    </div>
  );
};

export default Landing;