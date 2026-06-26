import { createClient } from "@/lib/supabase/client";
import { loadTransactionsByInfractionIds } from "@/lib/queries/payments";
import type { Database } from "@/lib/types/database";

type TransactionRow = Database["public"]["Tables"]["transactions"]["Row"];

export async function fetchTransactionsForInfraction(
  infractionId: string
): Promise<TransactionRow[]> {
  const supabase = createClient();
  const grouped = await loadTransactionsByInfractionIds(supabase, [infractionId]);
  return grouped[infractionId] ?? [];
}
