/** Shared skeleton streamed instantly while a dashboard route resolves. */
export function DashboardLoading() {
  return (
    <div className="animate-pulse" aria-label="Loading" role="status">
      <div className="mb-6 space-y-2">
        <div className="h-7 w-56 rounded-md bg-stone-200 dark:bg-slate-800" />
        <div className="h-4 w-80 max-w-full rounded bg-stone-100 dark:bg-slate-800/60" />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div
            key={i}
            className="h-28 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-900/40"
          />
        ))}
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-4">
        <div className="lg:col-span-2 h-72 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-900/40" />
        <div className="h-72 rounded-xl border border-stone-200 dark:border-slate-800 bg-stone-50/60 dark:bg-slate-900/40" />
      </div>
    </div>
  );
}
