import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database, StaffRole } from "@/lib/types/database";
import type { TableQuery } from "@/lib/pagination";
import { rangeForPage } from "@/lib/pagination";
import { applyTableQueryFilters } from "@/lib/queries/table-filters";

type AdminClient = SupabaseClient<Database>;

export type PendingAgentApplication = {
  staff_profile_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  application_note: string | null;
  badge_id: string | null;
  created_at: string;
};

export type StaffDirectoryRow = Database["public"]["Tables"]["profiles"]["Row"] & {
  staff_role: StaffRole;
  application_status: Database["public"]["Tables"]["staff_profiles"]["Row"]["application_status"];
};

type ProfileJoinRow = Database["public"]["Tables"]["profiles"]["Row"] & {
  staff_profiles: {
    staff_role: StaffRole;
    application_status: Database["public"]["Tables"]["staff_profiles"]["Row"]["application_status"];
  };
};

export async function loadPendingAgentApplications(
  admin: AdminClient
): Promise<PendingAgentApplication[]> {
  const { data, error } = await admin
    .from("staff_profiles")
    .select(
      "profile_id, application_note, badge_id, created_at, profiles!inner(full_name, email, phone)"
    )
    .eq("application_status", "pending")
    .eq("staff_role", "agent")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadPendingAgentApplications:", error.message);
    return [];
  }

  return (data ?? []).map((row) => {
    const entry = row as {
      profile_id: string;
      application_note: string | null;
      badge_id: string | null;
      created_at: string;
      profiles: {
        full_name: string | null;
        email: string | null;
        phone: string | null;
      };
    };
    return {
      staff_profile_id: entry.profile_id,
      full_name: entry.profiles.full_name,
      email: entry.profiles.email,
      phone: entry.profiles.phone,
      application_note: entry.application_note,
      badge_id: entry.badge_id,
      created_at: entry.created_at,
    };
  });
}

/** Active staff directory: approved agents and all administrators. */
export async function loadStaffDirectoryPaginated(
  admin: AdminClient,
  tableQuery: TableQuery
): Promise<{ rows: StaffDirectoryRow[]; totalCount: number; query: TableQuery }> {
  const { from, to } = rangeForPage(tableQuery.page, tableQuery.pageSize);

  let query = admin
    .from("profiles")
    .select("*, staff_profiles!inner(staff_role, application_status)", {
      count: "exact",
    })
    .eq("role", "staff")
    .or("staff_role.eq.admin,application_status.eq.approved", {
      referencedTable: "staff_profiles",
    });

  query = applyTableQueryFilters(query, tableQuery, {
    searchColumns: [{ column: "full_name" }, { column: "email" }, { column: "phone" }],
    dateColumn: "created_at",
  });

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("loadStaffDirectoryPaginated:", error.message);
    return { rows: [], totalCount: 0, query: tableQuery };
  }

  const rows = (data ?? []).map((row) => {
    const joined = row as ProfileJoinRow;
    return {
      ...joined,
      staff_role: joined.staff_profiles.staff_role,
      application_status: joined.staff_profiles.application_status,
    };
  });

  return {
    rows,
    totalCount: count ?? rows.length,
    query: tableQuery,
  };
}
