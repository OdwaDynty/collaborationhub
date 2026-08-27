"use server";

import { createClient } from "@/lib/supabase/server";
import { createPostSchema } from "./schema";
import { revalidatePath } from "next/cache";

type CreatePostResult = { error: string | null };

export async function createPost(
  formData: FormData
): Promise<CreatePostResult> {
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

  // Fetch the author's own permissions + department. Never trust
  // scope/department values submitted by the client alone — RLS
  // enforces this too, but checking here lets us return a clear
  // error message instead of a generic database rejection.
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

  revalidatePath("/feed");
  return { error: null };
}