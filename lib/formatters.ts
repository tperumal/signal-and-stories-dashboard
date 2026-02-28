import type { FormatType } from "./indicators";

export function formatValue(value: string | number, format: FormatType): string {
  const num = typeof value === "string" ? parseFloat(value) : value;
  switch (format) {
    case "currency":
      return "$" + num.toLocaleString("en-US", { maximumFractionDigits: 0 });
    case "percent":
      return num.toFixed(2) + "%";
    case "millions":
      return num.toFixed(2) + " million";
    case "unitsToMillions":
      return (num / 1000000).toFixed(2) + " million";
    case "months":
      return num.toFixed(1) + " mo";
    case "thousands":
      return num.toLocaleString("en-US", { maximumFractionDigits: 0 }) + "K";
    default:
      return num.toLocaleString("en-US");
  }
}

export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString("en-US", { month: "short", year: "2-digit" });
}

export interface TrendResult {
  direction: "up" | "down" | "flat";
  change: number;
  currentDate: string;
  previousDate: string;
}

export function calculateTrend(
  data: { date: string; value: string }[]
): TrendResult {
  if (data.length < 2)
    return { direction: "flat", change: 0, currentDate: "", previousDate: "" };

  const currentObs = data[data.length - 1];
  const previousObs = data[data.length - 2];
  const current = parseFloat(currentObs.value);
  const previous = parseFloat(previousObs.value);
  const change = ((current - previous) / previous) * 100;

  if (Math.abs(change) < 0.1)
    return {
      direction: "flat",
      change: 0,
      currentDate: formatDate(currentObs.date),
      previousDate: formatDate(previousObs.date),
    };

  return {
    direction: change > 0 ? "up" : "down",
    change,
    currentDate: formatDate(currentObs.date),
    previousDate: formatDate(previousObs.date),
  };
}

export function getTrendArrow(direction: "up" | "down" | "flat"): string {
  switch (direction) {
    case "up":
      return "\u2191";
    case "down":
      return "\u2193";
    default:
      return "\u2192";
  }
}
