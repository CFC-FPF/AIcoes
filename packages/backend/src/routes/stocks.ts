import { Router } from "express";
import { supabase } from "../lib/supabase";
import { updatePricesIfNeeded } from "../lib/priceUpdater";
import type { Stock, Price, ApiResponse } from 'shared';

const router = Router();

// GET /api/stocks - List all stocks
router.get("/", async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("stocks")
      .select("*")
      .order("symbol");

    if (error) throw error;

    const response: ApiResponse<Stock[]> = { success: true, data };
    res.json(response);
  } catch (error: any) {
    const response: ApiResponse<Stock[]> = {
      success: false,
      error: error.message,
    };
    res.status(500).json(response);
  }
});

// GET /api/stocks/:symbol - Get stock with latest price
router.get("/:symbol", async (req, res) => {
  try {
    const { symbol } = req.params;

    // Get stock with latest price from view
    const { data: priceData, error: priceError } = await supabase
      .from("v_latest_prices")
      .select("*")
      .eq("symbol", symbol.toUpperCase())
      .single();

    if (priceError) throw priceError;

    if (!priceData) {
      return res.status(404).json({
        success: false,
        error: "Stock not found",
      });
    }

    // Get additional company info from stocks table
    const { data: companyData, error: companyError } = await supabase
      .from("stocks")
      .select("ceo_name, website_url, description")
      .eq("symbol", symbol.toUpperCase())
      .single();

    if (companyError) {
      console.warn("Error fetching company info:", companyError.message);
    }

    // Merge the data
    const data = {
      ...priceData,
      ceo_name: companyData?.ceo_name || null,
      website_url: companyData?.website_url || null,
      description: companyData?.description || null,
    };

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching stock:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/stocks/:symbol/history?limit=30
router.get("/:symbol/history", async (req, res) => {
  try {
    const { symbol } = req.params;
    const limit = parseInt(req.query.limit as string) || 30;

    // Get stock_id first
    const { data: stock } = await supabase
      .from("stocks")
      .select("stock_id")
      .eq("symbol", symbol.toUpperCase())
      .single();

    if (!stock) {
      return res.status(404).json({
        success: false,
        error: "Stock not found",
      });
    }

    // Auto-update: Verifica e atualiza dados se necessário
    try {
      console.log(`📡 [${symbol.toUpperCase()}] Checking if price update needed...`);
      await updatePricesIfNeeded(stock.stock_id, symbol.toUpperCase());
    } catch (updateError: any) {
      // Log mas não falha o request - retorna dados que existem
      console.error(`❌ Failed to update prices for ${symbol}:`, updateError.message);
      console.error(updateError.stack);
    }

    // Get price history
    const { data, error } = await supabase
      .from("prices")
      .select("*")
      .eq("stock_id", stock.stock_id)
      .order("trade_date", { ascending: false })
      .limit(limit);

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching history:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

// GET /api/stocks/:symbol/predictions
router.get("/:symbol/predictions", async (req, res) => {
  try {
    const { symbol } = req.params;

    const { data, error } = await supabase
      .from("v_active_predictions")
      .select("*")
      .eq("symbol", symbol.toUpperCase())
      .order("target_date");

    if (error) throw error;

    res.json({ success: true, data });
  } catch (error: any) {
    console.error("Error fetching predictions:", error);
    res.status(500).json({
      success: false,
      error: error.message,
    });
  }
});

export default router;
