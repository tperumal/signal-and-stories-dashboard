export function LoadingSkeleton({ className = "" }: { className?: string }) {
  return (
    <div
      className={`animate-pulse rounded bg-[var(--border)] ${className}`}
      style={{ height: "1em", width: "60%" }}
    />
  );
}
