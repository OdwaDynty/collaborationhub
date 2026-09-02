import { createClient } from "@/lib/supabase/server";
import type { AdminEmployee, AuditEvent, Department } from "@/types/admin";

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