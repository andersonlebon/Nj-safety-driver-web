import { cn } from "@/lib/utils";

type Props = {
  className?: string;
};

/** Visual required-field indicator (decorative; pair with `required` on inputs). */
export function RequiredMark({ className }: Props) {
  return (
    <span className={cn("ml-1 text-red-500", className)} aria-hidden>
      *
    </span>
  );
}
