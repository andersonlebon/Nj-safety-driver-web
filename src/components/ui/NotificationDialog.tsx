"use client";

import { AlertTriangle, Info } from "lucide-react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Variant = "info" | "warning" | "error";

const variantStyles: Record<
  Variant,
  { icon: typeof Info; box: string; iconClass: string }
> = {
  info: {
    icon: Info,
    box: "bg-brand-50 border-brand-200 text-brand-900 dark:bg-brand-950/40 dark:border-brand-800/40 dark:text-brand-200",
    iconClass: "text-brand-600 dark:text-brand-400",
  },
  warning: {
    icon: AlertTriangle,
    box: "bg-amber-50 border-amber-200 text-amber-900 dark:bg-amber-950/40 dark:border-amber-800/40 dark:text-amber-200",
    iconClass: "text-amber-600 dark:text-amber-400",
  },
  error: {
    icon: AlertTriangle,
    box: "bg-red-50 border-red-200 text-red-900 dark:bg-red-950/40 dark:border-red-800/40 dark:text-red-200",
    iconClass: "text-red-600 dark:text-red-400",
  },
};

type Props = {
  open: boolean;
  onClose: () => void;
  title?: string;
  message: string;
  variant?: Variant;
  confirmLabel?: string;
};

export function NotificationDialog({
  open,
  onClose,
  title = "Notice",
  message,
  variant = "warning",
  confirmLabel = "OK",
}: Props) {
  const { icon: Icon, box, iconClass } = variantStyles[variant];

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      className="max-w-md"
      footer={
        <div className="flex justify-end">
          <Button type="button" onClick={onClose}>
            {confirmLabel}
          </Button>
        </div>
      }
    >
      <div className={cn("flex gap-3 rounded-lg border px-3 py-3 text-sm", box)}>
        <Icon className={cn("h-5 w-5 shrink-0 mt-0.5", iconClass)} />
        <p className="whitespace-pre-wrap">{message}</p>
      </div>
    </Modal>
  );
}
