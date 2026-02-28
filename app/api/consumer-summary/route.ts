import { NextRequest, NextResponse } from "next/server";
import { fetchIndicatorSummaries } from "@/lib/fred-client";
import { callClaude } from "@/lib/claude-client";
import { verifyAuth } from "@/lib/verify-auth";

const CONSUMER_INDICATORS = [
  { id: "RSAFS", name: "Retail Sales" },
  { id: "UMCSENT", name: "Consumer Sentiment" },
  { id: "DPCERAM1M225NBEA", name: "Real Consumer Spending" },
  { id: "REVOLSL", name: "Revolving Credit" },
  { id: "PSAVERT", name: "Personal Saving Rate" },
  { id: "TOTALSA", name: "Auto Sales" },
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
    const newsUrl = `https://newsapi.org/v2/everything?q="consumer spending" OR "retail sales" OR "consumer sentiment" OR "consumer confidence" OR "credit card debt"&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();

    if (newsData.status !== "ok") {
      throw new Error(newsData.message || "News API error");
    }

    const relevantArticles = newsData.articles.filter((a: { title: string }) => {
      const title = a.title.toLowerCase();
      return (
        title.includes("consumer") ||
        title.includes("retail") ||
        title.includes("spending") ||
        title.includes("sentiment") ||
        title.includes("confidence") ||
        title.includes("credit") ||
        title.includes("saving")
      );
    });

    const headlines = relevantArticles.slice(0, 6).map((a: { title: string; source: { name: string }; url: string; publishedAt: string }) => ({
      title: a.title,
      source: a.source.name,
      url: a.url,
      publishedAt: a.publishedAt,
    }));

    const indicatorData = await fetchIndicatorSummaries(
      CONSUMER_INDICATORS,
      FRED_API_KEY,
      "2024-01-01"
    );

    const retailSales = parseFloat(indicatorData.RSAFS?.latest || "0");
    const sentiment = parseFloat(indicatorData.UMCSENT?.latest || "0");
    const realSpending = parseFloat(indicatorData.DPCERAM1M225NBEA?.latest || "0");
    const revolvingCredit = parseFloat(indicatorData.REVOLSL?.latest || "0");
    const savingRate = parseFloat(indicatorData.PSAVERT?.latest || "0");
    const autoSales = parseFloat(indicatorData.TOTALSA?.latest || "0");

    const prompt = `You are a sharp consumer economy analyst who cuts through noise. Write a 2-3 sentence market summary using the specific numbers below.

DATA:
- Retail Sales: $${retailSales.toFixed(0)} million/month
- Consumer Sentiment (UMich): ${sentiment.toFixed(1)}
- Real Consumer Spending Growth: ${realSpending.toFixed(1)}%
- Revolving Credit Outstanding: $${revolvingCredit.toFixed(0)} million
- Personal Saving Rate: ${savingRate.toFixed(1)}%
- Auto Sales (SAAR): ${autoSales.toFixed(1)} million

CONTEXT:
- Consumer spending drives ~70% of US GDP
- Pre-pandemic consumer sentiment averaged about 95-100
- Historical personal saving rate averages about 7%
- Pre-pandemic auto sales ran about 17 million/year
- Revolving credit above $1 trillion signals elevated consumer leverage

HEADLINES:
${headlines.length > 0 ? headlines.map((h: { title: string }) => `- ${h.title}`).join("\n") : "- None available"}

Write a punchy summary that:
1. Uses specific numbers (e.g., "sentiment at 67.4" not "weak confidence")
2. Compares to historical norms (e.g., "saving rate at 3.8% is well below the 7% average")
3. States the bottom line for consumer health and the spending outlook

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
