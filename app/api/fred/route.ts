import { NextRequest, NextResponse } from "next/server";
import { verifyAuth } from "@/lib/verify-auth";

export async function GET(request: NextRequest) {
  const user = await verifyAuth(request);
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = request.nextUrl;
  const series_id = searchParams.get("series_id");
  const observation_start = searchParams.get("observation_start");
  const units = searchParams.get("units");

  if (!series_id) {
    return NextResponse.json(
      { error: "series_id is required" },
      { status: 400 }
    );
  }

  const API_KEY = process.env.FRED_API_KEY;
  if (!API_KEY) {
    return NextResponse.json(
      { error: "FRED API key not configured" },
      { status: 500 }
    );
  }

  const params = new URLSearchParams({
    series_id,
    api_key: API_KEY,
    file_type: "json",
    sort_order: "asc",
  });

  if (observation_start) {
    params.append("observation_start", observation_start);
  }

  if (units) {
    params.append("units", units);
  }

  const url = `https://api.stlouisfed.org/fred/series/observations?${params}`;

  try {
    const response = await fetch(url);

    if (!response.ok) {
      const text = await response.text();
      return NextResponse.json(
        { error: "FRED API error", status: response.status, details: text },
        { status: response.status }
      );
    }

    const data = await response.json();

    return NextResponse.json(data, {
      headers: {
        "Cache-Control": "s-maxage=3600, stale-while-revalidate",
      },
    });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
