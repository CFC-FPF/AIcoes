// PRIMEIRO: carrega as variáveis de ambiente
import "./loadEnv";

// AGORA sim, os outros imports
import yahooFinance from "yahoo-finance2";
import { supabase } from "../lib/supabase";
import type { Stock, YahooCompanyOfficer } from "shared";

/**
 * Busca informações da empresa do Yahoo Finance (assetProfile)
 */
async function fetchYahooAssetProfile(symbol: string): Promise<any | null> {
  try {
    console.log(`  📡 Fetching asset profile from Yahoo Finance...`);

    const result: any = await yahooFinance.quoteSummary(symbol, {
      modules: ["assetProfile"],
    });

    if (!result || !result.assetProfile) {
      console.log(`  ⚠️  No asset profile data available for ${symbol}`);
      return null;
    }

    return result.assetProfile;
  } catch (error: any) {
    console.error(`  ❌ Error fetching ${symbol}:`, error.message);
    return null;
  }
}

/**
 * Extrai o nome do CEO da lista de company officers
 */
function extractCEOName(officers?: YahooCompanyOfficer[]): string | null {
  if (!officers || officers.length === 0) {
    return null;
  }

  // Procura por títulos que contenham "CEO"
  const ceo = officers.find((officer) =>
    officer.title.toUpperCase().includes("CEO")
  );

  return ceo ? ceo.name : null;
}

/**
 * Atualiza informações da empresa na base de dados
 */
async function updateStockInfo(stockId: number, symbol: string, profile: any) {
  console.log(`  📝 Updating database with company info...`);

  const ceoName = extractCEOName(profile.companyOfficers);

  const updates: Partial<Stock> = {
    website_url: profile.website || null,
    description: profile.longBusinessSummary || null,
    ceo_name: ceoName,
    industry: profile.industry || null,
    sector: profile.sector || null,
  };

  const { error } = await supabase
    .from("stocks")
    .update(updates)
    .eq("stock_id", stockId);

  if (error) {
    console.error(`  ❌ Database error for ${symbol}:`, error.message);
    throw error;
  }

  console.log(`  ✅ Successfully updated company info`);
  console.log(`     CEO: ${ceoName || "N/A"}`);
  console.log(`     Website: ${profile.website || "N/A"}`);
  console.log(
    `     Description: ${profile.longBusinessSummary ? profile.longBusinessSummary.substring(0, 80) + "..." : "N/A"}`
  );
  console.log(`     Industry: ${profile.industry || "N/A"}`);
  console.log(`     Sector: ${profile.sector || "N/A"}`);
}

/**
 * Popula informações da empresa para uma stock
 */
async function populateCompanyInfo(symbol: string): Promise<void> {
  console.log(`\n${"=".repeat(50)}`);
  console.log(`🔍 Processing: ${symbol}`);
  console.log("=".repeat(50));

  try {
    // 1. Get stock from database
    const { data: stock, error: stockError } = await supabase
      .from("stocks")
      .select("stock_id, name, exchange, ceo_name, website_url, description")
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
    console.log(`  📦 Current data in DB:`);
    console.log(`     CEO: ${stock.ceo_name || "Not set"}`);
    console.log(`     Website: ${stock.website_url || "Not set"}`);
    console.log(
      `     Description: ${stock.description ? stock.description.substring(0, 50) + "..." : "Not set"}`
    );

    // 3. Fetch company info from Yahoo Finance
    const profile = await fetchYahooAssetProfile(symbol);

    if (!profile) {
      console.log(`  ⚠️  No profile data available. Skipping update.`);
      return;
    }

    // 4. Update database
    await updateStockInfo(stock.stock_id, symbol, profile);

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
  console.log("\n🚀 COMPANY INFO FETCH SCRIPT");
  console.log("============================\n");

  // Get stocks to process from command line args or use defaults
  const args = process.argv.slice(2);
  const stocks = args.length > 0 ? args : ["AAPL", "MSFT", "GOOGL"];

  console.log(`📋 Stocks to process: ${stocks.join(", ")}\n`);

  let successCount = 0;
  let failCount = 0;

  for (const symbol of stocks) {
    try {
      await populateCompanyInfo(symbol.toUpperCase());
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
export { populateCompanyInfo, fetchYahooAssetProfile, extractCEOName };
