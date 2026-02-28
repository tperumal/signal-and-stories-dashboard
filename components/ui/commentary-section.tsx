"use client";

import { useEffect, useState } from "react";
import { useAuthFetch } from "@/lib/use-auth-fetch";

export function CommentarySection() {
  const [commentary, setCommentary] = useState<string | null>(null);
  const [error, setError] = useState(false);
  const authFetch = useAuthFetch();

  useEffect(() => {
    authFetch("/api/stock-commentary")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to load commentary");
        return res.json();
      })
      .then((json) => setCommentary(json.commentary))
      .catch(() => setError(true));
  }, [authFetch]);

  return (
    <div className="commentary-section">
      <div className="summary-title">Stock Market Commentary</div>
      <div
        className={`commentary-text ${!commentary && !error ? "summary-loading" : ""} ${error ? "summary-error" : ""}`}
      >
        {error
          ? "Unable to load stock commentary"
          : commentary ?? "Analyzing market impact on housing stocks..."}
      </div>
    </div>
  );
}
