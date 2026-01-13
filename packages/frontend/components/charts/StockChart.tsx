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

  // Prepare prediction data from actual predictions prop
  const predictionPrices = predictions.map(p => p.predicted_close_price);
  const predictionDates = predictions.map(p =>
    new Date(p.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );

  // Get average confidence score from predictions
  const avgConfidence = predictions.length > 0
    ? predictions.reduce((sum, p) => sum + (p.confidence_score || 0), 0) / predictions.length
    : 0;

  // Combine dates for x-axis
  // Add "Today" as a bridge label between historical and predictions
  // This prevents the visual gap when historical data ends (e.g., Dec 31) and predictions start (e.g., Jan 14)
  const todayLabel = new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  const allDates = [...historicalDates, todayLabel, ...predictionDates];

  // Calculate metrics using real data
  const currentPrice = historicalPricesData.length > 0
    ? historicalPricesData[historicalPricesData.length - 1]
    : 0;
  const firstPrice = historicalPricesData.length > 0 ? historicalPricesData[0] : 0;
  const currentPriceChange = firstPrice > 0
    ? ((currentPrice - firstPrice) / firstPrice * 100)
    : 0;

  // Use last prediction price (day 5) from actual predictions
  const predictedPrice = predictionPrices.length > 0 ? predictionPrices[predictionPrices.length - 1] : 0;
  const predictedPriceChange = currentPrice > 0
    ? ((predictedPrice - currentPrice) / currentPrice * 100)
    : 0;

  // Use average confidence from actual predictions (convert from 0-1 to percentage)
  const confidenceScore = Math.round(avgConfidence * 100);
  const confidenceLevel = confidenceScore > 60 ? 'High' : confidenceScore > 40 ? 'Medium' : 'Low';

  // For smooth connection: create a single combined line that changes color
  // Historical ends at last price, prediction starts from that same point
  const lastHistPrice = historicalPricesData[historicalPricesData.length - 1];

  // Prepare datasets with gradient
  // Note: allDates = [...historicalDates, todayLabel, ...predictionDates]
  // So we need: historical data points + 1 for "Today" bridge + prediction points
  const data = {
    labels: allDates,
    datasets: [
      {
        label: 'Historical',
        // Historical data + lastHistPrice at "Today" position + nulls for prediction dates
        data: [...historicalPricesData, lastHistPrice, ...Array(predictionPrices.length).fill(null)],
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
        // Nulls for historical + lastHistPrice at "Today" position (bridge) + predictions
        data: [...Array(historicalPrices.length).fill(null), lastHistPrice, ...predictionPrices],
        borderColor: 'rgb(96, 165, 250)', // lighter blue
        backgroundColor: (context: any) => {
          const ctx = context.chart.ctx;
          const gradient = ctx.createLinearGradient(0, 0, 0, 400);
          gradient.addColorStop(0, 'rgba(96, 165, 250, 0.4)');
          gradient.addColorStop(1, 'rgba(59, 130, 246, 0.05)');
          return gradient;
        },
        fill: true,
        tension: 0.4, // Same tension for smooth curve continuity
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
            {historicalPrices.length} days historical data + {predictions.length} days AI prediction
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
            ${currentPrice.toFixed(2)}
          </div>
          <div className={`text-sm font-medium ${currentPriceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {currentPriceChange >= 0 ? '↑' : '↓'} {Math.abs(currentPriceChange).toFixed(1)}%
          </div>
        </div>

        {/* Predicted Price Card */}
        <div className="bg-[#0f1e33] rounded-lg p-4 border border-gray-700/50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-400">Predicted (Day 5)</span>
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
          </div>
          <div className="text-2xl font-bold text-white mb-1">
            ${predictedPrice.toFixed(2)}
          </div>
          <div className={`text-sm font-medium ${predictedPriceChange >= 0 ? 'text-green-400' : 'text-red-400'}`}>
            {predictedPriceChange >= 0 ? '↑' : '↓'} {Math.abs(predictedPriceChange).toFixed(1)}%
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
            {confidenceScore}%
          </div>
          <div className="text-sm font-medium text-green-400">
            {confidenceLevel}
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockChart;
