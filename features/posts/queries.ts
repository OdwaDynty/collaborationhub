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
      author_id,
      author:profiles!posts_author_id_fkey ( full_name ),
      department:departments ( name )
    `
    )
    // Never return a soft-deleted post — same pattern channel_messages
    // and direct_messages already use.
    .eq("is_deleted", false)
    .order("created_at", { ascending: false })
    .limit(FEED_PAGE_SIZE);

  if (error) {
    console.error("getFeedPosts error:", error.message);
    return { posts: [], error: "Unable to load the feed. Please try again." };
  }

  // Supabase returns the raw column as `author_id`; renamed here to
  // `authorId` so the rest of the app (and the Post type) uses one
  // consistent naming convention throughout.
  type RawPostRow = {
    id: string;
    content: string;
    scope: "organization" | "department";
    created_at: string;
    author_id: string;
    author: { full_name: string };
    department: { name: string } | null;
  };

  const posts: Post[] = (data as unknown as RawPostRow[]).map((row) => ({
    id: row.id,
    content: row.content,
    scope: row.scope,
    created_at: row.created_at,
    authorId: row.author_id,
    author: row.author,
    department: row.department,
  }));

  return { posts, error: null };
}