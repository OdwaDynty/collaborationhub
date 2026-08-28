"use server";

import { createClient } from "@/lib/supabase/server";
import { createCommentSchema } from "./schema";
import { revalidatePath } from "next/cache";

export async function createComment(
  formData: FormData
): Promise<{ error: string | null }> {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to comment." };
  }

  const parsed = createCommentSchema.safeParse({
    postId: formData.get("postId"),
    content: formData.get("content"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // RLS also enforces that the post must be visible to this user —
  // this insert will be silently rejected by the database if not.
  const { error } = await supabase.from("comments").insert({
    post_id: parsed.data.postId,
    author_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    console.error("createComment error:", error.message);
    return { error: "Unable to post comment. Please try again." };
  }

  revalidatePath("/feed");
  return { error: null };
}