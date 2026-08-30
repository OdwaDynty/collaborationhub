"use server";

import { createClient } from "@/lib/supabase/server";
import {
  createAnnouncementSchema,
  createAnnouncementCommentSchema,
} from "./schema";
import { revalidatePath } from "next/cache";

export async function createAnnouncement(
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const parsed = createAnnouncementSchema.safeParse({
    title: formData.get("title"),
    content: formData.get("content"),
    scope: formData.get("scope"),
    department_id: formData.get("department_id") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("can_create_announcements")
    .eq("id", user.id)
    .single();

  if (!profile?.can_create_announcements) {
    return { error: "You don't have permission to create announcements." };
  }

  if (parsed.data.scope === "department" && !parsed.data.department_id) {
    return { error: "Select a department for a department-scoped announcement." };
  }

  const { error } = await supabase.from("announcements").insert({
    author_id: user.id,
    title: parsed.data.title,
    content: parsed.data.content,
    scope: parsed.data.scope,
    department_id: parsed.data.scope === "department" ? parsed.data.department_id : null,
  });

  if (error) {
    console.error("createAnnouncement error:", error.message);
    return { error: "Unable to create announcement. Please try again." };
  }

  revalidatePath("/announcements");
  return { error: null };
}

export async function createAnnouncementComment(
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to comment." };
  }

  const parsed = createAnnouncementCommentSchema.safeParse({
    announcementId: formData.get("announcementId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("announcement_comments").insert({
    announcement_id: parsed.data.announcementId,
    author_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    console.error("createAnnouncementComment error:", error.message);
    return { error: "Unable to post comment. Please try again." };
  }

  revalidatePath("/announcements");
  return { error: null };
}