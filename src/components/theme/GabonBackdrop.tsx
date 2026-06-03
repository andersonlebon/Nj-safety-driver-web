import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Stronger flag stripes on marketing/auth pages */
  variant?: "subtle" | "prominent";
};

/**
 * Official Gabon palette watermark (green · gold · blue) for all app surfaces.
 * Content sits above a fixed, non-interactive flag layer; panels use glass styling.
 */
export function GabonBackdrop({
  children,
  className,
  variant = "subtle",
}: Props) {
  return (
    <div
      className={cn(
        "relative min-h-screen",
        variant === "prominent" ? "gabon-backdrop-prominent" : "gabon-backdrop",
        className
      )}
    >
      <div className="gabon-flag-layer" aria-hidden />
      <div className="gabon-flag-shine" aria-hidden />
      <div className="relative z-[1] min-h-screen">{children}</div>
    </div>
  );
}
