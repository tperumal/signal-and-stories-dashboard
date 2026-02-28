"use client";

import { useEffect, useState } from "react";
import type { Ticker } from "@/lib/stocks";
import { SparklineChart } from "./sparkline-chart";
import { useAuthFetch } from "@/lib/use-auth-fetch";

interface StockData {
  symbol: string;
  price: number;
  change: number;
  changePercent: number;
  history: { date: string; close: number }[];
}

const CACHE_TTL = 15 * 60 * 1000; // 15 minutes

function getStockCache(symbol: string): StockData | null {
  try {
    const raw = localStorage.getItem(`stock_${symbol}`);
    if (!raw) return null;
    const cached = JSON.parse(raw);
    if (Date.now() - cached.timestamp > CACHE_TTL) return null;
    return cached.data;
  } catch {
    return null;
  }
}

function setStockCache(symbol: string, data: StockData) {
  try {
    localStorage.setItem(
      `stock_${symbol}`,
      JSON.stringify({ timestamp: Date.now(), data })
    );
  } catch {
    // localStorage full or unavailable
  }
}

interface StockCardProps {
  ticker: Ticker;
  delayMs?: number;
}

export function StockCard({ ticker, delayMs = 0 }: StockCardProps) {
  const [data, setData] = useState<StockData | null>(null);
  const [error, setError] = useState(false);
  const authFetch = useAuthFetch();

  useEffect(() => {
    const cached = getStockCache(ticker.symbol);
    if (cached) {
      setData(cached);
      return;
    }

    const timeout = setTimeout(() => {
      authFetch(`/api/stocks?symbol=${ticker.symbol}`)
        .then((res) => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          return res.json();
        })
        .then((json: StockData) => {
          setStockCache(ticker.symbol, json);
          setData(json);
        })
        .catch(() => setError(true));
    }, delayMs);

    return () => clearTimeout(timeout);
  }, [ticker.symbol, delayMs, authFetch]);

  const isDark =
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  const chartColor =
    data && data.history && data.history.length > 1
      ? data.history[data.history.length - 1].close >= data.history[0].close
        ? isDark
          ? "#22c55e"
          : "#16a34a"
        : isDark
          ? "#ef4444"
          : "#dc2626"
      : undefined;

  const chartData =
    data?.history?.map((d) => ({ date: d.date, value: d.close })) || [];

  const prevDate =
    data?.history && data.history.length >= 2
      ? new Date(data.history[data.history.length - 2].date).toLocaleDateString(
          "en-US",
          { month: "short", day: "numeric" }
        )
      : "";
  const vsLabel = prevDate ? ` vs ${prevDate}` : "";

  return (
    <div className="stock-card">
      <div className="stock-card-header">
        <div>
          <div className="stock-ticker">{ticker.symbol}</div>
          <div className="stock-name">{ticker.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className={`stock-price ${!data && !error ? "loading" : ""}`}>
            {error ? "\u2014" : data ? `$${data.price.toFixed(2)}` : "\u2014"}
          </div>
          {data && (
            <div
              className={`stock-change ${data.changePercent >= 0 ? "trend-up" : "trend-down"}`}
            >
              {data.changePercent >= 0 ? "\u2191" : "\u2193"}{" "}
              {data.changePercent >= 0 ? "+" : ""}
              {data.changePercent.toFixed(2)}%{vsLabel}
            </div>
          )}
          {error && (
            <div className="stock-change" style={{ color: "var(--text-muted)" }}>
              unavailable
            </div>
          )}
        </div>
      </div>
      {chartData.length > 1 && (
        <SparklineChart
          data={chartData}
          height={60}
          color={chartColor}
          variant="stock"
        />
      )}
    </div>
  );
}
