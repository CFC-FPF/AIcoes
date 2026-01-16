import Groq from "groq-sdk";

export async function analyzeSentiment(symbol: string, news: any[]) {
  const groq = new Groq({
    apiKey: process.env.GROQ_API_KEY,
  });

  const recentNews = news.slice(0, 10).map(n => ({
    headline: n.headline,
    summary: n.summary,
  }));

  const response = await groq.chat.completions.create({
    model: "llama-3.1-8b-instant",
    messages: [{
      role: "user",
      content: `Analyze these news articles for ${symbol} and return exactly 3 sentiment insights as JSON.

News:
${JSON.stringify(recentNews, null, 2)}

Return JSON in this exact format:
{
  "sentiments": [
    { "type": "bullish", "title": "SHORT TITLE", "description": "One sentence insight" },
    { "type": "neutral", "title": "SHORT TITLE", "description": "One sentence insight" },
    { "type": "ai-insight", "title": "AI INSIGHT", "description": "Technical or forward-looking observation" }
  ]
}

type must be one of: bullish, bearish, neutral, ai-insight
Only return valid JSON, nothing else.`
    }],
    temperature: 0.3,
    max_tokens: 500,
  });

  let text = response.choices[0]?.message?.content || "{}";

  // Remove markdown code blocks if present
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();

  // Extract just the JSON object (stop at closing brace + newline or end)
  const jsonMatch = text.match(/\{[\s\S]*?"sentiments"[\s\S]*?\]\s*\}/);
  if (jsonMatch) {
    text = jsonMatch[0];
  }

  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Groq response:", text);
    return { sentiments: [] };
  }
}
