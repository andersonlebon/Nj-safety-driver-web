import { type ReactNode } from "react";
import { cn } from "@/lib/utils";

type Variant = "info" | "success" | "warning" | "error";

const styles: Record<Variant, string> = {
  info: "bg-brand-50 text-brand-900 border-brand-200",
  success: "bg-emerald-50 text-emerald-900 border-emerald-200",
  warning: "bg-amber-50 text-amber-900 border-amber-200",
  error: "bg-red-50 text-red-900 border-red-200",
};

export function Alert({
  variant = "info",
  children,
  className,
}: {
  variant?: Variant;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn("rounded-md border px-3 py-2 text-sm", styles[variant], className)}
    >
      {children}
    </div>
  );
}
