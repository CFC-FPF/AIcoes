import YahooFinance from "yahoo-finance2";
import { supabase } from "./supabase";

// Initialize yahoo-finance2 v3 instance
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

interface KeyMetrics {
  marketCap?: number;
  trailingPE?: number;
  averageVolume?: number;
  fiftyTwoWeekHigh?: number;
}

/**
 * Check if key metrics need updating
 * Returns true if any key metric is null/missing or if updated_at is older than 24 hours
 */
async function needsKeyMetricsUpdate(stockId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("stocks")
    .select("market_cap, pe_ratio, volume, week_52_high, updated_at")
    .eq("stock_id", stockId)
    .single();

  if (error || !data) {
    return true;
  }

  // Check if any metric is missing
  if (
    data.market_cap === null ||
    data.pe_ratio === null ||
    data.week_52_high === null
  ) {
    return true;
  }

  // Check if data is older than 24 hours
  if (data.updated_at) {
    const updatedAt = new Date(data.updated_at);
    const now = new Date();
    const hoursDiff = (now.getTime() - updatedAt.getTime()) / (1000 * 60 * 60);

    if (hoursDiff > 24) {
      return true;
    }
  }

  return false;
}

/**
 * Fetch key metrics from Yahoo Finance
 */
async function fetchYahooKeyMetrics(symbol: string): Promise<KeyMetrics | null> {
  try {
    const result: any = await yahooFinance.quoteSummary(symbol, {
      modules: ["summaryDetail", "price"],
    });

    if (!result) {
      return null;
    }

    const summaryDetail = result.summaryDetail || {};
    const price = result.price || {};

    return {
      marketCap: price.marketCap || summaryDetail.marketCap,
      trailingPE: summaryDetail.trailingPE,
      averageVolume: summaryDetail.averageVolume,
      fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh,
    };
  } catch (error: any) {
    console.error(`  ❌ Error fetching key metrics for ${symbol}:`, error.message);
    return null;
  }
}

/**
 * Update key metrics in database
 */
async function updateKeyMetrics(
  stockId: number,
  metrics: KeyMetrics
): Promise<void> {
  const { error } = await supabase
    .from("stocks")
    .update({
      market_cap: metrics.marketCap || null,
      pe_ratio: metrics.trailingPE || null,
      volume: metrics.averageVolume || null,
      week_52_high: metrics.fiftyTwoWeekHigh || null,
      updated_at: new Date().toISOString(),
    })
    .eq("stock_id", stockId);

  if (error) {
    console.error(`  ❌ Database error updating key metrics:`, error.message);
    throw error;
  }
}

/**
 * Format number for logging
 */
function formatNumber(num: number | null | undefined): string {
  if (!num) return "N/A";

  if (num >= 1_000_000_000_000) {
    return `$${(num / 1_000_000_000_000).toFixed(2)}T`;
  } else if (num >= 1_000_000_000) {
    return `$${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  }
  return num.toFixed(2);
}

/**
 * Update key metrics if needed (called from API route)
 */
export async function updateKeyMetricsIfNeeded(
  stockId: number,
  symbol: string
): Promise<void> {
  const needsUpdate = await needsKeyMetricsUpdate(stockId);

  if (!needsUpdate) {
    console.log(`📊 [${symbol}] Key metrics are up-to-date, skipping fetch`);
    return;
  }

  console.log(`🔄 [${symbol}] Updating key metrics from Yahoo Finance...`);

  const metrics = await fetchYahooKeyMetrics(symbol);

  if (!metrics) {
    console.log(`📊 [${symbol}] No key metrics data available`);
    return;
  }

  await updateKeyMetrics(stockId, metrics);

  console.log(`✅ [${symbol}] Updated key metrics:`);
  console.log(`   Market Cap: ${formatNumber(metrics.marketCap)}`);
  console.log(`   P/E Ratio: ${metrics.trailingPE?.toFixed(2) || "N/A"}`);
  console.log(`   Avg Volume: ${formatNumber(metrics.averageVolume)}`);
  console.log(`   52W High: $${metrics.fiftyTwoWeekHigh?.toFixed(2) || "N/A"}`);
}
