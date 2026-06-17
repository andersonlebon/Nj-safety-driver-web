import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, TransactionStatus } from "@/lib/types/database";

type Infraction = Database["public"]["Tables"]["infractions"]["Row"];

const INFRACTION_LIST_COLUMNS =
  "id, plate_number, registration_country, infraction_type, description, location, fine_amount, status, evidence_path, agent_id, driver_id, vehicle_id, created_at";

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
  let query = supabase
    .from("infractions")
    .select(INFRACTION_LIST_COLUMNS)
    .order("created_at", { ascending: false });

  if (options?.agentId) {
    query = query.eq("agent_id", options.agentId);
  }
  if (options?.driverId) {
    query = query.eq("driver_id", options.driverId);
  }
  if (options?.limit) {
    query = query.limit(options.limit);
  }

  const { data: infractions, error } = await query;
  if (error) throw error;

  const rows = (infractions ?? []) as Infraction[];
  const infractionIds = rows.map((row) => row.id);

  const { data: transactions } =
    infractionIds.length > 0
      ? await supabase
          .from("transactions")
          .select("infraction_id, status")
          .in("infraction_id", infractionIds)
      : { data: [] };

  const transactionStatusByInfraction = Object.fromEntries(
    (transactions ?? []).map((transaction) => [
      transaction.infraction_id,
      transaction.status as TransactionStatus,
    ])
  );

  return { infractions: rows, transactionStatusByInfraction };
}

export async function loadTransactionsForInfractionIds(
  supabase: SupabaseClient<Database>,
  infractionIds: string[]
): Promise<Record<string, TransactionStatus>> {
  if (infractionIds.length === 0) return {};

  const { data: transactions } = await supabase
    .from("transactions")
    .select("infraction_id, status")
    .in("infraction_id", infractionIds);

  return Object.fromEntries(
    (transactions ?? []).map((transaction) => [
      transaction.infraction_id,
      transaction.status as TransactionStatus,
    ])
  );
}
