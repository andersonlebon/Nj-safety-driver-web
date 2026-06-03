import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Stronger flag stripes on marketing/auth pages */
  variant?: "subtle" | "prominent";
};

/**
 * Official Gabon flag image watermark on all app surfaces (including landing).
 * Content uses glass panels so text stays readable over the flag.
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
