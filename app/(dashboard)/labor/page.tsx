import type { Metadata } from "next";
import { laborIndicators } from "@/lib/indicators";
import { IndicatorCard } from "@/components/ui/indicator-card";
import { SummarySection } from "@/components/ui/summary-section";

export const metadata: Metadata = {
  title: "Labor — Signal & Stories",
};

export default function LaborPage() {
  return (
    <>
      <header className="dashboard-header">
        <h1>Labor</h1>
        <p className="tagline">What the data actually says</p>
      </header>

      <SummarySection apiUrl="/api/labor-summary" />

      <div className="grid">
        {laborIndicators.map((indicator) => (
          <IndicatorCard key={indicator.id} indicator={indicator} />
        ))}
      </div>

      <footer className="dashboard-footer">
        <p>
          Data from{" "}
          <a href="https://fred.stlouisfed.org/" target="_blank" rel="noopener noreferrer">
            FRED
          </a>{" "}
          (Federal Reserve Bank of St. Louis). Updated as new data is released.
        </p>
      </footer>
    </>
  );
}
