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

    if (!symbol || typeof symbol !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Symbol parameter is required',
      });
    }

    const { data, error } = await supabase
      .from('v_active_predictions')
      .select('*')
      .eq('symbol', symbol.toUpperCase())
      .order('target_date');

    if (error) throw error;

    return res.json({ success: true, data });
  } catch (error: any) {
    console.error('Error fetching predictions:', error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
