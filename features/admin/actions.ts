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

export async function archiveChannel(channelId: string): Promise<ActionResult> {
  const guard = await requireAdmin();
  if (guard.error) return guard;

  const supabase = await createClient();
  const { error } = await supabase
    .from("channels")
    .update({ is_archived: true })
    .eq("id", channelId);

  if (error) {
    console.error("archiveChannel error:", error.message);
    return { error: "Unable to archive channel." };
  }

  revalidatePath("/admin");
  revalidatePath("/channels");
  return { error: null };
}

export async function updateEmployeeProfile(
  profileId: string,
  updates: {
    job_title?: string | null;
    department_id?: string | null;
    birthday?: string | null;
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