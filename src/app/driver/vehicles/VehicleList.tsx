"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Car, Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { VERIFICATION_LABELS } from "@/lib/verification";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export function VehicleList({
  vehicles,
  photoUrls,
  lastLocations,
}: {
  vehicles: Vehicle[];
  photoUrls: Record<string, string>;
  lastLocations?: Record<string, { location: string; at: string }>;
}) {
  const router = useRouter();
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this vehicle? This cannot be undone.")) return;
    setDeletingId(id);
    setError(null);
    const supabase = createClient();
    const { error: deleteError } = await supabase
      .from("vehicles")
      .delete()
      .eq("id", id);
    if (deleteError) setError(friendlyError(deleteError));
    setDeletingId(null);
    router.refresh();
  };

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {vehicles.map((v) => {
          const photo = photoUrls[v.id];
          const status = v.verification_status ?? "pending_review";
          const statusClass =
            status === "active"
              ? "badge-paid"
              : status === "rejected"
                ? "badge-unpaid"
                : "badge-pending";
          return (
            <article
              key={v.id}
              className="rounded-xl border border-stone-200 dark:border-slate-800 overflow-hidden bg-white dark:bg-slate-900"
            >
              <div className="aspect-[16/10] bg-stone-100 dark:bg-slate-800 relative">
                {photo ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={photo}
                    alt={v.plate_number}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="h-full grid place-items-center text-stone-400">
                    <Car className="h-10 w-10" />
                  </div>
                )}
                <span
                  className={`absolute top-2 right-2 ${statusClass}`}
                >
                  {VERIFICATION_LABELS[status]}
                </span>
              </div>
              <div className="p-4 space-y-2">
                <p className="font-mono font-semibold text-stone-900 dark:text-stone-100">
                  {v.plate_number}
                </p>
                <p className="text-sm text-stone-600 dark:text-slate-400">
                  {[v.brand, v.model, v.color, v.year]
                    .filter(Boolean)
                    .join(" • ") || "—"}
                </p>
                {lastLocations?.[v.id] && (
                  <p className="text-xs text-stone-500 dark:text-slate-400 flex items-start gap-1">
                    <span className="shrink-0">Last seen:</span>
                    <span>{lastLocations[v.id].location}</span>
                  </p>
                )}
                <div className="flex gap-2 text-xs">
                  <span
                    className={
                      v.insurance_status ? "badge-paid" : "badge-unpaid"
                    }
                  >
                    Insurance
                  </span>
                  <span
                    className={
                      v.inspection_status ? "badge-paid" : "badge-unpaid"
                    }
                  >
                    Inspection
                  </span>
                </div>
                <div className="pt-2 flex justify-end">
                  <Button
                    variant="danger"
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    loading={deletingId === v.id}
                    aria-label="Delete vehicle"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
