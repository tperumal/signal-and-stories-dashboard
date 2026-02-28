"use client";

import { useEffect, useState } from "react";
import { useAuthFetch } from "@/lib/use-auth-fetch";

interface Headline {
  title: string;
  source: string;
  url: string;
  publishedAt: string;
}

interface SummaryData {
  summary: string;
  headlines: Headline[];
  generatedAt: string;
}

export function SummarySection({ apiUrl = "/api/summary" }: { apiUrl?: string }) {
  const [data, setData] = useState<SummaryData | null>(null);
  const [error, setError] = useState(false);
  const authFetch = useAuthFetch();

  useEffect(() => {
    authFetch(apiUrl)
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load summary");
        return res.json();
      })
      .then((json: SummaryData) => setData(json))
      .catch(() => setError(true));
  }, [apiUrl, authFetch]);

  return (
    <div className="summary-section">
      <div className="summary-title">Market Summary</div>
      <div
        className={`summary-text ${!data && !error ? "summary-loading" : ""} ${error ? "summary-error" : ""}`}
      >
        {error
          ? "Unable to load market summary"
          : data
            ? data.summary
            : "Analyzing market data and news..."}
      </div>
      <div className="headlines-title">Recent Headlines</div>
      <div className="headlines-list">
        {error ? (
          <div className="summary-error">Unable to load headlines</div>
        ) : !data ? (
          <div className="summary-loading">Loading headlines...</div>
        ) : (
          data.headlines.map((h, i) => (
            <div key={i} className="headline-item">
              <a href={h.url} target="_blank" rel="noopener noreferrer">
                {h.title}
              </a>
              <span className="headline-source">{h.source}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
