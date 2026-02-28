import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verify-auth";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const symbol = searchParams.get("symbol");

  if (!symbol) {
    return NextResponse.json(
      { error: "symbol is required" },
      { status: 400 }
    );
  }

  const API_KEY = process.env.ALPHA_VANTAGE_API_KEY;
  if (!API_KEY) {
    return NextResponse.json(
      { error: "Alpha Vantage API key not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    function: "TIME_SERIES_DAILY",
    symbol,
    outputsize: "compact",
    apikey: API_KEY,
  });

  const url = `https://www.alphavantage.co/query?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      return NextResponse.json(
        { error: "Alpha Vantage API error", status: response.status },
        { status: response.status }
      );
    }

    const data = await response.json();

    if (data["Note"] || data["Information"]) {
      return NextResponse.json(
        { error: data["Note"] || data["Information"] },
        { status: 429 }
      );
    }

    if (data["Error Message"]) {
      return NextResponse.json(
        { error: data["Error Message"] },
        { status: 400 }
      );
    }

    const timeSeries = data["Time Series (Daily)"];
    if (!timeSeries) {
      return NextResponse.json(
        { error: "Unexpected response format" },
        { status: 500 }
      );
    }

    const dates = Object.keys(timeSeries).sort();
    const latest = dates[dates.length - 1];
    const previous = dates[dates.length - 2];

    const latestClose = parseFloat(timeSeries[latest]["4. close"]);
    const previousClose = previous
      ? parseFloat(timeSeries[previous]["4. close"])
      : latestClose;
    const change = latestClose - previousClose;
    const changePercent = (change / previousClose) * 100;

    const last30 = dates.slice(-30);
    const history = last30.map((date) => ({
      date,
      close: parseFloat(timeSeries[date]["4. close"]),
    }));

    return NextResponse.json(
      {
        symbol: symbol.toUpperCase(),
        price: latestClose,
        change,
        changePercent,
        history,
      },
      {
        headers: {
          "Cache-Control": "s-maxage=900, stale-while-revalidate",
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
