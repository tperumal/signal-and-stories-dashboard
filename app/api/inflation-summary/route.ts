import { NextRequest, NextResponse } from "next/server";
import { fetchIndicatorSummaries } from "@/lib/fred-client";
import { callClaude } from "@/lib/claude-client";
import { verifyAuth } from "@/lib/verify-auth";

const INFLATION_INDICATORS = [
  { id: "CPIAUCSL", name: "CPI Inflation Rate", apiUnits: "pc1" },
  { id: "PCEPILFE", name: "Core PCE Inflation", apiUnits: "pc1" },
  { id: "PPIFIS", name: "Producer Price Index", apiUnits: "pc1" },
  { id: "T10YIE", name: "10-Yr Breakeven Inflation" },
  { id: "GASREGW", name: "Regular Gas Price" },
  { id: "CPIUFDSL", name: "Food CPI", apiUnits: "pc1" },
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
    const newsUrl = `https://newsapi.org/v2/everything?q="inflation" OR "CPI" OR "consumer prices" OR "price index" OR "Federal Reserve rates"&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();

    if (newsData.status !== "ok") {
      throw new Error(newsData.message || "News API error");
    }

    const relevantArticles = newsData.articles.filter((a: { title: string }) => {
      const title = a.title.toLowerCase();
      return (
        title.includes("inflation") ||
        title.includes("cpi") ||
        title.includes("price") ||
        title.includes("fed") ||
        title.includes("interest rate") ||
        title.includes("pce") ||
        title.includes("gas")
      );
    });

    const headlines = relevantArticles.slice(0, 6).map((a: { title: string; source: { name: string }; url: string; publishedAt: string }) => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));

    const indicatorData = await fetchIndicatorSummaries(
      INFLATION_INDICATORS,
      FRED_API_KEY,
      "2024-01-01"
    );

    const cpi = parseFloat(indicatorData.CPIAUCSL?.latest || "0");
    const corePce = parseFloat(indicatorData.PCEPILFE?.latest || "0");
    const ppi = parseFloat(indicatorData.PPIFIS?.latest || "0");
    const breakeven = parseFloat(indicatorData.T10YIE?.latest || "0");
    const gasPrice = parseFloat(indicatorData.GASREGW?.latest || "0");
    const foodCpi = parseFloat(indicatorData.CPIUFDSL?.latest || "0");

    const prompt = `You are a sharp inflation analyst who cuts through noise. Write a 2-3 sentence market summary using the specific numbers below.

DATA:
- CPI Inflation Rate (YoY): ${cpi.toFixed(1)}%
- Core PCE Inflation (YoY): ${corePce.toFixed(1)}%
- Producer Price Index (YoY): ${ppi.toFixed(1)}%
- 10-Yr Breakeven Inflation: ${breakeven.toFixed(2)}%
- Regular Gas Price: $${gasPrice.toFixed(2)}/gallon
- Food CPI (YoY): ${foodCpi.toFixed(1)}%

CONTEXT:
- The Fed targets 2% core PCE inflation
- Pre-pandemic CPI averaged about 1.8%
- Gas prices above $4/gallon historically weigh on consumer sentiment
- Food inflation above 3% is considered elevated

HEADLINES:
${headlines.length > 0 ? headlines.map((h: { title: string }) => `- ${h.title}`).join("\n") : "- None available"}

Write a punchy summary that:
1. Uses specific numbers (e.g., "CPI at 3.2%" not "elevated inflation")
2. Compares to the Fed's 2% target and historical norms
3. States the bottom line for consumers and the Fed's likely stance

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
