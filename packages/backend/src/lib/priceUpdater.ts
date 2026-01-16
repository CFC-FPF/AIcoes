import { supabase } from "./supabase";

const TWELVEDATA_BASE_URL = "https://api.twelvedata.com";

interface Quote {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Check if price update is needed
 */
export async function needsPriceUpdate(stockId: number): Promise<boolean> {
  const { data, error } = await supabase
    .from("prices")
    .select("trade_date")
    .eq("stock_id", stockId)
    .order("trade_date", { ascending: false })
    .limit(1)
    .single();

  if (error || !data) {
    return true;
  }

  const lastTradeDate = new Date(data.trade_date + "T00:00:00Z");
  const now = new Date();

  const daysDiff = Math.floor(
    (now.getTime() - lastTradeDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  const currentHour = now.getUTCHours();

  if (daysDiff === 0) {
    return false;
  }

  if (daysDiff === 1 && currentHour < 22) {
    return false;
  }

  return true;
}

/**
 * Fetch historical data from Twelve Data
 */
async function fetchTwelveDataPrices(
  symbol: string,
  outputSize: number = 30
): Promise<Quote[]> {
  const apiKey = process.env.TWELVEDATA_API_KEY;

  const url = `${TWELVEDATA_BASE_URL}/time_series?symbol=${symbol}&interval=1day&outputsize=${outputSize}&apikey=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.status === "error" || !data.values) {
      console.error(`Twelve Data error for ${symbol}:`, data.message || "No data");
      return [];
    }

    // Twelve Data returns newest first, we need to reverse for DB insert
    const quotes: Quote[] = data.values.map((item: any) => ({
      date: Math.floor(new Date(item.datetime).getTime() / 1000),
      open: parseFloat(item.open),
      high: parseFloat(item.high),
      low: parseFloat(item.low),
      close: parseFloat(item.close),
      volume: parseInt(item.volume, 10),
    }));

    return quotes.reverse(); // Oldest first
  } catch (error: any) {
    console.error(`Error fetching ${symbol} from Twelve Data:`, error.message || error);
    return [];
  }
}

/**
 * Upsert prices to database
 */
async function upsertPrices(stockId: number, quotes: Quote[]): Promise<void> {
  if (quotes.length === 0) {
    return;
  }

  const records = quotes.map((quote) => ({
    stock_id: stockId,
    trade_date: new Date(quote.date * 1000).toISOString().split("T")[0],
    open_price: quote.open,
    high_price: quote.high,
    low_price: quote.low,
    close_price: quote.close,
    volume: quote.volume,
  }));

  const { error } = await supabase.from("prices").upsert(records, {
    onConflict: "stock_id,trade_date",
    ignoreDuplicates: false,
  });

  if (error) {
    console.error(`Database error:`, error.message);
    throw error;
  }
}

/**
 * Update prices if needed
 */
export async function updatePricesIfNeeded(
  stockId: number,
  symbol: string
): Promise<void> {
  const needsUpdate = await needsPriceUpdate(stockId);

  if (!needsUpdate) {
    console.log(`📊 [${symbol}] Data is up-to-date, skipping fetch`);
    return;
  }

  console.log(`🔄 [${symbol}] Updating price data from Twelve Data...`);

  // Fetch last 30 days of data
  const quotes = await fetchTwelveDataPrices(symbol, 30);

  if (quotes.length === 0) {
    console.log(`📊 [${symbol}] No data available from Twelve Data`);
    return;
  }

  await upsertPrices(stockId, quotes);

  const oldestDate = new Date(quotes[0].date * 1000).toISOString().split("T")[0];
  const newestDate = new Date(quotes[quotes.length - 1].date * 1000).toISOString().split("T")[0];

  console.log(`✅ [${symbol}] Updated ${quotes.length} days (${oldestDate} to ${newestDate})`);
}
