import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, PaymentStatus } from "@/lib/types/database";

const MS_PER_DAY = 24 * 60 * 60 * 1000;
const ANALYTICS_WINDOW_DAYS = 90;

export type AdminInfractionRow = {
  id: string;
  plate_number: string;
  infraction_type: string;
  fine_amount: number;
  status: PaymentStatus;
  created_at: string;
  agent_id: string | null;
};

export type AdminOverviewData = {
  drivers: number;
  agents: number;
  vehicleTotal: number;
  vehicleInsured: number;
  vehicleInspected: number;
  totalInfractions: number;
  analyticsInfractions: AdminInfractionRow[];
  recentInfractions: AdminInfractionRow[];
  agentProfiles: Array<{
    id: string;
    full_name: string | null;
    email: string | null;
  }>;
  financialRows: Array<{
    fine_amount: number;
    status: PaymentStatus;
    created_at: string;
  }>;
};

export async function loadAdminOverviewData(
  supabase: SupabaseClient<Database>
): Promise<AdminOverviewData> {
  const now = Date.now();
  const cutoff90 = new Date(now - ANALYTICS_WINDOW_DAYS * MS_PER_DAY).toISOString();

  const [
    { count: drivers },
    { count: agents },
    { count: vehicleTotal },
    { count: vehicleInsured },
    { count: vehicleInspected },
    { count: totalInfractions },
    { data: analyticsInfractionRows },
    { data: recentInfractionRows },
    { data: agentProfiles },
    { data: transactionRows },
  ] = await Promise.all([
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "driver"),
    supabase
      .from("profiles")
      .select("id", { count: "exact", head: true })
      .eq("role", "agent"),
    supabase.from("vehicles").select("id", { count: "exact", head: true }),
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("insurance_status", true),
    supabase
      .from("vehicles")
      .select("id", { count: "exact", head: true })
      .eq("inspection_status", true),
    supabase.from("infractions").select("id", { count: "exact", head: true }),
    supabase
      .from("infractions")
      .select(
        "id, plate_number, infraction_type, fine_amount, status, created_at, agent_id"
      )
      .gte("created_at", cutoff90)
      .order("created_at", { ascending: false })
      .limit(500),
    supabase
      .from("infractions")
      .select(
        "id, plate_number, infraction_type, fine_amount, status, created_at, agent_id"
      )
      .order("created_at", { ascending: false })
      .limit(8),
    supabase.from("profiles").select("id, full_name, email").eq("role", "agent"),
    supabase
      .from("transactions")
      .select("infraction_id, amount, status, created_at"),
  ]);

  const mapInfraction = (row: {
    id: string;
    plate_number: string;
    infraction_type: string;
    fine_amount: number | string;
    status: PaymentStatus;
    created_at: string;
    agent_id: string | null;
  }): AdminInfractionRow => ({
    id: row.id,
    plate_number: row.plate_number,
    infraction_type: row.infraction_type,
    fine_amount: Number(row.fine_amount),
    status: row.status,
    created_at: row.created_at,
    agent_id: row.agent_id,
  });

  const analyticsInfractions = (analyticsInfractionRows ?? []).map(mapInfraction);
  const recentInfractions = (recentInfractionRows ?? []).map(mapInfraction);

  const transactionMap = new Map(
    (transactionRows ?? []).map((transaction) => [transaction.infraction_id, transaction])
  );

  const financialRows = (transactionRows ?? []).map((transaction) => ({
    fine_amount: Number(transaction.amount),
    status:
      transaction.status === "initialized"
        ? ("unpaid" as const)
        : transaction.status === "pending"
          ? ("pending" as const)
          : transaction.status === "paid"
            ? ("paid" as const)
            : ("unpaid" as const),
    created_at: transaction.created_at,
  }));

  // Include infraction-only rows (no transaction yet) for unpaid totals.
  for (const infraction of analyticsInfractions) {
    if (!transactionMap.has(infraction.id) && infraction.status === "unpaid") {
      financialRows.push({
        fine_amount: infraction.fine_amount,
        status: infraction.status,
        created_at: infraction.created_at,
      });
    }
  }

  return {
    drivers: drivers ?? 0,
    agents: agents ?? 0,
    vehicleTotal: vehicleTotal ?? 0,
    vehicleInsured: vehicleInsured ?? 0,
    vehicleInspected: vehicleInspected ?? 0,
    totalInfractions: totalInfractions ?? 0,
    analyticsInfractions,
    recentInfractions,
    agentProfiles: agentProfiles ?? [],
    financialRows,
  };
}
