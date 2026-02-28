import { NextRequest, NextResponse } from "next/server";
import { fetchIndicatorSummaries } from "@/lib/fred-client";
import { callClaude } from "@/lib/claude-client";
import { verifyAuth } from "@/lib/verify-auth";

const HOUSING_INDICATORS = [
  { id: "MSPUS", name: "Median Home Price" },
  { id: "EXHOSLUSM495S", name: "Existing Home Sales" },
  { id: "MORTGAGE30US", name: "30-Year Mortgage Rate" },
  { id: "MSACSR", name: "Housing Inventory" },
  { id: "HSN1F", name: "New Home Sales" },
  { id: "HOUST", name: "Housing Starts" },
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
    // Fetch housing news
    const newsUrl = `https://newsapi.org/v2/everything?q="housing market" OR "home prices" OR "mortgage rates" OR "home sales" OR "real estate market"&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();

    if (newsData.status !== "ok") {
      throw new Error(newsData.message || "News API error");
    }

    const relevantArticles = newsData.articles.filter((a: { title: string }) => {
      const title = a.title.toLowerCase();
      return (
        title.includes("home") ||
        title.includes("hous") ||
        title.includes("mortgage") ||
        title.includes("real estate") ||
        title.includes("property") ||
        title.includes("rent")
      );
    });

    const headlines = relevantArticles.slice(0, 6).map((a: { title: string; source: { name: string }; url: string; publishedAt: string }) => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));

    // Fetch FRED data
    const indicatorData = await fetchIndicatorSummaries(
      HOUSING_INDICATORS,
      FRED_API_KEY,
      "2024-01-01"
    );

    // Format data for prompt
    const medianPrice = parseInt(indicatorData.MSPUS?.latest || "0");
    const existingSales =
      parseInt(indicatorData.EXHOSLUSM495S?.latest || "0") / 1000000;
    const mortgageRate = parseFloat(
      indicatorData.MORTGAGE30US?.latest || "0"
    );
    const inventory = parseFloat(indicatorData.MSACSR?.latest || "0");
    const newSales = parseInt(indicatorData.HSN1F?.latest || "0");
    const housingStarts = parseInt(indicatorData.HOUST?.latest || "0");

    const prompt = `You are a sharp housing market analyst who cuts through noise. Write a 2-3 sentence market summary using the specific numbers below.

DATA:
- Median Home Price: $${medianPrice.toLocaleString()}
- Existing Home Sales: ${existingSales.toFixed(2)} million/year
- 30-Year Mortgage Rate: ${mortgageRate.toFixed(2)}%
- Housing Inventory: ${inventory.toFixed(1)} months supply
- New Home Sales: ${newSales}K/year
- Housing Starts: ${housingStarts}K/year

CONTEXT:
- Under 4 months inventory = seller's market, over 6 = buyer's market
- Historical average mortgage rate is ~7%
- Pre-pandemic existing sales were ~5.5 million/year

HEADLINES:
${headlines.length > 0 ? headlines.map((h: { title: string }) => `- ${h.title}`).join("\n") : "- None available"}

Write a punchy summary that:
1. Uses specific numbers (e.g., "$419K median price" not "high prices")
2. Compares to historical norms (e.g., "rates at 6.1% are below the 7% average")
3. States the bottom line for buyers/sellers in plain terms

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
