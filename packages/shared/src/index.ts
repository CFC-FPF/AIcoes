export interface Stock {
  id: string;
  symbol: string;
  name: string;
}

export interface HistoricalPrice {
  id: string;
  stockId: string;
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface Prediction {
  id: string;
  stockId: string;
  date: string;
  predictedPrice: number;
  confidence: number;
  createdAt: string;
}