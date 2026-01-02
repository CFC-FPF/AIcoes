// Script para testar o sistema de auto-update
// Deleta os últimos 7 dias de dados de MSFT e testa se o auto-update funciona

import "./loadEnv";
import { supabase } from "../lib/supabase";

async function main() {
  console.log("\n🧪 TEST: Auto-update system");
  console.log("=".repeat(50));

  const symbol = "MSFT";
  const daysToDelete = 7;

  // 1. Get stock info
  const { data: stock } = await supabase
    .from("stocks")
    .select("stock_id")
    .eq("symbol", symbol)
    .single();

  if (!stock) {
    console.error(`❌ Stock ${symbol} not found`);
    return;
  }

  console.log(`\n📊 Stock: ${symbol} (ID: ${stock.stock_id})`);

  // 2. Check current data
  const { data: beforeData } = await supabase
    .from("prices")
    .select("trade_date")
    .eq("stock_id", stock.stock_id)
    .order("trade_date", { ascending: false })
    .limit(1)
    .single();

  console.log(`📅 Last trade date BEFORE delete: ${beforeData?.trade_date}`);

  // 3. Delete last N days
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysToDelete);
  const cutoffDateStr = cutoffDate.toISOString().split("T")[0];

  console.log(`\n🗑️  Deleting prices after ${cutoffDateStr}...`);

  const { error: deleteError, count } = await supabase
    .from("prices")
    .delete({ count: "exact" })
    .eq("stock_id", stock.stock_id)
    .gte("trade_date", cutoffDateStr);

  if (deleteError) {
    console.error("❌ Delete failed:", deleteError);
    return;
  }

  console.log(`✅ Deleted ${count} records`);

  // 4. Check data after delete
  const { data: afterDeleteData } = await supabase
    .from("prices")
    .select("trade_date")
    .eq("stock_id", stock.stock_id)
    .order("trade_date", { ascending: false })
    .limit(1)
    .single();

  console.log(`📅 Last trade date AFTER delete: ${afterDeleteData?.trade_date}`);

  console.log("\n🔄 Now make a request to:");
  console.log(`   http://localhost:3001/api/stocks/${symbol}/history?limit=5`);
  console.log("\n✨ The auto-update should fetch the missing days!");
  console.log("\nPress Ctrl+C when done testing.");
}

main().catch(console.error);
