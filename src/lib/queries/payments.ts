import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TransactionStatus } from "@/lib/types/database";

export type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

export type TransactionsByInfraction = Record<string, TransactionRow[]>;

const TRANSACTION_COLUMNS =
  "id, infraction_id, amount, payment_method, receipt_path, submitted_by, reviewed_by, reviewed_at, rejection_reason, status, created_at, updated_at";

const INFRACTION_REVIEW_COLUMNS =
  "id, plate_number, infraction_type, fine_amount, amount_paid, driver_id, created_at";

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

export type PendingPaymentReviewRow = TransactionRow & {
  infraction: Database["public"]["Tables"]["infractions"]["Row"];
  driver_name: string | null;
};

type InfractionReviewRow = Pick<
  Database["public"]["Tables"]["infractions"]["Row"],
  | "id"
  | "plate_number"
  | "infraction_type"
  | "fine_amount"
  | "amount_paid"
  | "driver_id"
  | "created_at"
>;

export async function loadPendingPaymentReviews(
  supabase: SupabaseClient<Database>
): Promise<PendingPaymentReviewRow[]> {
  const { data: transactions, error } = await supabase
    .from("transactions")
    .select(TRANSACTION_COLUMNS)
    .eq("status", "pending")
    .order("created_at", { ascending: true });

  if (error) throw error;
  const pendingRows = (transactions ?? []) as TransactionRow[];
  if (!pendingRows.length) return [];

  const infractionIds = [...new Set(pendingRows.map((row) => row.infraction_id))];
  const driverIds = new Set<string>();

  const { data: infractions, error: infractionError } = await supabase
    .from("infractions")
    .select(INFRACTION_REVIEW_COLUMNS)
    .in("id", infractionIds);

  if (infractionError) throw infractionError;

  const infractionMap = new Map<string, InfractionReviewRow>();
  for (const row of (infractions ?? []) as InfractionReviewRow[]) {
    if (row.driver_id) driverIds.add(row.driver_id);
    infractionMap.set(row.id, row);
  }

  const { data: profiles } =
    driverIds.size > 0
      ? await supabase
          .from("profiles")
          .select("id, full_name")
          .in("id", [...driverIds])
      : { data: [] as Array<{ id: string; full_name: string | null }> };

  const driverNames = new Map(
    (profiles ?? []).map((profile) => [profile.id, profile.full_name])
  );

  return pendingRows
    .map((row) => {
      const infraction = infractionMap.get(row.infraction_id);
      if (!infraction) return null;
      return {
        ...row,
        infraction: infraction as Database["public"]["Tables"]["infractions"]["Row"],
        driver_name: infraction.driver_id
          ? driverNames.get(infraction.driver_id) ?? null
          : null,
      };
    })
    .filter((row): row is PendingPaymentReviewRow => row !== null);
}

export function primaryTransactionStatus(
  transactions: TransactionRow[] | undefined
): TransactionStatus | null {
  if (!transactions?.length) return null;
  if (transactions.some((row) => row.status === "pending")) return "pending";
  if (transactions.some((row) => row.status === "paid")) return "paid";
  return transactions[0]?.status ?? null;
}
