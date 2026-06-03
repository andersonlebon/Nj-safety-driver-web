import { cn } from "@/lib/utils";

/**
 * Centered “dialog” panel for auth/setup flows on the Gabon backdrop.
 */
export function AuthDialogCard({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "w-full rounded-2xl border border-stone-200/80 dark:border-slate-700/80",
        "bg-white/95 dark:bg-slate-900/95 backdrop-blur-md shadow-luxury",
        "ring-1 ring-brand-600/10 dark:ring-brand-500/15",
        className
      )}
    >
      <div className="gabon-dialog-accent" aria-hidden />
      <div className="relative px-6 py-6 sm:px-8 sm:py-8">{children}</div>
    </div>
  );
}
