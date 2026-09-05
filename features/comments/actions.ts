"use server";

import { createClient } from "@/lib/supabase/server";
import { createCommentSchema } from "./schema";
import { revalidatePath } from "next/cache";

type ActionResult = { error: string | null };

export async function createComment(formData: FormData): Promise<ActionResult> {
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

  const { error } = await supabase.from("comments").insert({
    post_id: parsed.data.postId,
    author_id: user.id,
    content: parsed.data.content,
  });

  if (error) {
    console.error("createComment error:", error.message);
    return { error: "Unable to post comment. Please try again." };
  }

  revalidatePath("/home");
  return { error: null };
}

export async function deleteComment(commentId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("soft_delete_comment", {
    p_comment_id: commentId,
  });

  if (error) {
    console.error("deleteComment error:", error.message);
    return {
      error: error.message.includes("permission")
        ? "You can only delete your own comments."
        : "Unable to delete comment. Please try again.",
    };
  }

  revalidatePath("/home");
  return { error: null };
}