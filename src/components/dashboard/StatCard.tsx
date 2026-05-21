import type { ReactNode } from "react";

export function StatCard({
  label,
  value,
  icon,
  hint,
}: {
  label: string;
  value: string | number;
  icon?: ReactNode;
  hint?: string;
}) {
  return (
    <div className="card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-slate-500">{label}</p>
        {icon && (
          <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand-50 text-brand-700">
            {icon}
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold tracking-tight text-slate-900">
        {value}
      </p>
      {hint && <p className="mt-1 text-xs text-slate-500">{hint}</p>}
    </div>
  );
}
