import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TransactionStatus } from "@/lib/types/database";
import {
  applyTableQueryFilters,
} from "@/lib/queries/table-filters";
import {
  escapeIlike,
  paginatedResult,
  rangeForPage,
  type PaginatedResult,
  type TableQuery,
} from "@/lib/pagination";

export type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

export type TransactionsByInfraction = Record<string, TransactionRow[]>;

const TRANSACTION_COLUMNS =
  "id, infraction_id, amount, payment_method, receipt_path, submitted_by, reviewed_by, reviewed_at, rejection_reason, status, created_at, updated_at";

const INFRACTION_REVIEW_COLUMNS =
  "id, plate_number, registration_country, infraction_type, description, location, fine_amount, amount_paid, payment_transaction_count, status, driver_id, created_at";

type InfractionReviewRow = {
  id: string;
  plate_number: string;
  registration_country?: string | null;
  infraction_type: string;
  description: string | null;
  location: string | null;
  fine_amount: string;
  amount_paid: string;
  payment_transaction_count: number;
  status: Database["public"]["Tables"]["infractions"]["Row"]["status"];
  driver_id: string | null;
  created_at: string;
};

export type StaffPaymentRow = TransactionRow & {
  infraction: InfractionReviewRow;
  driver_name: string | null;
  submitter_name: string | null;
  reviewer_name: string | null;
};

export type StaffPaymentsPageData = PaginatedResult<StaffPaymentRow>;

async function resolveInfractionIdsForPaymentSearch(
  supabase: SupabaseClient<Database>,
  term: string
): Promise<string[]> {
  const escaped = escapeIlike(term);

  const [infractionMatches, driverMatches] = await Promise.all([
    supabase
      .from("infractions")
      .select("id")
      .or(
        `plate_number.ilike.%${escaped}%,infraction_type.ilike.%${escaped}%,location.ilike.%${escaped}%`
      ),
    supabase
      .from("profiles")
      .select("id")
      .eq("role", "driver")
      .ilike("full_name", `%${escaped}%`),
  ]);

  if (infractionMatches.error) throw infractionMatches.error;
  if (driverMatches.error) throw driverMatches.error;

  const ids = new Set<string>();
  for (const row of infractionMatches.data ?? []) {
    ids.add((row as { id: string }).id);
  }

  const driverIds = (driverMatches.data ?? []).map(
    (row) => (row as { id: string }).id
  );
  if (driverIds.length > 0) {
    const { data: byDriver, error } = await supabase
      .from("infractions")
      .select("id")
      .in("driver_id", driverIds);
    if (error) throw error;
    for (const row of byDriver ?? []) {
      ids.add((row as { id: string }).id);
    }
  }

  return [...ids];
}

async function enrichPaymentRows(
  supabase: SupabaseClient<Database>,
  transactions: TransactionRow[]
): Promise<StaffPaymentRow[]> {
  if (!transactions.length) return [];

  const infractionIds = [...new Set(transactions.map((row) => row.infraction_id))];
  const profileIds = new Set<string>();

  const { data: infractions, error: infractionError } = await supabase
    .from("infractions")
    .select(INFRACTION_REVIEW_COLUMNS)
    .in("id", infractionIds);

  if (infractionError) throw infractionError;

  const infractionMap = new Map<string, InfractionReviewRow>();
  for (const row of (infractions ?? []) as InfractionReviewRow[]) {
    if (row.driver_id) profileIds.add(row.driver_id);
    infractionMap.set(row.id, row);
  }

  for (const row of transactions) {
    if (row.submitted_by) profileIds.add(row.submitted_by);
    if (row.reviewed_by) profileIds.add(row.reviewed_by);
  }

  const { data: profiles } =
    profileIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", [...profileIds])
      : { data: [] as Array<{ id: string; full_name: string | null }> };

  const profileNames = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name])
  );

  return transactions
    .map((row) => {
      const infraction = infractionMap.get(row.infraction_id);
      if (!infraction) return null;
      return {
        ...row,
        infraction,
        driver_name: infraction.driver_id
          ? profileNames.get(infraction.driver_id) ?? null
          : null,
        submitter_name: row.submitted_by
          ? profileNames.get(row.submitted_by) ?? null
          : null,
        reviewer_name: row.reviewed_by
          ? profileNames.get(row.reviewed_by) ?? null
          : null,
      };
    })
    .filter((row): row is StaffPaymentRow => row !== null);
}

export async function loadStaffPaymentsPaginated(
  supabase: SupabaseClient<Database>,
  tableQuery: TableQuery
): Promise<StaffPaymentsPageData> {
  if (tableQuery.q) {
    const infractionIds = await resolveInfractionIdsForPaymentSearch(
      supabase,
      tableQuery.q
    );
    if (infractionIds.length === 0) {
      return paginatedResult([], 0, tableQuery);
    }

    const { from, to } = rangeForPage(tableQuery.page, tableQuery.pageSize);
    let query = supabase
      .from("transactions")
      .select(TRANSACTION_COLUMNS, { count: "exact" })
      .in("infraction_id", infractionIds)
      .order("created_at", { ascending: false });

    if (tableQuery.status) {
      query = query.eq("status", tableQuery.status);
    }

    query = applyTableQueryFilters(query, tableQuery, {
      dateColumn: "created_at",
    });

    const { data, count, error } = await query.range(from, to);
    if (error) throw error;

    const rows = await enrichPaymentRows(
      supabase,
      (data ?? []) as TransactionRow[]
    );
    return paginatedResult(rows, count ?? 0, tableQuery);
  }

  const { from, to } = rangeForPage(tableQuery.page, tableQuery.pageSize);
  let query = supabase
    .from("transactions")
    .select(TRANSACTION_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false });

  if (tableQuery.status) {
    query = query.eq("status", tableQuery.status);
  }

  query = applyTableQueryFilters(query, tableQuery, {
    dateColumn: "created_at",
  });

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  const rows = await enrichPaymentRows(supabase, (data ?? []) as TransactionRow[]);
  return paginatedResult(rows, count ?? 0, tableQuery);
}

export async function loadTransactionsByInfractionIds(
  supabase: SupabaseClient<Database>,
  infractionIds: string[]
): Promise<TransactionsByInfraction> {
  if (infractionIds.length === 0) return {};

  const { data, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_COLUMNS)
    .in("infraction_id", infractionIds)
    .order("created_at", { ascending: false });

  if (error) throw error;

  const rows = (data ?? []) as TransactionRow[];
  const grouped: TransactionsByInfraction = {};
  for (const row of rows) {
    const list = grouped[row.infraction_id] ?? [];
    list.push(row);
    grouped[row.infraction_id] = list;
  }
  return grouped;
}

/** @deprecated Use loadStaffPaymentsPaginated with status=pending filter. */
export type PendingPaymentReviewRow = StaffPaymentRow;

/** @deprecated Use loadStaffPaymentsPaginated with status=pending filter. */
export async function loadPendingPaymentReviews(
  supabase: SupabaseClient<Database>
): Promise<StaffPaymentRow[]> {
  const result = await loadStaffPaymentsPaginated(supabase, {
    page: 1,
    pageSize: 500,
    q: "",
    status: "pending",
    dateFrom: "",
    dateTo: "",
  });
  return result.rows;
}

export function primaryTransactionStatus(
  transactions: TransactionRow[] | undefined
): TransactionStatus | null {
  if (!transactions?.length) return null;
  if (transactions.some((row) => row.status === "pending")) return "pending";
  if (transactions.some((row) => row.status === "paid")) return "paid";
  return transactions[0]?.status ?? null;
}
