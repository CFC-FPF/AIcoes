import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout';
import { HeroSection } from '../../components/sections';

const Landing: React.FC = () => {
  const navigate = useNavigate();

  const handleSearch = (query: string) => {
    // Validate search input
    if (!query.trim()) {
      return; // Don't search if empty
    }

    // Navigate to dashboard with the stock symbol (uppercase)
    navigate(`/dashboard/${query.trim().toUpperCase()}`);
  };

  return (
    <div className="min-h-screen bg-[#0a1628] flex flex-col text-white">
      <Navbar />
      <main className="flex-1 flex items-center justify-center text-white">
        <HeroSection onSearch={handleSearch} />
      </main>
    </div>
  );
};

export default Landing;