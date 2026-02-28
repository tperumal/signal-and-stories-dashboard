"use client";

import { useEffect, useRef } from "react";
import { Chart, registerables } from "chart.js";

Chart.register(...registerables);

interface SparklineChartProps {
  data: { date: string; value: number }[];
  height?: number;
  color?: string;
  variant?: "indicator" | "stock";
}

export function SparklineChart({
  data,
  height = 120,
  color,
  variant = "indicator",
}: SparklineChartProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const chartRef = useRef<Chart | null>(null);

  useEffect(() => {
    if (!canvasRef.current || data.length === 0) return;

    const isDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const defaultColor = isDark ? "#60a5fa" : "#2563eb";
    const lineColor = color || defaultColor;

    const isStock = variant === "stock";
    const dateFormat: Intl.DateTimeFormatOptions = isStock
      ? { month: "short", day: "numeric" }
      : { month: "short", year: "2-digit" };

    // Destroy previous chart
    if (chartRef.current) {
      chartRef.current.destroy();
    }

    chartRef.current = new Chart(canvasRef.current, {
      type: "line",
      data: {
        labels: data.map((d) =>
          new Date(d.date).toLocaleDateString("en-US", dateFormat)
        ),
        datasets: [
          {
            data: data.map((d) => d.value),
            borderColor: lineColor,
            backgroundColor: "transparent",
            borderWidth: isStock ? 1.5 : 2,
            pointRadius: 0,
            pointHoverRadius: isStock ? 4 : 0,
            pointHoverBackgroundColor: isStock ? lineColor : undefined,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: isStock
            ? {
                callbacks: {
                  title: (items) => items[0].label,
                  label: (item) => "$" + (item.raw as number).toFixed(2),
                },
              }
            : { enabled: false },
        },
        scales: {
          x: { display: false },
          y: { display: false },
        },
        interaction: {
          intersect: false,
          mode: "index",
        },
      },
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [data, color, variant]);

  return (
    <div style={{ height: `${height}px` }} className="mt-2">
      <canvas ref={canvasRef} />
    </div>
  );
}
