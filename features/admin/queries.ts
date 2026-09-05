import { createClient } from "@/lib/supabase/server";
import type { AdminEmployee, AuditEvent, Department, ApiKey } from "@/types/admin";


// Every function here assumes the caller has already verified the
// current user is an admin at the page level — RLS is the real
// enforcement (profiles_update_by_admin, audit_events_select_admin),
// this is just for a clean UI error instead of an empty result.

export async function isCurrentUserAdmin(): Promise<boolean> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return false;

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  return data?.role === "admin";
}

export async function getEmployeesForAdmin(): Promise<{
  employees: AdminEmployee[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("profiles")
    .select(
      `
      id, full_name, job_title, department_id, birthday, role, is_active,
      can_post_org_wide, can_post_department,
      can_create_announcements, can_create_channels
    `
    )
    .order("full_name");

  if (error) {
    console.error("getEmployeesForAdmin error:", error.message);
    return { employees: [], error: "Unable to load employees." };
  }

  return { employees: (data ?? []) as AdminEmployee[], error: null };
}

const AUDIT_PAGE_SIZE = 30;

export async function getAuditEvents(): Promise<{
  events: AuditEvent[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("audit_events")
    .select(
      `
      id, action, target_type, target_id, metadata, created_at,
      actor:profiles!audit_events_actor_id_fkey ( full_name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(AUDIT_PAGE_SIZE);

  if (error) {
    console.error("getAuditEvents error:", error.message);
    return { events: [], error: "Unable to load audit log." };
  }

  return { events: (data ?? []) as unknown as AuditEvent[], error: null };
}

export async function getDepartmentsForAdmin(): Promise<{
  departments: Department[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("departments")
    .select(
      `
      id, name,
      business_unit:business_units ( name, country:countries ( name ) )
    `
    )
    .order("name");

  if (error) {
    console.error("getDepartmentsForAdmin error:", error.message);
    return { departments: [], error: "Unable to load departments." };
  }

  const departments: Department[] = (data ?? []).map((d) => {
    const bu = d.business_unit as unknown as { name: string; country: { name: string } | null };
    return {
      id: d.id,
      name: d.name,
      business_unit_name: bu?.name ?? "",
      country_name: bu?.country?.name ?? "",
    };
  });

  return { departments, error: null };
}

/**
 * Lists every currently active (not-yet-archived) channel, for the
 * Admin page's channel management section. Only shows active
 * channels — an already-archived one has nothing further an admin
 * needs to do to it here.
 */
export async function getActiveChannelsForAdmin(): Promise<{
  channels: { id: string; name: string; visibility: "public" | "private" }[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("channels")
    .select("id, name, visibility")
    .eq("is_archived", false)
    .order("name");

  if (error) {
    console.error("getActiveChannelsForAdmin error:", error.message);
    return { channels: [], error: "Unable to load channels." };
  }

  return { channels: data ?? [], error: null };
}

/**
 * Lists every currently archived channel, so Admin can show an
 * "Unarchive" option for each — the counterpart to
 * getActiveChannelsForAdmin above.
 */
export async function getArchivedChannelsForAdmin(): Promise<{
  channels: { id: string; name: string; visibility: "public" | "private" }[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("channels")
    .select("id, name, visibility")
    .eq("is_archived", true)
    .order("name");

  if (error) {
    console.error("getArchivedChannelsForAdmin error:", error.message);
    return { channels: [], error: "Unable to load archived channels." };
  }

  return { channels: data ?? [], error: null };
}

/**
 * Lists every API key for the Admin page's revocation UI. Calls the
 * get_api_keys_for_admin() database function rather than querying the
 * api_keys table directly — that table has no RLS policies granting
 * authenticated users anything at all, admin or not, so a plain
 * .from("api_keys").select() here would simply return nothing. The
 * function also deliberately never returns key_hash — there's no
 * legitimate reason this UI needs to see it.
 */
export async function getApiKeysForAdmin(): Promise<{
  keys: ApiKey[];
  error: string | null;
}> {
  const supabase = await createClient();
  const { data, error } = await supabase.rpc("get_api_keys_for_admin");

  if (error) {
    console.error("getApiKeysForAdmin error:", error.message);
    return { keys: [], error: "Unable to load API keys." };
  }

  return { keys: (data ?? []) as ApiKey[], error: null };
}