import Anthropic from "@anthropic-ai/sdk";

const anthropic = new Anthropic();

export async function analyzeSentiment(symbol: string, news: any[]) {
  // Take top 10 most recent news
  const recentNews = news.slice(0, 10).map(n => ({
    headline: n.headline,
    summary: n.summary,
  }));

  const response = await anthropic.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 500,
    messages: [{
      role: "user",
      content: `Analyze these news articles for ${symbol} and return exactly 3 sentiment insights as JSON.

News:
${JSON.stringify(recentNews, null, 2)}

Return JSON in this exact format:
{
  "sentiments": [
    { "type": "bullish" | "bearish" | "neutral", "title": "SHORT TITLE", "description": "One sentence insight" },
    { "type": "ai-insight", "title": "AI INSIGHT", "description": "Technical or forward-looking observation" }
  ]
}

Only return valid JSON, nothing else.`
    }]
  });

  const text = response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
