-- Add key metrics columns to stocks table
-- Run this in your Supabase SQL editor

ALTER TABLE stocks
ADD COLUMN IF NOT EXISTS market_cap BIGINT,
ADD COLUMN IF NOT EXISTS pe_ratio DECIMAL(10, 2),
ADD COLUMN IF NOT EXISTS volume BIGINT,
ADD COLUMN IF NOT EXISTS week_52_high DECIMAL(10, 2);

-- Add comments to document the columns
COMMENT ON COLUMN stocks.market_cap IS 'Market capitalization in USD';
COMMENT ON COLUMN stocks.pe_ratio IS 'Price-to-Earnings ratio (trailing twelve months)';
COMMENT ON COLUMN stocks.volume IS 'Average trading volume';
COMMENT ON COLUMN stocks.week_52_high IS '52-week high price in USD';
