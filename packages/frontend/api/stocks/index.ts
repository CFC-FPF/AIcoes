import type { VercelRequest, VercelResponse } from '@vercel/node';
import { supabase } from '../lib/supabase.js';
import type { Stock, ApiResponse } from '../../../shared/src/index.js';

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  // Only allow GET requests
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { data, error } = await supabase
      .from('stocks')
      .select('*')
      .order('symbol');

    if (error) throw error;

    const response: ApiResponse<Stock[]> = { success: true, data };
    return res.json(response);
  } catch (error: any) {
    console.error('Error fetching stocks:', error);
    const response: ApiResponse<Stock[]> = {
      success: false,
      error: error.message,
    };
    return res.status(500).json(response);
  }
}
