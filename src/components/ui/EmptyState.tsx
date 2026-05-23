import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
}: {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center py-12 px-6 border border-dashed rounded-lg",
        "border-stone-300 bg-stone-50/50 dark:border-slate-700 dark:bg-slate-800/30",
        className
      )}
    >
      {icon && (
        <div
          className="mb-3 text-stone-400 dark:text-slate-500"
          aria-hidden
        >
          {icon}
        </div>
      )}
      <h3 className="text-sm font-semibold text-stone-900 dark:text-stone-100">
        {title}
      </h3>
      {description && (
        <p className="mt-1 max-w-sm text-sm text-stone-500 dark:text-slate-400">
          {description}
        </p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
