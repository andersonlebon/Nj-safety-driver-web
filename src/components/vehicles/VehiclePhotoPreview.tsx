"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { Car, X } from "lucide-react";
import { Button } from "@/components/ui/Button";

type Props = {
  photoUrl: string | null;
  plate: string;
  className?: string;
};

export function VehiclePhotoPreview({ photoUrl, plate, className }: Props) {
  const [open, setOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  const frameClassName =
    className ??
    "aspect-video w-full sm:w-44 lg:w-40 shrink-0 overflow-hidden rounded-lg border border-stone-200 dark:border-slate-700 bg-stone-100 dark:bg-slate-800";

  if (!photoUrl) {
    return (
      <div className={frameClassName}>
        <div className="flex h-full min-h-[7rem] items-center justify-center text-stone-400 dark:text-slate-500">
          <Car className="h-10 w-10" />
        </div>
      </div>
    );
  }

  const lightbox =
    open && mounted
      ? createPortal(
          <div
            className="fixed inset-0 z-[200] bg-black"
            role="dialog"
            aria-modal
            aria-label={`Vehicle photo for ${plate}`}
          >
            <div className="absolute inset-x-0 top-0 z-10 flex justify-end p-4">
              <Button type="button" variant="secondary" onClick={() => setOpen(false)}>
                <X className="h-4 w-4" />
                Close
              </Button>
            </div>
            <button
              type="button"
              className="absolute inset-0 flex items-center justify-center p-4 pt-20 sm:p-8 sm:pt-24"
              onClick={() => setOpen(false)}
              aria-label="Close vehicle photo"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={photoUrl}
                alt={`Vehicle ${plate}`}
                className="max-h-[calc(100dvh-6rem)] max-w-[calc(100vw-2rem)] h-auto w-auto object-contain"
                onClick={(event) => event.stopPropagation()}
              />
            </button>
          </div>,
          document.body
        )
      : null;

  return (
    <>
      <button
        type="button"
        className={`${frameClassName} block cursor-zoom-in transition-opacity hover:opacity-90 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-600 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-slate-900`}
        onClick={() => setOpen(true)}
        aria-label={`View vehicle photo for ${plate}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={photoUrl}
          alt={`Vehicle ${plate}`}
          className="h-full w-full object-cover"
        />
      </button>
      {lightbox}
    </>
  );
}
