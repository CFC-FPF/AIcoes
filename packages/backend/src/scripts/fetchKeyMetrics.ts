// PRIMEIRO: carrega as variáveis de ambiente
import "./loadEnv";

// AGORA sim, os outros imports
import YahooFinance from "yahoo-finance2";
import { supabase } from "../lib/supabase";
import type { Stock } from "shared";

// Initialize yahoo-finance2 v3 instance
const yahooFinance = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

/**
 * Interface para os dados que vamos buscar do Yahoo Finance
 */
interface YahooKeyMetrics {
  marketCap?: number;
  trailingPE?: number;
  averageVolume?: number;
  fiftyTwoWeekHigh?: number;
}

/**
 * Busca key metrics do Yahoo Finance (summaryDetail)
 */
async function fetchYahooKeyMetrics(
  symbol: string
): Promise<YahooKeyMetrics | null> {
  try {
    console.log(`  📡 Fetching key metrics from Yahoo Finance...`);

    const result: any = await yahooFinance.quoteSummary(symbol, {
      modules: ["summaryDetail", "price"],
    });

    if (!result) {
      console.log(`  ⚠️  No data available for ${symbol}`);
      return null;
    }

    const summaryDetail = result.summaryDetail || {};
    const price = result.price || {};

    const metrics: YahooKeyMetrics = {
      marketCap: price.marketCap || summaryDetail.marketCap,
      trailingPE: summaryDetail.trailingPE,
      averageVolume: summaryDetail.averageVolume,
      fiftyTwoWeekHigh: summaryDetail.fiftyTwoWeekHigh,
    };

    return metrics;
  } catch (error: any) {
    console.error(`  ❌ Error fetching ${symbol}:`, error.message);
    return null;
  }
}

/**
 * Formata números grandes para exibição (ex: 3.2T, 450.5B, 89.3M)
 */
function formatNumber(num: number | null | undefined): string {
  if (!num) return "N/A";

  if (num >= 1_000_000_000_000) {
    return `${(num / 1_000_000_000_000).toFixed(2)}T`;
  } else if (num >= 1_000_000_000) {
    return `${(num / 1_000_000_000).toFixed(2)}B`;
  } else if (num >= 1_000_000) {
    return `${(num / 1_000_000).toFixed(2)}M`;
  } else if (num >= 1_000) {
    return `${(num / 1_000).toFixed(2)}K`;
  }
  return num.toFixed(2);
}

/**
 * Atualiza key metrics na base de dados
 */
async function updateStockKeyMetrics(
  stockId: number,
  symbol: string,
  metrics: YahooKeyMetrics
) {
  console.log(`  📝 Updating database with key metrics...`);

  const updates: Partial<Stock> = {
    market_cap: metrics.marketCap || null,
    pe_ratio: metrics.trailingPE || null,
    volume: metrics.averageVolume || null,
    week_52_high: metrics.fiftyTwoWeekHigh || null,
  };

  const { error } = await supabase
    .from("stocks")
    .update(updates)
    .eq("stock_id", stockId);

  if (error) {
    console.error(`  ❌ Database error for ${symbol}:`, error.message);
    throw error;
  }

  console.log(`  ✅ Successfully updated key metrics`);
  console.log(`     Market Cap: $${formatNumber(metrics.marketCap)}`);
  console.log(`     P/E Ratio: ${metrics.trailingPE?.toFixed(2) || "N/A"}`);
  console.log(`     Avg Volume: ${formatNumber(metrics.averageVolume)}`);
  console.log(
    `     52W High: $${metrics.fiftyTwoWeekHigh?.toFixed(2) || "N/A"}`
  );
}

/**
 * Popula key metrics para uma stock
 */
async function populateKeyMetrics(symbol: string): Promise<void> {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🔍 Processing: ${symbol}`);
  console.log("=".repeat(50));

  try {
    // 1. Get stock from database
    const { data: stock, error: stockError } = await supabase
      .from("stocks")
      .select(
        "stock_id, name, exchange, market_cap, pe_ratio, volume, week_52_high"
      )
      .eq("symbol", symbol)
      .single();

    if (stockError || !stock) {
      console.error(`  ❌ Stock ${symbol} not found in database`);
      console.log(
        `  💡 Tip: Make sure the stock exists in the 'stocks' table first`
      );
      return;
    }

    console.log(`  📊 Found: ${stock.name}`);
    console.log(`  🏢 Exchange: ${stock.exchange}`);
    console.log(`  🆔 Stock ID: ${stock.stock_id}`);

    // 2. Check what data is already populated
    console.log(`  📦 Current key metrics in DB:`);
    console.log(
      `     Market Cap: ${stock.market_cap ? "$" + formatNumber(stock.market_cap) : "Not set"}`
    );
    console.log(
      `     P/E Ratio: ${stock.pe_ratio?.toFixed(2) || "Not set"}`
    );
    console.log(
      `     Avg Volume: ${stock.volume ? formatNumber(stock.volume) : "Not set"}`
    );
    console.log(
      `     52W High: ${stock.week_52_high ? "$" + stock.week_52_high.toFixed(2) : "Not set"}`
    );

    // 3. Fetch key metrics from Yahoo Finance
    const metrics = await fetchYahooKeyMetrics(symbol);

    if (!metrics) {
      console.log(`  ⚠️  No metrics data available. Skipping update.`);
      return;
    }

    // 4. Update database
    await updateStockKeyMetrics(stock.stock_id, symbol, metrics);

    console.log(`  ✅ ${symbol} completed successfully!`);
  } catch (error: any) {
    console.error(`  💥 Failed to process ${symbol}:`, error.message);
    throw error;
  }
}

/**
 * Script principal
 */
async function main() {
  console.log("\n🚀 KEY METRICS FETCH SCRIPT");
  console.log("============================\n");

  // Get stocks to process from command line args or use defaults
  const args = process.argv.slice(2);
  const stocks = args.length > 0 ? args : ["AAPL", "MSFT", "GOOGL"];

  console.log(`📋 Stocks to process: ${stocks.join(", ")}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const symbol of stocks) {
    try {
      await populateKeyMetrics(symbol.toUpperCase());
      successCount++;

      // Be nice to Yahoo Finance API - wait 1 second between requests
      if (stocks.indexOf(symbol) < stocks.length - 1) {
        console.log("\n  ⏳ Waiting 1 second before next request...");
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    } catch (error) {
      console.error(`\n  ❌ FAILED: ${symbol}`);
      failCount++;
    }
  }

  console.log("\n" + "=".repeat(50));
  console.log("📊 SUMMARY");
  console.log("=".repeat(50));
  console.log(`✅ Successful: ${successCount}/${stocks.length}`);
  console.log(`❌ Failed: ${failCount}/${stocks.length}`);
  console.log("\n✨ Script completed!\n");
}

// Run if called directly
if (require.main === module) {
  main()
    .then(() => {
      console.log("👋 Exiting...");
      process.exit(0);
    })
    .catch((error) => {
      console.error("\n💥 FATAL ERROR:", error);
      process.exit(1);
    });
}

// Export para poder usar noutros scripts
export { populateKeyMetrics, fetchYahooKeyMetrics };
