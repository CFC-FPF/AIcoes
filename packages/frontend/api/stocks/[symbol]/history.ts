import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../../lib/supabase.js';

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
    const limit = parseInt(req.query.limit as string) || 30;

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Symbol parameter is required',
      });
    }

    // Get stock_id first
    const { data: stock } = await supabase
      .from('stocks')
      .select('stock_id')
      .eq('symbol', symbol.toUpperCase())
      .single();

    if (!stock) {
      return res.status(404).json({
        success: false,
        error: 'Stock not found',
      });
    }

    // Get price history
    const { data, error } = await supabase
      .from('prices')
      .select('*')
      .eq('stock_id', stock.stock_id)
      .order('trade_date', { ascending: false })
      .limit(limit);

    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching history:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
