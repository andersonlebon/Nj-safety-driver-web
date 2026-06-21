import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TransactionStatus } from "@/lib/types/database";
import {
  paginatedResult,
  rangeForPage,
  type PaginatedResult,
  type TableQuery,
} from "@/lib/pagination";
import { applyTableQueryFilters } from "@/lib/queries/table-filters";
import {
  loadTransactionsByInfractionIds,
  primaryTransactionStatus,
} from "@/lib/queries/payments";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

const INFRACTION_LIST_COLUMNS =
  "id, plate_number, registration_country, infraction_type, description, location, fine_amount, amount_paid, payment_transaction_count, status, evidence_path, agent_id, driver_id, vehicle_id, created_at, updated_at";

export type InfractionsPageData = PaginatedResult<Infraction> & {
  transactionStatusByInfraction: Record<string, TransactionStatus>;
};

export async function loadInfractionsPaginated(
  supabase: SupabaseClient<Database>,
  tableQuery: TableQuery,
  options?: {
    agentId?: string;
    driverId?: string;
  }
): Promise<InfractionsPageData> {
  const { from, to } = rangeForPage(tableQuery.page, tableQuery.pageSize);

  let query = supabase
    .from("infractions")
    .select(INFRACTION_LIST_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false });

  if (options?.agentId) query = query.eq("agent_id", options.agentId);
  if (options?.driverId) query = query.eq("driver_id", options.driverId);

  if (tableQuery.status === "pending") {
    query = query.eq("status", "pending");
  } else if (tableQuery.status === "initialized") {
    query = query.eq("status", "unpaid");
  } else if (tableQuery.status === "paid" || tableQuery.status === "unpaid") {
    query = query.eq("status", tableQuery.status);
  }

  query = applyTableQueryFilters(query, tableQuery, {
    searchColumns: [
      { column: "plate_number" },
      { column: "infraction_type" },
      { column: "location" },
      { column: "description" },
    ],
    dateColumn: "created_at",
  });

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const rows = (data ?? []) as Infraction[];
  const infractionIds = rows.map((row) => row.id);
  const transactionsByInfraction = await loadTransactionsByInfractionIds(
    supabase,
    infractionIds
  );

  const transactionStatusByInfraction = Object.fromEntries(
    Object.entries(transactionsByInfraction).map(([infractionId, transactions]) => [
      infractionId,
      primaryTransactionStatus(transactions) ?? ("unpaid" as TransactionStatus),
    ])
  );

  return {
    ...paginatedResult(rows, count ?? 0, tableQuery),
    transactionStatusByInfraction,
  };
}

export async function loadTransactionsForInfractionIds(
  supabase: SupabaseClient<Database>,
  infractionIds: string[]
): Promise<Record<string, TransactionStatus>> {
  const grouped = await loadTransactionsByInfractionIds(supabase, infractionIds);
  return Object.fromEntries(
    Object.entries(grouped).map(([infractionId, transactions]) => [
      infractionId,
      primaryTransactionStatus(transactions) ?? ("unpaid" as TransactionStatus),
    ])
  );
}

/** @deprecated Use loadInfractionsPaginated for list pages. */
export async function loadInfractionsWithTransactions(
  supabase: SupabaseClient<Database>,
  options?: {
    agentId?: string;
    driverId?: string;
    limit?: number;
  }
): Promise<{
  infractions: Infraction[];
  transactionStatusByInfraction: Record<string, TransactionStatus>;
}> {
  const result = await loadInfractionsPaginated(
    supabase,
    { page: 1, pageSize: options?.limit ?? 500, q: "", status: "", dateFrom: "", dateTo: "" },
    options
  );
  return {
    infractions: result.rows,
    transactionStatusByInfraction: result.transactionStatusByInfraction,
  };
}
