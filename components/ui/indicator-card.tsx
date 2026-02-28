"use client";

import { useEffect, useState } from "react";
import type { Indicator } from "@/lib/indicators";
import { formatValue, formatDate, calculateTrend, getTrendArrow } from "@/lib/formatters";
import { SparklineChart } from "./sparkline-chart";
import { useAuthFetch } from "@/lib/use-auth-fetch";

interface FredObservation {
  date: string;
  value: string;
}

export function IndicatorCard({ indicator }: { indicator: Indicator }) {
  const [data, setData] = useState<FredObservation[] | null>(null);
  const [error, setError] = useState(false);
  const authFetch = useAuthFetch();

  useEffect(() => {
    const twoYearsAgo = new Date();
    twoYearsAgo.setFullYear(twoYearsAgo.getFullYear() - 2);
    const startDate = twoYearsAgo.toISOString().split("T")[0];

    authFetch(`/api/fred?series_id=${indicator.id}&observation_start=${startDate}`)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((json) => {
        const obs = json.observations.filter(
          (o: FredObservation) => o.value !== "."
        );
        if (obs.length === 0) throw new Error("No data");
        setData(obs);
      })
      .catch(() => setError(true));
  }, [indicator.id, authFetch]);

  const latestObs = data ? data[data.length - 1] : null;
  const trend = data ? calculateTrend(data) : null;
  const chartData = data
    ? data.map((d) => ({ date: d.date, value: parseFloat(d.value) }))
    : [];

  return (
    <div className="card">
      <div className="card-header">
        <div>
          <div className="card-title-wrapper">
            <div className="card-title">
              {indicator.name}{" "}
              <span className="card-frequency">{indicator.frequency}</span>
            </div>
            <div className="card-tooltip">{indicator.tooltip}</div>
          </div>
          <div className="card-subtitle">{indicator.subtitle}</div>
          <div className={`card-value ${!data && !error ? "loading" : ""}`}>
            {error
              ? "Error loading data"
              : latestObs
                ? formatValue(latestObs.value, indicator.format)
                : "Loading..."}
          </div>
          {trend && (
            <div className={`card-trend trend-${trend.direction}`}>
              {getTrendArrow(trend.direction)}{" "}
              {Math.abs(trend.change).toFixed(1)}% from {trend.previousDate}
            </div>
          )}
          {latestObs && (
            <div className="card-date">As of {formatDate(latestObs.date)}</div>
          )}
        </div>
      </div>
      {chartData.length > 0 && (
        <SparklineChart data={chartData} height={120} variant="indicator" />
      )}
    </div>
  );
}
