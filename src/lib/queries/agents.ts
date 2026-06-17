import type { SupabaseClient } from "@supabase/supabase-js";
import {
  paginatedResult,
  rangeForPage,
  type PaginatedResult,
  type TableQuery,
} from "@/lib/pagination";
import { applyTableQueryFilters } from "@/lib/queries/table-filters";
import type { Database } from "@/lib/types/database";

type Profile = Database["public"]["Tables"]["profiles"]["Row"];

export async function loadAgentsPaginated(
  supabase: SupabaseClient<Database>,
  tableQuery: TableQuery
): Promise<PaginatedResult<Profile>> {
  const { from, to } = rangeForPage(tableQuery.page, tableQuery.pageSize);

  let query = supabase
    .from("profiles")
    .select("*", { count: "exact" })
    .in("role", ["agent", "admin"])
    .order("created_at", { ascending: false });

  query = applyTableQueryFilters(query, tableQuery, {
    searchColumns: [{ column: "full_name" }, { column: "email" }, { column: "phone" }],
    dateColumn: "created_at",
  });

  const { data, count, error } = await query.range(from, to);
  if (error) throw error;

  return paginatedResult((data ?? []) as Profile[], count ?? 0, tableQuery);
}
