import React from 'react';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
  ChartOptions,
} from 'chart.js';
import type { Price, Prediction } from '../../../shared/src/index';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface StockChartProps {
  historicalPrices: Price[];
  predictions?: Prediction[];
  symbol: string;
}

const StockChart: React.FC<StockChartProps> = ({
  historicalPrices,
  predictions = [],
  symbol,
}) => {
  // Prepare historical data
  const historicalDates = historicalPrices.map(p =>
    new Date(p.trade_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );
  const historicalPricesData = historicalPrices.map(p => p.close_price);

  // Prepare prediction data from real predictions
  const predictionPrices = predictions.map(p => p.predicted_close_price);

  const predictionDates = predictions.map(p =>
    new Date(p.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  // Combine dates for x-axis
  const allDates = [...historicalDates, ...predictionDates];

  // Calculate metrics from real data
  const currentPrice = historicalPricesData.length > 0
    ? historicalPricesData[historicalPricesData.length - 1]
    : null;
  const firstPrice = historicalPricesData.length > 0 ? historicalPricesData[0] : null;
  const currentPriceChange = (currentPrice && firstPrice && firstPrice > 0)
    ? ((currentPrice - firstPrice) / firstPrice * 100)
    : null;

  // Get the last prediction (furthest in the future)
  const lastPrediction = predictions.length > 0 ? predictions[predictions.length - 1] : null;
  const predictedPrice = lastPrediction?.predicted_close_price ?? null;
  const predictedPriceChange = (currentPrice && predictedPrice)
    ? ((predictedPrice - currentPrice) / currentPrice * 100)
    : null;

  // Get average confidence score from predictions
  const confidenceScore = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / predictions.length
    : null;
  const confidenceLevel = confidenceScore !== null
    ? (confidenceScore > 80 ? 'High' : confidenceScore > 50 ? 'Medium' : 'Low')
    : null;

  // Prepare datasets with gradient
  const data = {
    labels: allDates,
    datasets: [
      {
        label: 'Historical',
        data: [...historicalPricesData, ...Array(predictionPrices.length).fill(null)],
        borderColor: 'rgb(139, 92, 246)', // purple
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(139, 92, 246, 0.4)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
      {
        label: 'Predicted',
        data: [...Array(historicalPrices.length - 1).fill(null), historicalPricesData[historicalPricesData.length - 1], ...predictionPrices],
        borderColor: 'rgb(96, 165, 250)', // lighter blue
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(96, 165, 250, 0.4)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
          return gradient;
        },
        fill: true,
        tension: 0.4,
        pointRadius: 0,
        pointHoverRadius: 5,
        borderWidth: 2,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false, // We'll use custom legend
      },
      title: {
        display: false, // We'll use custom title
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.95)',
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: '#374151',
        borderWidth: 1,
        padding: 12,
        displayColors: true,
        callbacks: {
          label: function(context) {
            let label = context.dataset.label || '';
            if (label) {
              label += ': ';
            }
            if (context.parsed.y !== null) {
              label += '$' + context.parsed.y.toFixed(2);
            }
            return label;
          }
        }
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(55, 65, 81, 0.3)',
          drawTicks: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
          padding: 8,
        },
        border: {
          display: false,
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(55, 65, 81, 0.3)',
          drawTicks: false,
        },
        ticks: {
          color: '#6b7280',
          font: {
            size: 11,
          },
          padding: 8,
          callback: function(value) {
            return '$' + Number(value).toFixed(2);
          },
        },
        border: {
          display: false,
        },
      },
    },
    interaction: {
      mode: 'nearest',
      axis: 'x',
      intersect: false,
    },
  };

  return (
    <div className="w-full h-full flex flex-col">
      {/* Custom Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-1">
            Stock Price Analysis & Prediction
          </h2>
          <p className="text-sm text-gray-400">
            {historicalPrices.length} days historical data + {predictionPrices.length} days AI prediction
          </p>
        </div>

        {/* Custom Legend */}
        <div className="flex gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-purple-500"></div>
            <span className="text-sm text-gray-300">Historical</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-blue-400"></div>
            <span className="text-sm text-gray-300">Predicted</span>
          </div>
        </div>
      </div>

      {/* Chart Area */}
      <div className="flex-1 min-h-0 mb-6">
        <Line data={data} options={options} />
      </div>

      {/* Bottom Info Cards */}
      <div className="grid grid-cols-3 gap-4">
        {/* Current Price Card */}
        <div className="bg-[#0f1e33] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Current Price</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {currentPrice !== null ? `$${currentPrice.toFixed(2)}` : 'N/A'}
          </div>
          <div className={`text-sm font-medium ${currentPriceChange !== null && currentPriceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {currentPriceChange !== null
              ? `${currentPriceChange >= 0 ? '↑' : '↓'} ${Math.abs(currentPriceChange).toFixed(1)}%`
              : 'N/A'}
          </div>
        </div>

        {/* Predicted Price Card */}
        <div className="bg-[#0f1e33] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Predicted (Day {predictions.length || 'N/A'})</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {predictedPrice !== null ? `$${predictedPrice.toFixed(2)}` : 'N/A'}
          </div>
          <div className={`text-sm font-medium ${predictedPriceChange !== null && predictedPriceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {predictedPriceChange !== null
              ? `${predictedPriceChange >= 0 ? '↑' : '↓'} ${Math.abs(predictedPriceChange).toFixed(1)}%`
              : 'N/A'}
          </div>
        </div>

        {/* Confidence Card */}
        <div className="bg-[#0f1e33] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Confidence</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            {confidenceScore !== null ? `${confidenceScore.toFixed(0)}%` : 'N/A'}
          </div>
          <div className={`text-sm font-medium ${confidenceLevel ? 'text-green-400' : 'text-gray-400'}`}>
            {confidenceLevel || 'N/A'}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockChart;
