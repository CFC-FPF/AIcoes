import { supabase } from './supabase';
import { fetchYahooFinance, upsertPrices } from './yahooFinance';

const ONE_HOUR = 60 * 60 * 1000;

/**
 * Checks if prices need refreshing and updates if stale
 */
export async function ensureFreshPrices(symbol: string, stockId: number): Promise<void> {
  try {
    // Check latest price date in database
    const { data: latestPrice } = await supabase
      .from('prices')
      .select('trade_date')
      .eq('stock_id', stockId)
      .order('trade_date', { ascending: false })
      .limit(1)
      .single();

    // Determine if data is stale
    const now = new Date();
    const lastUpdate = latestPrice ? new Date(latestPrice.trade_date) : null;

    if (!lastUpdate) {
      console.log(`📦 No price data found for ${symbol}, fetching initial data...`);
      // Fetch more days for initial population
      const quotes = await fetchYahooFinance(symbol, 365);
      await upsertPrices(supabase, stockId, quotes);
      return;
    }

    // Calculate staleness
    const staleness = now.getTime() - lastUpdate.getTime();

    // If data is older than 1 hour, refresh
    if (staleness > ONE_HOUR) {
      console.log(`🔄 Data is stale (${Math.round(staleness / ONE_HOUR)}h old), refreshing...`);
      // Only fetch recent days to save time
      const quotes = await fetchYahooFinance(symbol, 7);
      await upsertPrices(supabase, stockId, quotes);
    } else {
      console.log(`✅ Price data is fresh (${Math.round(staleness / 60000)}min old)`);
    }
  } catch (error) {
    console.error(`⚠️ Error ensuring fresh prices for ${symbol}:`, error);
    // Don't throw - continue with whatever data we have
  }
}
