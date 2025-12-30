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

  // Prepare prediction data
  const predictionDates = predictions.map(p =>
    new Date(p.target_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
  );
  const predictionPricesData = predictions.map(p => p.predicted_close_price);

  // Combine dates for x-axis
  const allDates = [...historicalDates, ...predictionDates];

  // Prepare datasets
  const data = {
    labels: allDates,
    datasets: [
      {
        label: 'Historical Price',
        data: [...historicalPricesData, ...Array(predictions.length).fill(null)],
        borderColor: 'rgb(59, 130, 246)', // blue
        backgroundColor: 'rgba(59, 130, 246, 0.1)',
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
      {
        label: 'Predicted Price',
        data: [...Array(historicalPrices.length).fill(null), ...predictionPricesData],
        borderColor: 'rgb(168, 85, 247)', // purple
        backgroundColor: 'rgba(168, 85, 247, 0.1)',
        borderDash: [5, 5],
        fill: true,
        tension: 0.4,
        pointRadius: 3,
        pointHoverRadius: 5,
      },
    ],
  };

  const options: ChartOptions<'line'> = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: '#e5e7eb', // gray-200
          font: {
            size: 12,
          },
        },
      },
      title: {
        display: true,
        text: `${symbol} - Price History & Predictions`,
        color: '#ffffff',
        font: {
          size: 16,
          weight: 'bold',
        },
      },
      tooltip: {
        mode: 'index',
        intersect: false,
        backgroundColor: 'rgba(17, 24, 39, 0.9)', // dark background
        titleColor: '#ffffff',
        bodyColor: '#e5e7eb',
        borderColor: '#6b7280',
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        grid: {
          color: 'rgba(75, 85, 99, 0.2)', // gray-600 with opacity
        },
        ticks: {
          color: '#9ca3af', // gray-400
        },
      },
      y: {
        beginAtZero: false,
        grid: {
          color: 'rgba(75, 85, 99, 0.2)',
        },
        ticks: {
          color: '#9ca3af',
          callback: function(value) {
            return '$' + Number(value).toFixed(2);
          },
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
    <div className="w-full h-full">
      <Line data={data} options={options} />
    </div>
  );
};

export default StockChart;
