"use client";

import type { StockGroup as StockGroupType } from "@/lib/stocks";
import { StockCard } from "./stock-card";

const STOCK_REQUEST_DELAY = 1500;

interface StockGroupProps {
  group: StockGroupType;
  groupIndex: number;
  tickerOffset: number;
}

export function StockGroup({ group, tickerOffset }: StockGroupProps) {
  return (
    <div className="stock-group">
      <div className="stock-group-title">{group.name}</div>
      <div className="stock-grid">
        {group.tickers.map((ticker, i) => (
          <StockCard
            key={ticker.symbol}
            ticker={ticker}
            delayMs={(tickerOffset + i) * STOCK_REQUEST_DELAY}
          />
        ))}
      </div>
    </div>
  );
}
