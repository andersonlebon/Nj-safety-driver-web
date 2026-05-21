"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { Alert } from "@/components/ui/Alert";
import { Button } from "@/components/ui/Button";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { formatCurrency, formatDate } from "@/lib/utils";
import type { Database, PaymentStatus } from "@/lib/types/database";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

export function InfractionsTable({
  infractions,
}: {
  infractions: Infraction[];
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const updateStatus = async (id: string, status: PaymentStatus) => {
    setBusyId(id);
    setError(null);
    const supabase = createClient();
    const { error: updateError } = await supabase
      .from("infractions")
      .update({ status })
      .eq("id", id);
    if (updateError) setError(updateError.message);
    setBusyId(null);
    router.refresh();
  };

  const viewEvidence = async (path: string) => {
    const supabase = createClient();
    const { data, error: signError } = await supabase.storage
      .from("evidence")
      .createSignedUrl(path, 60);
    if (signError) {
      setError(signError.message);
      return;
    }
    if (data?.signedUrl) window.open(data.signedUrl, "_blank");
  };

  return (
    <div className="space-y-3">
      {error && <Alert variant="error">{error}</Alert>}
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="text-left text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-2 pr-4 font-medium">Date</th>
              <th className="py-2 pr-4 font-medium">Plate</th>
              <th className="py-2 pr-4 font-medium">Type</th>
              <th className="py-2 pr-4 font-medium">Location</th>
              <th className="py-2 pr-4 font-medium">Amount</th>
              <th className="py-2 pr-4 font-medium">Status</th>
              <th className="py-2 pr-4 font-medium">Evidence</th>
            </tr>
          </thead>
          <tbody>
            {infractions.map((i) => (
              <tr key={i.id} className="border-b border-slate-100 last:border-0 align-top">
                <td className="py-2 pr-4 text-slate-700 whitespace-nowrap">
                  {formatDate(i.created_at)}
                </td>
                <td className="py-2 pr-4 font-medium text-slate-900">
                  {i.plate_number}
                </td>
                <td className="py-2 pr-4 text-slate-700">
                  {i.infraction_type}
                  {i.description && (
                    <span className="block text-xs text-slate-500 mt-0.5">
                      {i.description}
                    </span>
                  )}
                </td>
                <td className="py-2 pr-4 text-slate-700">{i.location || "—"}</td>
                <td className="py-2 pr-4 text-slate-700">
                  {formatCurrency(Number(i.fine_amount))}
                </td>
                <td className="py-2 pr-4">
                  <div className="flex items-center gap-2">
                    <StatusBadge status={i.status} />
                    <select
                      className="input py-1 text-xs"
                      value={i.status}
                      disabled={busyId === i.id}
                      onChange={(e) =>
                        updateStatus(i.id, e.target.value as PaymentStatus)
                      }
                    >
                      <option value="unpaid">Unpaid</option>
                      <option value="pending">Pending</option>
                      <option value="paid">Paid</option>
                    </select>
                  </div>
                </td>
                <td className="py-2 pr-4">
                  {i.evidence_path ? (
                    <Button
                      type="button"
                      variant="secondary"
                      onClick={() => viewEvidence(i.evidence_path as string)}
                    >
                      <Eye className="h-4 w-4" /> View
                    </Button>
                  ) : (
                    <span className="text-slate-400 text-xs">None</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
