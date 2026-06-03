import { cn } from "@/lib/utils";

type Props = {
  children: React.ReactNode;
  className?: string;
  /** Stronger flag stripes on marketing/auth pages */
  variant?: "subtle" | "prominent";
};

/**
 * Gabon flag fabric image as a fixed watermark (filigrane) behind all pages.
 * Blur + opacity soften the photo; glass panels keep foreground text readable.
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
      <div className="relative isolate z-10 min-h-screen">{children}</div>
    </div>
  );
}
