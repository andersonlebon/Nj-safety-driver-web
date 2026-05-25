import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { formatDate } from "@/lib/utils";
import { signDocumentPaths } from "@/lib/storage-urls";
import { VehicleVerificationActions } from "../VehicleVerificationActions";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams?: { status?: string };
}) {
  const supabase = createClient();
  const filter = searchParams?.status;

  let query = supabase.from("vehicles").select("*").order("created_at", {
    ascending: false,
  });

  if (
    filter === "pending_review" ||
    filter === "active" ||
    filter === "rejected" ||
    filter === "pending_documents"
  ) {
    query = query.eq("verification_status", filter);
  }

  const { data: vehicles, error } = await query;

  const ownerIds = [...new Set((vehicles ?? []).map((v) => v.owner_id))];
  const { data: owners } =
    ownerIds.length > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name, email")
          .in("id", ownerIds)
      : { data: [] as { id: string; full_name: string | null; email: string | null }[] };

  const ownerMap = Object.fromEntries(
    (owners ?? []).map((o) => [o.id, o])
  );

  const vehicleIds = (vehicles ?? []).map((v) => v.id);
  const { data: photos } =
    vehicleIds.length > 0
      ? await supabase
          .from("documents")
          .select("vehicle_id, file_path")
          .in("vehicle_id", vehicleIds)
          .eq("doc_type", "vehicle_photo")
          .eq("label", "front")
      : { data: [] as { vehicle_id: string | null; file_path: string }[] };

  const photoByVehicle: Record<string, string> = {};
  for (const p of photos ?? []) {
    if (p.vehicle_id) photoByVehicle[p.vehicle_id] = p.file_path;
  }

  const signed = await signDocumentPaths(Object.values(photoByVehicle));

  const tabs = [
    { href: "/admin/vehicles", label: "All" },
    { href: "/admin/vehicles?status=pending_review", label: "Pending" },
    { href: "/admin/vehicles?status=active", label: "Approved" },
    { href: "/admin/vehicles?status=rejected", label: "Rejected" },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Review every registered vehicle and its verification status."
      />

      <div className="flex flex-wrap gap-2 mb-4">
        {tabs.map((t) => (
          <a
            key={t.href}
            href={t.href}
            className={`rounded-full px-3 py-1 text-xs font-medium border transition-colors ${
              (filter === undefined && t.href === "/admin/vehicles") ||
              t.href.endsWith(`status=${filter}`)
                ? "bg-brand-600 text-white border-brand-600"
                : "border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800"
            }`}
          >
            {t.label}
          </a>
        ))}
      </div>

      {error && (
        <div className="mb-4">
          <Alert variant="error">{error.message}</Alert>
        </div>
      )}

      <Card>
        <CardBody>
          {!vehicles || vehicles.length === 0 ? (
            <EmptyState
              icon={<Car className="h-8 w-8" />}
              title="No vehicles"
              description="Vehicles registered by drivers will appear here."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="text-left text-stone-500 dark:text-slate-400 border-b border-stone-200 dark:border-slate-800">
                  <tr>
                    <th className="py-2 pr-4 font-medium">Photo</th>
                    <th className="py-2 pr-4 font-medium">Plate</th>
                    <th className="py-2 pr-4 font-medium">Vehicle</th>
                    <th className="py-2 pr-4 font-medium">Owner</th>
                    <th className="py-2 pr-4 font-medium">Insurance</th>
                    <th className="py-2 pr-4 font-medium">Inspection</th>
                    <th className="py-2 pr-4 font-medium">Registered</th>
                    <th className="py-2 pr-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {vehicles.map((v: Vehicle) => {
                    const owner = ownerMap[v.owner_id];
                    const photoPath = photoByVehicle[v.id];
                    const photoUrl = photoPath ? signed[photoPath] : null;
                    return (
                      <tr
                        key={v.id}
                        className="border-b border-stone-100 dark:border-slate-800 last:border-0"
                      >
                        <td className="py-2 pr-4">
                          {photoUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img
                              src={photoUrl}
                              alt=""
                              className="h-12 w-16 rounded-lg object-cover border border-stone-200 dark:border-slate-700"
                            />
                          ) : (
                            <div className="h-12 w-16 rounded-lg bg-stone-100 dark:bg-slate-800 grid place-items-center text-stone-400">
                              <Car className="h-5 w-5" />
                            </div>
                          )}
                        </td>
                        <td className="py-2 pr-4 font-mono font-medium text-stone-900 dark:text-stone-100">
                          {v.plate_number}
                        </td>
                        <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                          {[v.brand, v.model, v.color, v.year]
                            .filter(Boolean)
                            .join(" • ") || "—"}
                        </td>
                        <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                          {owner?.full_name || owner?.email || "—"}
                        </td>
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
                        <td className="py-2 pr-4 text-stone-700 dark:text-slate-300">
                          {formatDate(v.created_at)}
                        </td>
                        <td className="py-2 pr-4">
                          <VehicleVerificationActions
                            vehicleId={v.id}
                            status={v.verification_status ?? "pending_review"}
                          />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardBody>
      </Card>
    </div>
  );
}
