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
      author_id,
      author:profiles!comments_author_id_fkey ( full_name )
    `
    )
    .in("post_id", postIds)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getCommentsForPosts error:", error.message);
    return {};
  }

  type RawCommentRow = {
    id: string;
    content: string;
    created_at: string;
    post_id: string;
    author_id: string;
    author: { full_name: string };
  };

  const grouped: Record<string, Comment[]> = {};
  for (const row of data as unknown as RawCommentRow[]) {
    const comment: Comment = {
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      authorId: row.author_id,
      author: row.author,
    };
    grouped[row.post_id] = grouped[row.post_id] ?? [];
    grouped[row.post_id].push(comment);
  }
  return grouped;
}