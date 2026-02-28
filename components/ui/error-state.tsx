export function ErrorState({ message = "Error loading data" }: { message?: string }) {
  return <div className="text-sm text-[var(--down)]">{message}</div>;
}
