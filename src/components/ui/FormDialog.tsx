"use client";

import { useState, type ReactNode } from "react";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/Button";
import { cn } from "@/lib/utils";

type Props = {
  triggerLabel: ReactNode;
  title: string;
  description?: string;
  children: ReactNode | ((api: { close: () => void }) => ReactNode);
  triggerVariant?: "primary" | "secondary";
  className?: string;
  modalClassName?: string;
  /** Open dialog by default (e.g. auth-style pages) */
  defaultOpen?: boolean;
  hideTrigger?: boolean;
};

export function FormDialog({
  triggerLabel,
  title,
  description,
  children,
  triggerVariant = "primary",
  className,
  modalClassName,
  defaultOpen = false,
  hideTrigger = false,
}: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const close = () => setOpen(false);

  return (
    <div className={className}>
      {!hideTrigger && (
        <Button
          type="button"
          variant={triggerVariant === "secondary" ? "secondary" : undefined}
          onClick={() => setOpen(true)}
        >
          {triggerLabel}
        </Button>
      )}
      <Modal
        open={open}
        onClose={close}
        title={title}
        description={description}
        className={cn("max-w-xl", modalClassName)}
      >
        {typeof children === "function" ? children({ close }) : children}
      </Modal>
    </div>
  );
}
