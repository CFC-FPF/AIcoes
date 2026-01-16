const FINNHUB_BASE_URL = "https://finnhub.io/api/v1";

export async function getCompanyNews(symbol: string): Promise<any[]> {
  const apiKey = process.env.FINNHUB_API_KEY;
  
  // Get news from last 7 days
  const to = new Date().toISOString().split("T")[0];
  const from = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  
  const url = `${FINNHUB_BASE_URL}/company-news?symbol=${symbol}&from=${from}&to=${to}&token=${apiKey}`;
  
  const response = await fetch(url);
  return response.json();
}
