// Database models
export interface Stock {
  stock_id: number;
  symbol: string;
  name: string;
  exchange: string;
  sector: string | null;
  industry: string | null;
  ceo_name: string | null;
  website_url: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
}

export interface Price {
  price_id: number;
  stock_id: number;
  trade_date: string;
  close_price: number;
  open_price: number | null;
  high_price: number | null;
  low_price: number | null;
  volume: number | null;
  created_at: string;
}

export interface Prediction {
  prediction_id: number;
  stock_id: number;
  prediction_date: string;
  target_date: string;
  predicted_close_price: number;
  confidence_score: number | null;
  model_version: string;
  actual_close_price: number | null;
  prediction_error: number | null;
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

// API Response wrapper
export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// Helper types para queries comuns
export interface StockWithLatestPrice extends Stock {
  latest_price?: number;
  latest_trade_date?: string;
}

// Yahoo Finance API types
export interface YahooQuote {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface YahooFinanceResponse {
  chart: {
    result: Array<{
      timestamp: number[];
      indicators: {
        quote: Array<{
          open: number[];
          high: number[];
          low: number[];
          close: number[];
          volume: number[];
        }>;
      };
    }>;
  };
}

// Yahoo Finance Asset Profile types
export interface YahooCompanyOfficer {
  maxAge?: number;
  name: string;
  age?: number;
  title: string;
  yearBorn?: number;
  fiscalYear?: number;
  totalPay?: number;
  exercisedValue?: number;
  unexercisedValue?: number;
}

export interface YahooAssetProfile {
  address1?: string;
  city?: string;
  state?: string;
  zip?: string;
  country?: string;
  phone?: string;
  website?: string;
  industry?: string;
  sector?: string;
  longBusinessSummary?: string;
  fullTimeEmployees?: number;
  companyOfficers?: YahooCompanyOfficer[];
  auditRisk?: number;
  boardRisk?: number;
  compensationRisk?: number;
  shareHolderRightsRisk?: number;
  overallRisk?: number;
  governanceEpochDate?: number;
  compensationAsOfEpochDate?: number;
}

export interface YahooQuoteSummaryResponse {
  quoteSummary: {
    result: Array<{
      assetProfile?: YahooAssetProfile;
    }>;
    error: any;
  };
}