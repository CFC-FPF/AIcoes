import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Navbar } from '../../components/layout';
import { CompanyInfo } from '../../components/sections';
import { StockChart } from '../../components/charts';
import type { Stock, Price, Prediction } from '../../../shared/src/index';
import KeyMetricsCard from '../../components/ui/KeyMetricsCard';
import MarketSentimentCard from '../../components/ui/MarketSentimentCard';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import ErrorMessage from '../../components/ui/ErrorMessage';
import AppleLogo from '../../components/ui/icons/AppleLogo';
import DashboardSearchBar from '../../components/sections/DashboardSearchBar';
import ScrollableArea from '../../components/ui/ScrollableArea';


interface DashboardProps {
  onSearch?: (query: string) => void;
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

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

// Format large numbers (e.g., market cap)
function formatMarketCap(value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 1e12) return `$${(value / 1e12).toFixed(2)}T`;
  if (value >= 1e9) return `$${(value / 1e9).toFixed(2)}B`;
  if (value >= 1e6) return `$${(value / 1e6).toFixed(2)}M`;
  return `$${value.toLocaleString()}`;
}

// Format volume (e.g., 52.3M)
function formatVolume(value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  if (value >= 1e9) return `${(value / 1e9).toFixed(1)}B`;
  if (value >= 1e6) return `${(value / 1e6).toFixed(1)}M`;
  if (value >= 1e3) return `${(value / 1e3).toFixed(1)}K`;
  return value.toLocaleString();
}

// Format price (e.g., $198.23)
function formatPrice(value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  return `$${value.toFixed(2)}`;
}

// Format P/E ratio
function formatPERatio(value: number | null): string {
  if (value === null || value === undefined) return 'N/A';
  return value.toFixed(2);
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
  const [sentiments, setSentiments] = useState([]);

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

  // Fetch sentiments when stock data is loaded
  useEffect(() => {
    if (stock?.symbol) {
      fetch(`${API_URL}/api/sentiment/${stock.symbol}`)
        .then(r => r.json())
        .then(data => setSentiments(data.sentiments || []))
        .catch(err => console.error("Failed to fetch sentiment:", err));
    }
  }, [stock?.symbol]);

  return (
    // Full-height container with dark background - exactly 100vh, no scrolling
    <div className="h-screen bg-[#0a1628] flex flex-col text-white overflow-hidden">

      {/* Navbar at the top */}
      <Navbar />

      {/* Main content area - takes remaining height */}
      <main className="flex-1 flex justify-center px-8 py-8 min-h-0">

        {/* Container with max-width constraint, centered on page */}
        <div className="w-full max-w-[1400px] flex gap-6 h-full">

          {/* Left section - 1/3 of the space */}
          <aside className="w-1/3 flex flex-col h-full">
            {/* Search bar - fixed at top */}
            <div className="flex-shrink-0 mb-6">
              <DashboardSearchBar
                value={searchQuery}
                onChange={setSearchQuery}
                onSearch={handleSearch}
              />
            </div>

            {/* Scrollable content area with fade indicators */}
            <div className="flex-1 min-h-0">
              <ScrollableArea className="space-y-6">
                {loading ? (
                  <LoadingSpinner size="md" />
                ) : error ? (
                  <ErrorMessage message={`Error: ${error}`} />
                ) : stock ? (
                  <>
                    <CompanyInfo
                      stock={stock}
                      logoIcon={<AppleLogo />}
                    />
                    <MarketSentimentCard sentiments={sentiments} />
                    <KeyMetricsCard
                      marketCap={formatMarketCap(stock.market_cap)}
                      peRatio={formatPERatio(stock.pe_ratio)}
                      volume={formatVolume(stock.volume)}
                      fiftyTwoWeekHigh={formatPrice(stock.week_52_high)}
                    />
                  </>
                ) : (
                  <div className="text-gray-400 p-4">No stock data</div>
                )}
              </ScrollableArea>
            </div>
          </aside>

          {/* Right section - 2/3 of the space */}
          <section className="w-2/3 bg-bg-input rounded-component p-6 flex items-center justify-center h-full">
            {loading ? (
              <LoadingSpinner size="lg" />
            ) : error ? (
              <ErrorMessage message="Error loading chart data" />
            ) : stock && historicalPrices.length > 0 ? (
              <div className="w-full h-[600px] max-h-full">
                <StockChart
                  key={stock.symbol}
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
