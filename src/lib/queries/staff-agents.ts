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

type StaffProfileMeta = {
  profile_id: string;
  staff_role: StaffRole;
  application_status: Database["public"]["Tables"]["staff_profiles"]["Row"]["application_status"];
};

export async function loadPendingAgentApplications(
  admin: AdminClient
): Promise<PendingAgentApplication[]> {
  const { data: staffRows, error } = await admin
    .from("staff_profiles")
    .select("profile_id, application_note, badge_id, created_at")
    .eq("application_status", "pending")
    .eq("staff_role", "agent")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("loadPendingAgentApplications:", error.message);
    return [];
  }

  if (!staffRows?.length) return [];

  const typedStaffRows = staffRows as Array<{
    profile_id: string;
    application_note: string | null;
    badge_id: string | null;
    created_at: string;
  }>;

  const profileIds = typedStaffRows.map((row) => row.profile_id);
  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, email, phone")
    .in("id", profileIds);

  if (profileError) {
    console.error("loadPendingAgentApplications profiles:", profileError.message);
    return [];
  }

  const typedProfiles = (profiles ?? []) as Array<{
    id: string;
    full_name: string | null;
    email: string | null;
    phone: string | null;
  }>;

  const profileById = new Map(typedProfiles.map((profile) => [profile.id, profile]));

  return typedStaffRows.map((row) => {
    const profile = profileById.get(row.profile_id);
    return {
      staff_profile_id: row.profile_id,
      full_name: profile?.full_name ?? null,
      email: profile?.email ?? null,
      phone: profile?.phone ?? null,
      application_note: row.application_note,
      badge_id: row.badge_id,
      created_at: row.created_at,
    };
  });
}

/** Active staff directory: approved agents and all administrators. */
export async function loadStaffDirectoryPaginated(
  admin: AdminClient,
  tableQuery: TableQuery
): Promise<{ rows: StaffDirectoryRow[]; totalCount: number; query: TableQuery }> {
  const { from, to } = rangeForPage(tableQuery.page, tableQuery.pageSize);

  const { data: staffRows, error: staffError } = await admin
    .from("staff_profiles")
    .select("profile_id, staff_role, application_status")
    .or("staff_role.eq.admin,application_status.eq.approved");

  if (staffError) {
    console.error("loadStaffDirectoryPaginated staff_profiles:", staffError.message);
    return { rows: [], totalCount: 0, query: tableQuery };
  }

  const activeStaff = (staffRows ?? []) as StaffProfileMeta[];
  const activeProfileIds = activeStaff.map((row) => row.profile_id);

  if (activeProfileIds.length === 0) {
    return { rows: [], totalCount: 0, query: tableQuery };
  }

  const staffByProfileId = new Map(
    activeStaff.map((row) => [row.profile_id, row])
  );

  let query = admin
    .from("profiles")
    .select("*", { count: "exact" })
    .eq("role", "staff")
    .in("id", activeProfileIds);

  query = applyTableQueryFilters(query, tableQuery, {
    searchColumns: [{ column: "full_name" }, { column: "email" }, { column: "phone" }],
    dateColumn: "created_at",
  });

  const { data, count, error } = await query
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    console.error("loadStaffDirectoryPaginated profiles:", error.message);
    return { rows: [], totalCount: 0, query: tableQuery };
  }

  const rows = (data ?? []).map((profile) => {
    const row = profile as Database["public"]["Tables"]["profiles"]["Row"];
    const staff = staffByProfileId.get(row.id);
    return {
      ...row,
      staff_role: staff?.staff_role ?? "agent",
      application_status: staff?.application_status ?? null,
    };
  });

  return {
    rows,
    totalCount: count ?? rows.length,
    query: tableQuery,
  };
}
