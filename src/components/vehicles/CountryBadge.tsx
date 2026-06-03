import { countryFlag, countryLabel } from "@/lib/countries";
import { cn } from "@/lib/utils";

export function CountryBadge({
  code,
  className,
}: {
  code: string | null | undefined;
  className?: string;
}) {
  const flag = countryFlag(code);
  const name = countryLabel(code);
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium",
        "bg-stone-100 text-stone-700 dark:bg-slate-800 dark:text-slate-300",
        className
      )}
      title={name}
    >
      <span aria-hidden>{flag}</span>
      {code ?? "GA"}
    </span>
  );
}
