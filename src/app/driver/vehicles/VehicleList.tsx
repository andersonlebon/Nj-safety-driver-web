"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trash2 } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { friendlyError } from "@/lib/errors";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import type { Database } from "@/lib/types/database";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export function VehicleList({ vehicles }: { vehicles: Vehicle[] }) {
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
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 pr-4 font-medium">Plate</th>
              <th className="py-2 pr-4 font-medium">Vehicle</th>
              <th className="py-2 pr-4 font-medium">Year</th>
              <th className="py-2 pr-4 font-medium">Insurance</th>
              <th className="py-2 pr-4 font-medium">Inspection</th>
              <th className="py-2 pr-4 font-medium"></th>
            </tr>
          </thead>
          <tbody>
            {vehicles.map((v) => (
              <tr key={v.id} className="border-b border-slate-100 last:border-0">
                <td className="py-2 pr-4 font-medium text-slate-900">
                  {v.plate_number}
                </td>
                <td className="py-2 pr-4 text-slate-700">
                  {[v.brand, v.model, v.color].filter(Boolean).join(" • ") || "—"}
                </td>
                <td className="py-2 pr-4 text-slate-700">{v.year ?? "—"}</td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      v.insurance_status ? "badge-paid" : "badge-unpaid"
                    }
                  >
                    {v.insurance_status ? "Valid" : "Missing"}
                  </span>
                </td>
                <td className="py-2 pr-4">
                  <span
                    className={
                      v.inspection_status ? "badge-paid" : "badge-unpaid"
                    }
                  >
                    {v.inspection_status ? "Valid" : "Missing"}
                  </span>
                </td>
                <td className="py-2 pr-4 text-right">
                  <Button
                    variant="danger"
                    type="button"
                    onClick={() => handleDelete(v.id)}
                    loading={deletingId === v.id}
                    aria-label="Delete vehicle"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
