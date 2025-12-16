import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout';
import { CompanyInfo } from '../../components/sections';
import type { Stock } from '../../../shared/src/index';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import { FaMagnifyingGlass } from 'react-icons/fa6';


interface DashboardProps {
  onSearch?: (query: string) => void;
}



async function fetchStockInfo(symbol: string) {
  const response = await fetch(`/api/stocks/${symbol}`);
  const result = await response.json();

  if (result.success) {
    return result.data;  // This is the Stock object
  } else {
    throw new Error(result.error);
  }
}


const Dashboard: React.FC<DashboardProps> = ({
  onSearch,
}) => {
  // Get the stock symbol from the URL parameter
  const { symbol } = useParams<{ symbol: string }>();
  const navigate = useNavigate();

  const [stock, setStock] = useState<Stock | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = () => {
    if (onSearch) {
      onSearch(searchQuery);
    } else if (searchQuery.trim()) {
      // Navigate to the new stock symbol
      navigate(`/dashboard/${searchQuery.trim().toUpperCase()}`);
    }
  };

  

  useEffect(() => {
    // Don't fetch if no symbol in URL
    if (!symbol) {
      setError('No stock symbol provided');
      setLoading(false);
      return;
    }

    // Reset states when symbol changes
    setLoading(true);
    setError(null);

    // Fetch stock data using the symbol from URL
    fetchStockInfo(symbol)
      .then(data => {
        setStock(data);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [symbol]); // Re-fetch when symbol changes

  if (loading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!stock) return <div>No stock data</div>;

  return (
    // Full-height container with dark background
    <div className="min-h-screen bg-[#0a1628] flex flex-col text-white">

      {/* Navbar at the top */}
      <Navbar />

      {/* Main content area - takes remaining height */}
      <main className="flex-1 flex justify-center px-8 py-8">

        {/* Container with max-width constraint, centered on page */}
        <div className="w-full max-w-[1400px] flex gap-6">

          {/* Left section - 1/3 of the space */}
          <aside className="w-1/3">
          <div className="flex gap-1 w-full max-w-2xl mb-5">
                  <SearchBar
                    value={searchQuery}
                    onChange={setSearchQuery}
                    onSearch={handleSearch}
                    placeholder="Search for a company (e.g., Apple, Tesla...)"
                  />
                  <Button onClick={handleSearch}>
                    <FaMagnifyingGlass size={24} color="white" />
                  </Button>
                </div>
            <CompanyInfo
              stock={stock}
              logoIcon={
                <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                </svg>
              }
            />
          </aside>

          {/* Right section - 2/3 of the space */}
          <section className="w-2/3 bg-bg-input rounded-component p-6">
            <h2 className="text-xl font-semibold mb-4">Main Content</h2>
            <p className="text-gray-300">
              This section takes up 2/3 of the available space.
            </p>
            {/* Add your main content here */}
          </section>

        </div>

      </main>

    </div>
  );
};

export default Dashboard;
