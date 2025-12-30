import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout';
import { CompanyInfo } from '../../components/sections';
import { StockChart } from '../../components/charts';
import type { Stock, Price, Prediction } from '../../../shared/src/index';
import SearchBar from '../../components/ui/SearchBar';
import Button from '../../components/ui/Button';
import { FaMagnifyingGlass } from 'react-icons/fa6';


interface DashboardProps {
  onSearch?: (query: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || '';

async function fetchStockInfo(symbol: string) {
  const response = await fetch(`${API_URL}/api/stocks/${symbol}`);
  const result = await response.json();

  if (result.success) {
    return result.data;
  } else {
    throw new Error(result.error);
  }
}

async function fetchStockHistory(symbol: string, limit = 15) {
  const response = await fetch(`${API_URL}/api/stocks/${symbol}/history?limit=${limit}`);
  const result = await response.json();

  if (result.success) {
    return result.data as Price[];
  } else {
    throw new Error(result.error);
  }
}

async function fetchStockPredictions(symbol: string) {
  const response = await fetch(`${API_URL}/api/stocks/${symbol}/predictions`);
  const result = await response.json();

  if (result.success) {
    return result.data as Prediction[];
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
  const [historicalPrices, setHistoricalPrices] = useState<Price[]>([]);
  const [predictions, setPredictions] = useState<Prediction[]>([]);
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

    // Fetch all data in parallel
    Promise.all([
      fetchStockInfo(symbol),
      fetchStockHistory(symbol, 15),
      fetchStockPredictions(symbol),
    ])
      .then(([stockData, historyData, predictionsData]) => {
        setStock(stockData);
        setHistoricalPrices(historyData.reverse()); // Reverse to show oldest first
        setPredictions(predictionsData);
        setLoading(false);
      })
      .catch(err => {
        setError(err.message);
        setLoading(false);
      });
  }, [symbol]); // Re-fetch when symbol changes

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

            {loading ? (
              <div className="flex items-center justify-center h-48 text-gray-400">
                <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : error ? (
              <div className="text-red-400 p-4">Error: {error}</div>
            ) : stock ? (
              <CompanyInfo
                stock={stock}
                logoIcon={
                  <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z" />
                  </svg>
                }
              />
            ) : (
              <div className="text-gray-400 p-4">No stock data</div>
            )}
          </aside>

          {/* Right section - 2/3 of the space */}
          <section className="w-2/3 bg-bg-input rounded-component p-6">
            {loading ? (
              <div className="flex items-center justify-center h-96 text-gray-400">
                <svg className="animate-spin h-8 w-8" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              </div>
            ) : error ? (
              <div className="text-red-400 p-4">Error loading chart data</div>
            ) : stock && historicalPrices.length > 0 ? (
              <div className="h-[500px]">
                <StockChart
                  historicalPrices={historicalPrices}
                  predictions={predictions}
                  symbol={stock.symbol}
                />
              </div>
            ) : (
              <div className="text-gray-400 p-4">No chart data available</div>
            )}
          </section>

        </div>

      </main>

    </div>
  );
};

export default Dashboard;
