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

const TICKERS = [
  { symbol: "ITB", name: "iShares Home Construction ETF" },
  { symbol: "VNQ", name: "Vanguard Real Estate ETF" },
  { symbol: "RKT", name: "Rocket Companies" },
];

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const FRED_API_KEY = process.env.FRED_API_KEY;
  const ALPHA_VANTAGE_API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

  if (!FRED_API_KEY || !ALPHA_VANTAGE_API_KEY || !ANTHROPIC_API_KEY) {
    return NextResponse.json(
      { error: "API keys not configured" },
      { status: 500 }
    );
  }

  try {
    // Fetch FRED data
    const indicatorData = await fetchIndicatorSummaries(
      HOUSING_INDICATORS,
      FRED_API_KEY,
      "2024-01-01"
    );

    // Fetch stock data with staggered requests
    const stockData: Record<
      string,
      { name: string; price: number; dailyChange: string; weeklyChange: string }
    > = {};

    for (let i = 0; i < TICKERS.length; i++) {
      const ticker = TICKERS[i];
      if (i > 0) await new Promise((r) => setTimeout(r, 1500));
      try {
        const params = new URLSearchParams({
          function: "TIME_SERIES_DAILY",
          symbol: ticker.symbol,
          outputsize: "compact",
          apikey: ALPHA_VANTAGE_API_KEY,
        });
        const avResponse = await fetch(
          `https://www.alphavantage.co/query?${params}`
        );
        const avData = await avResponse.json();

        if (avData["Note"] || avData["Information"]) continue;

        const timeSeries = avData["Time Series (Daily)"];
        if (!timeSeries) continue;

        const dates = Object.keys(timeSeries).sort();
        const latest = dates[dates.length - 1];
        const previous = dates[dates.length - 2];
        const weekAgo = dates[Math.max(dates.length - 6, 0)];

        const latestClose = parseFloat(timeSeries[latest]["4. close"]);
        const previousClose = previous
          ? parseFloat(timeSeries[previous]["4. close"])
          : latestClose;
        const weekAgoClose = parseFloat(timeSeries[weekAgo]["4. close"]);

        stockData[ticker.symbol] = {
          name: ticker.name,
          price: latestClose,
          dailyChange: (
            ((latestClose - previousClose) / previousClose) *
            100
          ).toFixed(2),
          weeklyChange: (
            ((latestClose - weekAgoClose) / weekAgoClose) *
            100
          ).toFixed(2),
        };
      } catch {
        // Skip failed tickers
      }
    }

    // Format data
    const medianPrice = parseInt(indicatorData.MSPUS?.latest || "0");
    const existingSales =
      parseInt(indicatorData.EXHOSLUSM495S?.latest || "0") / 1000000;
    const mortgageRate = parseFloat(
      indicatorData.MORTGAGE30US?.latest || "0"
    );
    const inventory = parseFloat(indicatorData.MSACSR?.latest || "0");
    const newSales = parseInt(indicatorData.HSN1F?.latest || "0");
    const housingStarts = parseInt(indicatorData.HOUST?.latest || "0");

    const stockSummary = Object.entries(stockData)
      .map(
        ([sym, d]) =>
          `- ${sym} (${d.name}): $${d.price.toFixed(2)}, daily ${d.dailyChange}%, weekly ${d.weeklyChange}%`
      )
      .join("\n");

    const prompt = `You are a sharp housing market analyst. Write 2-3 sentences analyzing how current housing fundamentals are affecting housing-related stocks.

HOUSING DATA:
- Median Home Price: $${medianPrice.toLocaleString()}
- Existing Home Sales: ${existingSales.toFixed(2)} million/year
- 30-Year Mortgage Rate: ${mortgageRate.toFixed(2)}%
- Housing Inventory: ${inventory.toFixed(1)} months supply
- New Home Sales: ${newSales}K/year
- Housing Starts: ${housingStarts}K/year

STOCK DATA:
${stockSummary || "- Stock data unavailable"}

SECTOR CONTEXT:
- ITB tracks homebuilders (D.R. Horton, Lennar, PulteGroup, etc.)
- VNQ tracks REITs (Invitation Homes, etc.)
- RKT represents mortgage lenders (Rocket Companies, UWM Holdings)

Write a punchy commentary that:
1. Connects specific housing data points to stock performance
2. Explains WHY housing fundamentals are bullish or bearish for each sector
3. Uses actual numbers from both datasets

No hedging, no "may" or "could" - be direct.`;

    const commentary = await callClaude(prompt, ANTHROPIC_API_KEY);

    return NextResponse.json(
      {
        commentary,
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
