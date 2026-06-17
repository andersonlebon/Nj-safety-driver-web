import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { EmptyState } from "@/components/ui/EmptyState";
import { Alert } from "@/components/ui/Alert";
import { signDocumentPaths } from "@/lib/storage-urls";
import { loadVehicleDirectoryPageData } from "@/lib/queries/vehicles";
import { AdminVehiclesTable } from "../AdminVehiclesTable";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams?: { status?: string; origin?: string };
}) {
  const supabase = createClient();
  const filter = searchParams?.status;
  const origin = searchParams?.origin;

  const verificationStatus =
    filter === "pending_review" ||
    filter === "active" ||
    filter === "rejected" ||
    filter === "pending_documents"
      ? (filter as Vehicle["verification_status"])
      : undefined;

  const { vehicles, ownerMap, photoUrls, error } =
    await loadVehicleDirectoryPageData(supabase, {
      verificationStatus,
      origin:
        origin === "foreign" || origin === "domestic" ? origin : undefined,
    });

  const statusTabs = [
    { href: buildHref(undefined, origin), label: "All", key: "all" },
    {
      href: buildHref("pending_review", origin),
      label: "Pending",
      key: "pending_review",
    },
    { href: buildHref("active", origin), label: "Approved", key: "active" },
    { href: buildHref("rejected", origin), label: "Rejected", key: "rejected" },
  ];

  const originTabs = [
    { href: buildHref(filter, undefined), label: "All origins", key: "all" },
    { href: buildHref(filter, "domestic"), label: "Domestic", key: "domestic" },
    { href: buildHref(filter, "foreign"), label: "Foreign / transit", key: "foreign" },
  ];

  return (
    <div>
      <PageHeader
        title="Vehicles"
        description="Review every registered vehicle and its verification status."
      />

      <div className="flex flex-wrap gap-2 mb-3">
        {statusTabs.map((t) => (
          <a
            key={t.key}
            href={t.href}
            className={tabClass(
              (filter === undefined && t.key === "all") || filter === t.key
            )}
          >
            {t.label}
          </a>
        ))}
      </div>

      <div className="flex flex-wrap gap-2 mb-4">
        {originTabs.map((t) => (
          <a
            key={t.key}
            href={t.href}
            className={tabClass(
              (origin === undefined && t.key === "all") || origin === t.key,
              true
            )}
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
            <AdminVehiclesTable
              vehicles={vehicles as Vehicle[]}
              ownerMap={ownerMap}
              photoUrls={photoUrls}
            />
          )}
        </CardBody>
      </Card>
    </div>
  );
}

function buildHref(status?: string, origin?: string) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (origin) params.set("origin", origin);
  const q = params.toString();
  return q ? `/admin/vehicles?${q}` : "/admin/vehicles";
}

function tabClass(active: boolean, muted?: boolean) {
  const base =
    "rounded-full px-3 py-1 text-xs font-medium border transition-colors";
  if (active) {
    return `${base} bg-brand-600 text-white border-brand-600`;
  }
  if (muted) {
    return `${base} border-stone-200 dark:border-slate-700 text-stone-500 dark:text-slate-400 hover:bg-stone-100 dark:hover:bg-slate-800`;
  }
  return `${base} border-stone-200 dark:border-slate-700 text-stone-600 dark:text-slate-300 hover:bg-stone-100 dark:hover:bg-slate-800`;
}
