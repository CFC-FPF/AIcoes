import { Router } from "express";
import { getCompanyNews } from "../lib/finnhub";
import { analyzeSentiment } from "../lib/sentimentAnalyzer";

const router = Router();

router.get("/:symbol", async (req, res) => {
  try {
    const symbol = req.params.symbol.toUpperCase();
    
    const news = await getCompanyNews(symbol);
    
    if (news.length === 0) {
      return res.json({ sentiments: [] });
    }
    
    const analysis = await analyzeSentiment(symbol, news);
    res.json(analysis);
  } catch (error) {
    console.error("Sentiment error:", error);
    res.status(500).json({ error: "Failed to analyze sentiment" });
  }
});

export default router;
