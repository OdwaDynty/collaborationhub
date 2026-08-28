import { createClient } from "@/lib/supabase/server";
import type { Comment } from "@/types/comments";

export async function getCommentsForPosts(
  postIds: string[]
): Promise<Record<string, Comment[]>> {
  if (postIds.length === 0) return {};

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("comments")
    .select(
      `
      id,
      content,
      created_at,
      post_id,
      author:profiles!comments_author_id_fkey ( full_name )
    `
    )
    .in("post_id", postIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getCommentsForPosts error:", error.message);
    return {};
  }

  const grouped: Record<string, Comment[]> = {};
  for (const row of data as unknown as (Comment & { post_id: string })[]) {
    grouped[row.post_id] = grouped[row.post_id] ?? [];
    grouped[row.post_id].push(row);
  }
  return grouped;
}