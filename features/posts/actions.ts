"use server";

import { createClient } from "@/lib/supabase/server";
import { createPostSchema } from "./schema";
import { revalidatePath } from "next/cache";

type ActionResult = { error: string | null };

export async function createPost(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to post." };
  }

  const parsed = createPostSchema.safeParse({
    content: formData.get("content"),
    scope: formData.get("scope"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("department_id, can_post_org_wide, can_post_department")
    .eq("id", user.id)
    .single();

  if (!profile) {
    return { error: "Profile not found." };
  }

  const { content, scope } = parsed.data;

  if (scope === "organization" && !profile.can_post_org_wide) {
    return { error: "You don't have permission to post organization-wide." };
  }
  if (scope === "department" && !profile.can_post_department) {
    return { error: "You don't have permission to post to your department." };
  }

  const { error } = await supabase.from("posts").insert({
    author_id: user.id,
    content,
    scope,
    department_id: scope === "department" ? profile.department_id : null,
  });

  if (error) {
    console.error("createPost error:", error.message);
    return { error: "Unable to create post. Please try again." };
  }

  revalidatePath("/home");
  return { error: null };
}

/**
 * Soft-deletes a post the current user authored. Calls the
 * soft_delete_post() database function rather than a plain UPDATE —
 * that function itself checks the caller is the real author, so this
 * action doesn't need (and shouldn't attempt) its own permission
 * check; the database is the single source of truth for that.
 */
export async function deletePost(postId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("soft_delete_post", {
    p_post_id: postId,
  });

  if (error) {
    console.error("deletePost error:", error.message);
    // The database function raises a specific exception on a
    // permission failure — surfaced here as a plain, honest message
    // rather than a generic one, since "you don't have permission" is
    // meaningfully different from "something went wrong."
    return { error: error.message.includes("permission")
      ? "You can only delete your own posts."
      : "Unable to delete post. Please try again." };
  }

  revalidatePath("/home");
  return { error: null };
}