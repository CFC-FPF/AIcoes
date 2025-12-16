import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase';
import { ensureFreshPrices } from '../lib/priceCache';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { symbol } = req.query;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Symbol parameter is required',
      });
    }

    // First, get stock info
    const { data: stock, error: stockError } = await supabase
      .from('stocks')
      .select('stock_id')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (stockError || !stock) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found',
      });
    }

    // Ensure we have fresh price data (smart caching)
    await ensureFreshPrices(symbol.toUpperCase(), stock.stock_id);

    // Get stock with latest price from view
    const { data, error } = await supabase
      .from('v_latest_prices')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found',
      });
    }

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching stock:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
