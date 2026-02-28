import { NextRequest, NextResponse } from "next/server";
import { fetchIndicatorSummaries } from "@/lib/fred-client";
import { callClaude } from "@/lib/claude-client";
import { verifyAuth } from "@/lib/verify-auth";

const GDP_INDICATORS = [
  { id: "A191RL1Q225SBEA", name: "Real GDP Growth" },
  { id: "INDPRO", name: "Industrial Production", apiUnits: "pc1" },
  { id: "DGORDER", name: "Durable Goods Orders" },
  { id: "NAPM", name: "ISM Manufacturing PMI" },
  { id: "PERMIT", name: "Building Permits" },
  { id: "T10Y2Y", name: "Yield Curve Spread" },
];

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const NEWS_API_KEY = process.env.NEWS_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
  const FRED_API_KEY = process.env.FRED_API_KEY;

  if (!NEWS_API_KEY || !ANTHROPIC_API_KEY || !FRED_API_KEY) {
    return NextResponse.json(
      { error: "API keys not configured" },
      { status: 500 }
    );
  }

  try {
    const newsUrl = `https://newsapi.org/v2/everything?q="GDP" OR "economic growth" OR "recession" OR "manufacturing PMI" OR "industrial production"&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();

    if (newsData.status !== "ok") {
      throw new Error(newsData.message || "News API error");
    }

    const relevantArticles = newsData.articles.filter((a: { title: string }) => {
      const title = a.title.toLowerCase();
      return (
        title.includes("gdp") ||
        title.includes("econom") ||
        title.includes("recession") ||
        title.includes("growth") ||
        title.includes("manufactur") ||
        title.includes("industrial") ||
        title.includes("pmi")
      );
    });

    const headlines = relevantArticles.slice(0, 6).map((a: { title: string; source: { name: string }; url: string; publishedAt: string }) => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));

    const indicatorData = await fetchIndicatorSummaries(
      GDP_INDICATORS,
      FRED_API_KEY,
      "2024-01-01"
    );

    const gdpGrowth = parseFloat(indicatorData.A191RL1Q225SBEA?.latest || "0");
    const industrialProd = parseFloat(indicatorData.INDPRO?.latest || "0");
    const durableGoods = parseFloat(indicatorData.DGORDER?.latest || "0");
    const pmi = parseFloat(indicatorData.NAPM?.latest || "0");
    const permits = parseFloat(indicatorData.PERMIT?.latest || "0");
    const yieldSpread = parseFloat(indicatorData.T10Y2Y?.latest || "0");

    const prompt = `You are a sharp macroeconomic analyst who cuts through noise. Write a 2-3 sentence market summary using the specific numbers below.

DATA:
- Real GDP Growth (annualized): ${gdpGrowth.toFixed(1)}%
- Industrial Production (YoY): ${industrialProd.toFixed(1)}%
- Durable Goods Orders: $${(durableGoods / 1000).toFixed(1)}B
- ISM Manufacturing PMI: ${pmi.toFixed(1)}
- Building Permits: ${permits.toLocaleString()}K
- Yield Curve Spread (10Y-2Y): ${yieldSpread.toFixed(2)}%

CONTEXT:
- GDP growth of 2-3% is considered healthy
- PMI above 50 = expansion, below 50 = contraction
- An inverted yield curve (negative spread) has preceded every US recession since 1970
- Pre-pandemic building permits averaged about 1,300K

HEADLINES:
${headlines.length > 0 ? headlines.map((h: { title: string }) => `- ${h.title}`).join("\n") : "- None available"}

Write a punchy summary that:
1. Uses specific numbers (e.g., "GDP at 2.8%" not "solid growth")
2. Compares to historical norms (e.g., "PMI at 49.2 signals contraction")
3. States the bottom line for the economy's trajectory

No hedging, no "may" or "could" - be direct.`;

    const summary = await callClaude(prompt, ANTHROPIC_API_KEY);

    return NextResponse.json(
      {
        summary,
        headlines,
        generatedAt: new Date().toISOString(),
      },
      {
        headers: {
          "Cache-Control": "s-maxage=1800, stale-while-revalidate",
        },
      }
    );
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
