import type { YahooQuote, YahooFinanceResponse } from 'shared';

/**
 * Fetches historical price data from Yahoo Finance
 */
export async function fetchYahooFinance(
  symbol: string,
  days: number = 60
): Promise<YahooQuote[]> {
  const period2 = Math.floor(Date.now() / 1000); // now
  const period1 = period2 - days * 24 * 60 * 60; // X days ago

  const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;

  try {
    console.log(`📡 Fetching ${symbol} from Yahoo Finance (${days} days)...`);

    const response = await fetch(url + `?period1=${period1}&period2=${period2}&interval=1d&events=history`);

    if (!response.ok) {
      throw new Error(`Yahoo Finance API error: ${response.status} ${response.statusText}`);
    }

    const data: YahooFinanceResponse = await response.json();
    const result = data.chart.result[0];

    if (!result) {
      throw new Error('No data returned from Yahoo Finance');
    }

    const timestamps = result.timestamp;
    const quotes = result.indicators.quote[0];

    const priceData: YahooQuote[] = timestamps.map(
      (timestamp: number, index: number) => ({
        date: timestamp,
        open: quotes.open[index],
        high: quotes.high[index],
        low: quotes.low[index],
        close: quotes.close[index],
        volume: quotes.volume[index],
      })
    );

    // Filter out null/undefined values (weekends, holidays, etc.)
    return priceData.filter((d) => d.open && d.high && d.low && d.close);
  } catch (error: any) {
    console.error(`❌ Error fetching ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Inserts or updates prices in Supabase
 */
export async function upsertPrices(
  supabase: any,
  stockId: number,
  quotes: YahooQuote[]
) {
  console.log(`📝 Upserting ${quotes.length} records to database...`);

  const records = quotes.map((quote) => ({
    stock_id: stockId,
    trade_date: new Date(quote.date * 1000).toISOString().split('T')[0],
    open_price: quote.open,
    high_price: quote.high,
    low_price: quote.low,
    close_price: quote.close,
    volume: quote.volume,
  }));

  const { error } = await supabase.from('prices').upsert(records, {
    onConflict: 'stock_id,trade_date',
    ignoreDuplicates: false,
  });

  if (error) {
    console.error(`❌ Database error:`, error.message);
    throw error;
  }

  console.log(`✅ Successfully upserted ${quotes.length} records`);
}
