"use client";

import { cn } from "@/lib/utils";
import { useI18n } from "@/i18n/context";

type DriverTabId = "profile" | "documents" | "vehicles" | "comments";

export type VehicleTabId =
  | "overview"
  | "owner"
  | "id"
  | "documents"
  | "fines"
  | "comments";

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("rounded bg-stone-100 dark:bg-slate-800/70", className)} />;
}

export function DriverDetailTabSkeleton({ tab }: { tab: DriverTabId }) {
  const { t } = useI18n();

  return (
    <div
      className="animate-pulse space-y-4"
      aria-hidden
      role="status"
      aria-label={t("staff.drivers.detail.skeletonLoadingAria")}
    >
      {tab === "profile" && (
        <div className="rounded-lg border border-stone-200 dark:border-slate-800 p-4 space-y-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="grid grid-cols-2 gap-4">
              <div className="h-3 w-20 rounded bg-stone-200 dark:bg-slate-800" />
              <div className="h-3 w-32 rounded bg-stone-100 dark:bg-slate-800/70" />
            </div>
          ))}
        </div>
      )}

      {tab === "documents" && (
        <>
          <div className="flex gap-2">
            <div className="h-8 w-16 rounded-lg bg-stone-200 dark:bg-slate-800" />
            <div className="h-8 w-24 rounded-lg bg-stone-100 dark:bg-slate-800/70" />
          </div>
          <div className="h-40 rounded-lg bg-stone-100 dark:bg-slate-800/60" />
        </>
      )}

      {tab === "vehicles" && (
        <div className="rounded-lg border border-stone-200 dark:border-slate-800 overflow-hidden">
          <div className="h-10 bg-stone-100 dark:bg-slate-800/60" />
          {Array.from({ length: 2 }).map((_, i) => (
            <div
              key={i}
              className={cn(
                "h-12 border-t border-stone-200 dark:border-slate-800",
                "bg-stone-50/80 dark:bg-slate-900/40"
              )}
            />
          ))}
        </div>
      )}

      {tab === "comments" && (
        <div className="rounded-lg border border-stone-200 dark:border-slate-800 flex flex-col h-full min-h-[16rem]">
          <div className="flex-1 p-3 space-y-3">
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-full bg-stone-200 dark:bg-slate-800 shrink-0" />
              <div className="h-16 flex-1 max-w-[70%] rounded-xl bg-stone-100 dark:bg-slate-800/70" />
            </div>
            <div className="flex gap-3 flex-row-reverse">
              <div className="h-9 w-9 rounded-full bg-stone-200 dark:bg-slate-800 shrink-0" />
              <div className="h-14 flex-1 max-w-[65%] rounded-xl bg-stone-100 dark:bg-slate-800/70" />
            </div>
          </div>
          <div className="border-t border-stone-200 dark:border-slate-800 p-3 space-y-3">
            <div className="h-3 w-24 rounded bg-stone-200 dark:bg-slate-800" />
            <div className="h-20 rounded-lg bg-stone-100 dark:bg-slate-800/60" />
          </div>
        </div>
      )}

    </div>
  );
}

export function VehicleDetailTabSkeleton({ tab }: { tab: VehicleTabId }) {
  const { t } = useI18n();

  return (
    <div
      className="animate-pulse space-y-4"
      aria-hidden
      role="status"
      aria-label={t("staff.drivers.detail.skeletonLoadingAria")}
    >
      {tab === "overview" && (
        <div className="flex gap-3">
          <SkeletonBlock className="aspect-video w-full sm:w-48 min-h-[8rem]" />
          <div className="flex-1 space-y-3">
            <SkeletonBlock className="h-6 w-32" />
            <SkeletonBlock className="h-4 w-48" />
          </div>
        </div>
      )}
      {(tab === "owner") && (
        <div className="rounded-lg border border-stone-200 dark:border-slate-800 p-4 space-y-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="grid grid-cols-2 gap-4">
              <SkeletonBlock className="h-3 w-20" />
              <SkeletonBlock className="h-3 w-28" />
            </div>
          ))}
        </div>
      )}
      {tab === "id" && <SkeletonBlock className="h-40 w-full" />}
      {tab === "documents" && <SkeletonBlock className="h-44 w-full" />}
      {tab === "fines" && (
        <>
          <div className="grid grid-cols-3 gap-2">
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
            <SkeletonBlock className="h-16" />
          </div>
          <SkeletonBlock className="h-24 w-full" />
        </>
      )}
      {tab === "comments" && (
        <div className="rounded-lg border border-stone-200 dark:border-slate-800 flex flex-col h-full min-h-[16rem]">
          <div className="flex-1 p-3 space-y-3">
            <div className="flex gap-3">
              <div className="h-9 w-9 rounded-full bg-stone-200 dark:bg-slate-800 shrink-0" />
              <div className="h-16 flex-1 max-w-[70%] rounded-xl bg-stone-100 dark:bg-slate-800/70" />
            </div>
          </div>
          <div className="border-t border-stone-200 dark:border-slate-800 p-3 space-y-3">
            <SkeletonBlock className="h-3 w-24" />
            <SkeletonBlock className="h-20 w-full" />
          </div>
        </div>
      )}
    </div>
  );
}
