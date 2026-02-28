import type { Metadata } from "next";
import { housingIndicators } from "@/lib/indicators";
import { housingStockGroups } from "@/lib/stocks";
import { IndicatorCard } from "@/components/ui/indicator-card";
import { SummarySection } from "@/components/ui/summary-section";
import { CommentarySection } from "@/components/ui/commentary-section";
import { StockGroup } from "@/components/ui/stock-group";

export const metadata: Metadata = {
  title: "Housing — Signal & Stories",
};

export default function HousingPage() {
  let tickerOffset = 0;

  return (
    <>
      <header className="dashboard-header">
        <h1>Housing</h1>
        <p className="tagline">What the data actually says</p>
      </header>

      <SummarySection apiUrl="/api/summary" />

      <div className="grid">
        {housingIndicators.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </div>

      <CommentarySection />

      <div className="market-watch">
        <h2 className="section-title">Market Watch</h2>
        <p className="section-subtitle">Housing-related stocks & ETFs</p>
        {housingStockGroups.map((group, i) => {
          const offset = tickerOffset;
          tickerOffset += group.tickers.length;
          return (
            <StockGroup
              key={group.name}
              group={group}
              groupIndex={i}
              tickerOffset={offset}
            />
          );
        })}
      </div>

      <footer className="dashboard-footer">
        <p>
          Data from{" "}
          <a href="https://fred.stlouisfed.org/" target="_blank" rel="noopener noreferrer">
            FRED
          </a>{" "}
          (Federal Reserve Bank of St. Louis) and{" "}
          <a href="https://www.alphavantage.co/" target="_blank" rel="noopener noreferrer">
            Alpha Vantage
          </a>
          . Updated as new data is released.
        </p>
      </footer>
    </>
  );
}
