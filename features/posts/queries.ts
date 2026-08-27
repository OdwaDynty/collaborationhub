import { createClient } from "@/lib/supabase/server";
import type { Post } from "@/types/posts";

const FEED_PAGE_SIZE = 20;

// Fetches the most recent posts visible to the current user.
// RLS already restricts rows to org-wide posts + the user's own
// department's posts — this query doesn't need to duplicate that
// filtering logic, it just asks for "posts" and trusts the database.
export async function getFeedPosts(): Promise<{
  posts: Post[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      `
      id,
      content,
      scope,
      created_at,
      author:profiles!posts_author_id_fkey ( full_name ),
      department:departments ( name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE_SIZE);

  if (error) {
    console.error("getFeedPosts error:", error.message);
    return { posts: [], error: "Unable to load the feed. Please try again." };
  }

  return { posts: (data ?? []) as unknown as Post[], error: null };
}