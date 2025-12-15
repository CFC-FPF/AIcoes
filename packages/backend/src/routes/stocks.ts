import { Router } from "express";
import { supabase } from "../lib/supabase";
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

    const { data, error } = await supabase
      .from("v_latest_prices")
      .select("*")
      .eq("symbol", symbol.toUpperCase())
      .single();

    if (error) throw error;

    if (!data) {
      return res.status(404).json({
        success: false,
        error: "Stock not found",
      });
    }

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
