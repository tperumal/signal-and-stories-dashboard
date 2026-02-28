import { NextRequest, NextResponse } from "next/server";
import { fetchIndicatorSummaries } from "@/lib/fred-client";
import { callClaude } from "@/lib/claude-client";
import { verifyAuth } from "@/lib/verify-auth";

const LABOR_INDICATORS = [
  { id: "UNRATE", name: "Unemployment Rate" },
  { id: "PAYEMS", name: "Nonfarm Payrolls" },
  { id: "ICSA", name: "Initial Jobless Claims" },
  { id: "JTSJOL", name: "Job Openings (JOLTS)" },
  { id: "CES0500000003", name: "Avg. Hourly Earnings" },
  { id: "CIVPART", name: "Labor Force Participation" },
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
    // Fetch labor news
    const newsUrl = `https://newsapi.org/v2/everything?q="labor market" OR "unemployment" OR "jobs report" OR "nonfarm payrolls" OR "jobless claims"&language=en&sortBy=publishedAt&pageSize=10&apiKey=${NEWS_API_KEY}`;
    const newsResponse = await fetch(newsUrl);
    const newsData = await newsResponse.json();

    if (newsData.status !== "ok") {
      throw new Error(newsData.message || "News API error");
    }

    const relevantArticles = newsData.articles.filter((a: { title: string }) => {
      const title = a.title.toLowerCase();
      return (
        title.includes("job") ||
        title.includes("employ") ||
        title.includes("labor") ||
        title.includes("labour") ||
        title.includes("wage") ||
        title.includes("hiring") ||
        title.includes("layoff") ||
        title.includes("payroll") ||
        title.includes("workforce")
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
      LABOR_INDICATORS,
      FRED_API_KEY,
      "2024-01-01"
    );

    // Format data for prompt
    const unemploymentRate = parseFloat(indicatorData.UNRATE?.latest || "0");
    const payrolls = parseInt(indicatorData.PAYEMS?.latest || "0");
    const joblessClaims = parseInt(indicatorData.ICSA?.latest || "0");
    const jobOpenings =
      parseInt(indicatorData.JTSJOL?.latest || "0") / 1000000;
    const hourlyEarnings = parseFloat(
      indicatorData.CES0500000003?.latest || "0"
    );
    const laborParticipation = parseFloat(
      indicatorData.CIVPART?.latest || "0"
    );

    const prompt = `You are a sharp labor market analyst who cuts through noise. Write a 2-3 sentence market summary using the specific numbers below.

DATA:
- Unemployment Rate: ${unemploymentRate.toFixed(1)}%
- Nonfarm Payrolls: ${payrolls.toLocaleString()}K
- Initial Jobless Claims: ${joblessClaims.toLocaleString()}K
- Job Openings (JOLTS): ${jobOpenings.toFixed(2)} million
- Avg. Hourly Earnings: $${hourlyEarnings.toFixed(2)}
- Labor Force Participation: ${laborParticipation.toFixed(1)}%

CONTEXT:
- Below 4% unemployment is generally considered full employment
- Pre-pandemic labor force participation was ~63.3%
- Initial claims below 250K is historically healthy
- Pre-pandemic there were ~7 million job openings

HEADLINES:
${headlines.length > 0 ? headlines.map((h: { title: string }) => `- ${h.title}`).join("\n") : "- None available"}

Write a punchy summary that:
1. Uses specific numbers (e.g., "3.8% unemployment" not "low unemployment")
2. Compares to historical norms (e.g., "claims at 220K are well below the 250K threshold")
3. States the bottom line for workers and employers in plain terms

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
