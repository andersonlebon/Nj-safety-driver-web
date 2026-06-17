import { Car } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { Card, CardBody } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";
import { parseTableQuery, readPreserveParams } from "@/lib/pagination";
import { loadVehicleDirectoryPaginated } from "@/lib/queries/vehicles";
import { AdminVehiclesTable } from "../AdminVehiclesTable";
import type { Database } from "@/lib/types/database";

export const dynamic = "force-dynamic";

type Vehicle = Database["public"]["Tables"]["vehicles"]["Row"];

export default async function AdminVehiclesPage({
  searchParams,
}: {
  searchParams?: Record<string, string | string[] | undefined>;
}) {
  const supabase = createClient();
  const tableQuery = parseTableQuery(searchParams);
  const preserveParams = readPreserveParams(searchParams, ["status", "origin"]);

  const tabStatus = preserveParams.status;
  const origin = preserveParams.origin;

  const verificationStatus =
    tabStatus === "pending_review" ||
    tabStatus === "active" ||
    tabStatus === "rejected" ||
    tabStatus === "pending_documents"
      ? (tabStatus as Vehicle["verification_status"])
      : undefined;

  const pageData = await loadVehicleDirectoryPaginated(supabase, tableQuery, {
    verificationStatus,
    origin:
      origin === "foreign" || origin === "domestic" ? origin : undefined,
  });

  const statusTabs = [
    { href: buildHref(undefined, origin, tableQuery), label: "All", key: "all" },
    {
      href: buildHref("pending_review", origin, tableQuery),
      label: "Pending",
      key: "pending_review",
    },
    { href: buildHref("active", origin, tableQuery), label: "Approved", key: "active" },
    { href: buildHref("rejected", origin, tableQuery), label: "Rejected", key: "rejected" },
  ];

  const originTabs = [
    { href: buildHref(tabStatus, undefined, tableQuery), label: "All origins", key: "all" },
    { href: buildHref(tabStatus, "domestic", tableQuery), label: "Domestic", key: "domestic" },
    { href: buildHref(tabStatus, "foreign", tableQuery), label: "Foreign / transit", key: "foreign" },
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
              (tabStatus === undefined && t.key === "all") || tabStatus === t.key
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

      {pageData.error && (
        <div className="mb-4">
          <Alert variant="error">{pageData.error.message}</Alert>
        </div>
      )}

      <Card>
        <CardBody>
          <AdminVehiclesTable
            pathname="/admin/vehicles"
            query={pageData.query}
            totalCount={pageData.totalCount}
            preserveParams={preserveParams}
            showStatusFilter={!verificationStatus}
            vehicles={pageData.rows}
            ownerMap={pageData.ownerMap}
            photoUrls={pageData.photoUrls}
          />
        </CardBody>
      </Card>
    </div>
  );
}

function buildHref(
  status?: string,
  origin?: string,
  tableQuery?: ReturnType<typeof parseTableQuery>
) {
  const params = new URLSearchParams();
  if (status) params.set("status", status);
  if (origin) params.set("origin", origin);
  if (tableQuery?.q) params.set("q", tableQuery.q);
  if (tableQuery?.dateFrom) params.set("dateFrom", tableQuery.dateFrom);
  if (tableQuery?.dateTo) params.set("dateTo", tableQuery.dateTo);
  if (tableQuery && tableQuery.pageSize !== 25) {
    params.set("pageSize", String(tableQuery.pageSize));
  }
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
