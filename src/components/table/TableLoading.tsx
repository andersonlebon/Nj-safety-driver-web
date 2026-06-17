export function TableLoading({ label = "Loading…" }: { label?: string }) {
  return (
    <div
      className="py-12 text-center text-sm text-stone-500 dark:text-slate-400"
      role="status"
      aria-live="polite"
    >
      {label}
    </div>
  );
}
