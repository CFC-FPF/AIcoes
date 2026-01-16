import yahooFinance from "yahoo-finance2";
import { supabase } from "./supabase";
import type { YahooQuote } from "shared";

/**
 * Verifica se é necessário atualizar dados de preços
 * Retorna true se:
 * - Não há dados na BD
 * - Último trade_date < hoje
 * - Já passou do horário de fecho da bolsa (~22h UTC)
 */
export async function needsPriceUpdate(stockId: number): Promise<boolean> {
  // Busca o último trade_date disponível
  const { data, error } = await supabase
    .from("prices")
    .select("trade_date")
    .eq("stock_id", stockId)
    .order("trade_date", { ascending: false })
    .limit(1)
    .single();

  // Se não há dados, precisa atualizar
  if (error || !data) {
    return true;
  }

  const lastTradeDate = new Date(data.trade_date + "T00:00:00Z");
  const now = new Date();

  // Calcula dias de diferença
  const daysDiff = Math.floor(
    (now.getTime() - lastTradeDate.getTime()) / (1000 * 60 * 60 * 24)
  );

  // Se último trade é de hoje ou ontem após 22h UTC (18h EST), não precisa atualizar
  const currentHour = now.getUTCHours();

  if (daysDiff === 0) {
    // Último trade é de hoje, não precisa atualizar
    return false;
  }

  if (daysDiff === 1 && currentHour < 22) {
    // Último trade foi ontem mas ainda não passou das 22h UTC
    // A bolsa pode ainda não ter fechado ou dados não estarem disponíveis
    return false;
  }

  // Se passou mais de 1 dia, ou já é após 22h UTC, precisa atualizar
  return true;
}

/**
 * Busca dados históricos do Yahoo Finance para um período específico
 * Uses historical() API for better reliability
 */
async function fetchYahooFinanceRange(
  symbol: string,
  startDate: Date,
  endDate: Date
): Promise<YahooQuote[]> {
  try {
    const result = await yahooFinance.historical(symbol, {
      period1: startDate,
      period2: endDate,
      interval: "1d",
    });

    if (!result || result.length === 0) {
      return [];
    }

    // Converte formato do yahoo-finance2 para nosso formato
    const quotes: YahooQuote[] = result.map((item: any) => ({
      date: Math.floor(new Date(item.date).getTime() / 1000),
      open: item.open,
      high: item.high,
      low: item.low,
      close: item.close,
      volume: item.volume,
    }));

    // Filter out null/undefined values
    return quotes.filter((d) => d.open && d.high && d.low && d.close);
  } catch (error: any) {
    console.error(`Error fetching ${symbol} from Yahoo Finance:`, error.message || error);
    return [];
  }
}

/**
 * Insere preços na base de dados (upsert)
 */
async function upsertPrices(
  stockId: number,
  quotes: YahooQuote[]
): Promise<void> {
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
 * Atualiza dados de preços para uma stock se necessário
 * Busca apenas os dias em falta desde o último trade_date
 */
export async function updatePricesIfNeeded(
  stockId: number,
  symbol: string
): Promise<void> {
  // Verifica se precisa atualizar
  const needsUpdate = await needsPriceUpdate(stockId);

  if (!needsUpdate) {
    console.log(`📊 [${symbol}] Data is up-to-date, skipping fetch`);
    return;
  }

  console.log(`🔄 [${symbol}] Updating price data...`);

  // Busca o último trade_date
  const { data: lastPriceData } = await supabase
    .from("prices")
    .select("trade_date")
    .eq("stock_id", stockId)
    .order("trade_date", { ascending: false })
    .limit(1)
    .single();

  // Define período para buscar
  let startDate: Date;
  if (lastPriceData) {
    // Busca desde o dia seguinte ao último registro
    startDate = new Date(lastPriceData.trade_date + "T00:00:00Z");
    startDate.setDate(startDate.getDate() + 1);
  } else {
    // Se não há dados, busca últimos 90 dias
    startDate = new Date();
    startDate.setDate(startDate.getDate() - 90);
  }

  const endDate = new Date(); // Até hoje

  // Busca dados da Yahoo Finance
  const quotes = await fetchYahooFinanceRange(symbol, startDate, endDate);

  if (quotes.length === 0) {
    console.log(`📊 [${symbol}] No new data available from Yahoo Finance`);
    return;
  }

  // Insere na base de dados
  await upsertPrices(stockId, quotes);

  const oldestDate = new Date(quotes[0].date * 1000)
    .toISOString()
    .split("T")[0];
  const newestDate = new Date(quotes[quotes.length - 1].date * 1000)
    .toISOString()
    .split("T")[0];

  console.log(
    `✅ [${symbol}] Updated ${quotes.length} days (${oldestDate} to ${newestDate})`
  );
}
