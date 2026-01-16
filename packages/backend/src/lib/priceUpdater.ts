import { supabase } from "./supabase";

const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

interface Quote {
  date: number;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

/**
 * Verifica se é necessário atualizar dados de preços
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
 * Fetch historical candle data from Finnhub
 */
async function fetchFinnhubCandles(
  symbol: string,
  startDate: Date,
  endDate: Date
): Promise<Quote[]> {
  const apiKey = process.env.FINNHUB_API_KEY;

  const from = Math.floor(startDate.getTime() / 1000);
  const to = Math.floor(endDate.getTime() / 1000);

  const url = `${FINNHUB_BASE_URL}/stock/candle?symbol=${symbol}&resolution=D&from=${from}&to=${to}&token=${apiKey}`;

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.s === "no_data" || !data.c) {
      return [];
    }

    // Finnhub returns arrays: c (close), h (high), l (low), o (open), t (timestamp), v (volume)
    const quotes: Quote[] = data.t.map((timestamp: number, i: number) => ({
      date: timestamp,
      open: data.o[i],
      high: data.h[i],
      low: data.l[i],
      close: data.c[i],
      volume: data.v[i],
    }));

    return quotes.filter((q) => q.open && q.high && q.low && q.close);
  } catch (error: any) {
    console.error(`Error fetching ${symbol} from Finnhub:`, error.message || error);
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

  console.log(`🔄 [${symbol}] Updating price data from Finnhub...`);

  const { data: lastPriceData } = await supabase
    .from("prices")
    .select("trade_date")
    .eq("stock_id", stockId)
    .order("trade_date", { ascending: false })
    .limit(1)
    .single();

  let startDate: Date;
  if (lastPriceData) {
    startDate = new Date(lastPriceData.trade_date + "T00:00:00Z");
    startDate.setDate(startDate.getDate() + 1);
  } else {
    // Finnhub free tier: last 1 year of data
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 365);
  }

  const endDate = new Date();

  const quotes = await fetchFinnhubCandles(symbol, startDate, endDate);

  if (quotes.length === 0) {
    console.log(`📊 [${symbol}] No new data available from Finnhub`);
    return;
  }

  await upsertPrices(stockId, quotes);

  const oldestDate = new Date(quotes[0].date * 1000).toISOString().split("T")[0];
  const newestDate = new Date(quotes[quotes.length - 1].date * 1000).toISOString().split("T")[0];

  console.log(`✅ [${symbol}] Updated ${quotes.length} days (${oldestDate} to ${newestDate})`);
}
