"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.populateStockPrices = populateStockPrices;
exports.fetchYahooFinance = fetchYahooFinance;
// PRIMEIRO: carrega as variáveis de ambiente
require("./loadEnv");
// AGORA sim, os outros imports
const axios_1 = __importDefault(require("axios"));
const supabase_1 = require("../lib/supabase");
/**
 * Busca dados históricos do Yahoo Finance
 */
async function fetchYahooFinance(symbol, days = 60) {
    const period2 = Math.floor(Date.now() / 1000); // now
    const period1 = period2 - days * 24 * 60 * 60; // X days ago
    const url = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}`;
    try {
        console.log(`  📡 Fetching from Yahoo Finance...`);
        const response = await axios_1.default.get(url, {
            params: {
                period1,
                period2,
                interval: "1d",
                events: "history",
            },
        });
        const result = response.data.chart.result[0];
        if (!result) {
            throw new Error("No data returned from Yahoo Finance");
        }
        const timestamps = result.timestamp;
        const quotes = result.indicators.quote[0];
        const data = timestamps.map((timestamp, index) => ({
            date: timestamp,
            open: quotes.open[index],
            high: quotes.high[index],
            low: quotes.low[index],
            close: quotes.close[index],
            volume: quotes.volume[index],
        }));
        // Filter out null/undefined values (weekends, holidays, etc.)
        return data.filter((d) => d.open && d.high && d.low && d.close);
    }
    catch (error) {
        if (error.response) {
            console.error(`  ❌ Yahoo Finance API error: ${error.response.status} ${error.response.statusText}`);
        }
        else {
            console.error(`  ❌ Error fetching ${symbol}:`, error.message);
        }
        throw error;
    }
}
/**
 * Insere preços na base de dados
 */
async function insertPrices(stockId, symbol, quotes) {
    console.log(`  📝 Preparing ${quotes.length} records for database...`);
    const records = quotes.map((quote) => ({
        stock_id: stockId,
        trade_date: new Date(quote.date * 1000).toISOString().split("T")[0],
        open_price: quote.open,
        high_price: quote.high,
        low_price: quote.low,
        close_price: quote.close,
        volume: quote.volume,
    }));
    // Upsert (insert or update on conflict)
    // Se o registo já existir (mesma stock_id + trade_date), atualiza
    const { error } = await supabase_1.supabase.from("prices").upsert(records, {
        onConflict: "stock_id,trade_date",
        ignoreDuplicates: false,
    });
    if (error) {
        console.error(`  ❌ Database error for ${symbol}:`, error.message);
        throw error;
    }
    console.log(`  ✅ Successfully inserted/updated ${quotes.length} records`);
}
/**
 * Popula dados históricos para uma stock
 */
async function populateStockPrices(symbol, days = 60) {
    console.log(`\n${"=".repeat(50)}`);
    console.log(`🔍 Processing: ${symbol}`);
    console.log("=".repeat(50));
    try {
        // 1. Get stock from database
        const { data: stock, error: stockError } = await supabase_1.supabase
            .from("stocks")
            .select("stock_id, name, exchange")
            .eq("symbol", symbol)
            .single();
        if (stockError || !stock) {
            console.error(`  ❌ Stock ${symbol} not found in database`);
            console.log(`  💡 Tip: Make sure the stock exists in the 'stocks' table first`);
            return;
        }
        console.log(`  📊 Found: ${stock.name}`);
        console.log(`  🏢 Exchange: ${stock.exchange}`);
        console.log(`  🆔 Stock ID: ${stock.stock_id}`);
        // 2. Check existing data
        const { count } = await supabase_1.supabase
            .from("prices")
            .select("*", { count: "exact", head: true })
            .eq("stock_id", stock.stock_id);
        console.log(`  📦 Existing records in DB: ${count || 0}`);
        // 3. Fetch historical data from Yahoo Finance
        const quotes = await fetchYahooFinance(symbol, days);
        console.log(`  📥 Fetched ${quotes.length} trading days from Yahoo Finance`);
        if (quotes.length === 0) {
            console.log(`  ⚠️  No data returned. Symbol might be incorrect or delisted.`);
            return;
        }
        // Show date range
        const oldestDate = new Date(quotes[0].date * 1000)
            .toISOString()
            .split("T")[0];
        const newestDate = new Date(quotes[quotes.length - 1].date * 1000)
            .toISOString()
            .split("T")[0];
        console.log(`  📅 Date range: ${oldestDate} to ${newestDate}`);
        // 4. Insert into database
        await insertPrices(stock.stock_id, symbol, quotes);
        // 5. Verify
        const { count: newCount } = await supabase_1.supabase
            .from("prices")
            .select("*", { count: "exact", head: true })
            .eq("stock_id", stock.stock_id);
        console.log(`  📊 Total records in DB now: ${newCount || 0}`);
        console.log(`  ✅ ${symbol} completed successfully!`);
    }
    catch (error) {
        console.error(`  💥 Failed to process ${symbol}:`, error.message);
        throw error;
    }
}
/**
 * Script principal
 */
async function main() {
    console.log("\n🚀 HISTORICAL PRICES FETCH SCRIPT");
    console.log("==================================\n");
    const stocks = ["AAPL", "MSFT", "GOOGL"];
    const days = 365; // Last year of data
    console.log(`📋 Stocks to process: ${stocks.join(", ")}`);
    console.log(`📅 Fetching last ${days} days of data\n`);
    let successCount = 0;
    let failCount = 0;
    for (const symbol of stocks) {
        try {
            await populateStockPrices(symbol, days);
            successCount++;
            // Be nice to Yahoo Finance API - wait 1 second between requests
            if (stocks.indexOf(symbol) < stocks.length - 1) {
                console.log("\n  ⏳ Waiting 1 second before next request...");
                await new Promise((resolve) => setTimeout(resolve, 1000));
            }
        }
        catch (error) {
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
