"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = { error: string | null };

async function requireAdmin(): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  if (data?.role !== "admin") {
    return { error: "You don't have permission to do this." };
  }
  return { error: null };
}

export async function updateEmployeePermissions(
  profileId: string,
  updates: {
    role?: "employee" | "admin";
    can_post_org_wide?: boolean;
    can_post_department?: boolean;
    can_create_announcements?: boolean;
    can_create_channels?: boolean;
  }
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(updates).eq("id", profileId);

  if (error) {
    console.error("updateEmployeePermissions error:", error.message);
    return { error: "Unable to update employee. Please try again." };
  }

  revalidatePath("/admin");
  return { error: null };
}

export async function toggleEmployeeActive(
  profileId: string,
  isActive: boolean
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("profiles")
    .update({ is_active: isActive })
    .eq("id", profileId);

  if (error) {
    console.error("toggleEmployeeActive error:", error.message);
    return { error: "Unable to update employee status." };
  }

  revalidatePath("/admin");
  return { error: null };
}


export async function updateEmployeeProfile(
  profileId: string,
  updates: {
    job_title?: string | null;
    department_id?: string | null;
    birthday?: string | null;
    // New field, added for the Calendar work-anniversary feature.
    // Follows the exact same optional-nullable shape as birthday.
    start_date?: string | null;
  }
): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update(updates).eq("id", profileId);

  if (error) {
    console.error("updateEmployeeProfile error:", error.message);
    return { error: "Unable to update profile. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/people");
  return { error: null };
}

/**
 * Soft-deletes an announcement. Any admin can do this, not just the
 * original author — these are official company communications, so
 * responsibility for taking one down belongs to the admin role itself,
 * not tied to whoever happened to write it.
 */
export async function deleteAnnouncement(announcementId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("announcements")
    .update({ is_deleted: true })
    .eq("id", announcementId);

  if (error) {
    console.error("deleteAnnouncement error:", error.message);
    return { error: "Unable to delete announcement. Please try again." };
  }

  revalidatePath("/announcements");
  return { error: null };
}

/**
 * Revokes an API key by calling the revoke_api_key() database
 * function, rather than a plain requireAdmin() + update like the rest
 * of this file — api_keys has no RLS grants for authenticated users
 * at all, so the permission check has to live inside the function
 * itself (it also handles its own audit logging, since there's no
 * natural existing trigger on this table to hook into).
 */
export async function revokeApiKey(keyId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("revoke_api_key", { p_key_id: keyId });

  if (error) {
    console.error("revokeApiKey error:", error.message);
    return { error: error.message.includes("Admin access")
      ? "You don't have permission to do this."
      : "Unable to revoke key. It may already be revoked." };
  }

  revalidatePath("/admin");
  return { error: null };
}

/**
 * Creates a standalone company event (a holiday, an all-hands) —
 * feeds into the Calendar (Phase 2). Uses the same requireAdmin()
 * pattern as everything else in this file for consistency, backed by
 * the company_events_insert_by_admin RLS policy as the real
 * enforcement either way.
 */
export async function createCompanyEvent(formData: FormData): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const title = (formData.get("title") as string)?.trim();
  const description = (formData.get("description") as string)?.trim() || null;
  const eventDate = formData.get("event_date") as string;

  if (!title || !eventDate) {
    return { error: "Title and date are required." };
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { error } = await supabase.from("company_events").insert({
    title,
    description,
    event_date: eventDate,
    created_by: user!.id,
  });

  if (error) {
    console.error("createCompanyEvent error:", error.message);
    return { error: "Unable to create event. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/calendar");
  return { error: null };
}

export async function deleteCompanyEvent(eventId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { error } = await supabase.from("company_events").delete().eq("id", eventId);

  if (error) {
    console.error("deleteCompanyEvent error:", error.message);
    return { error: "Unable to delete event. Please try again." };
  }

  revalidatePath("/admin");
  revalidatePath("/calendar");
  return { error: null };
}