import { createClient } from "@/lib/supabase/server";
import type { SearchResults } from "@/types/search";

const RESULTS_PER_TYPE = 5;

// Runs one full-text query per content type rather than a single UNION
// query. Each query goes through that table's existing RLS untouched —
// a search for "budget" only ever returns posts/channels the searcher
// could already see by browsing there directly, so there's no separate
// visibility logic to get wrong here.
export async function search(query: string): Promise<{
  results: SearchResults;
  error: string | null;
}> {
  const empty: SearchResults = { people: [], posts: [], announcements: [], channels: [] };

  const trimmed = query.trim();
  if (!trimmed) {
    return { results: empty, error: null };
  }

  const supabase = await createClient();

  const [peopleRes, postsRes, announcementsRes, channelsRes] = await Promise.all([
    supabase
      .from("profiles")
      .select("id, full_name, job_title")
      .textSearch("search_vector", trimmed, { type: "plain" })
      .limit(RESULTS_PER_TYPE),
    supabase
      .from("posts")
      .select("id, content, created_at")
      .textSearch("search_vector", trimmed, { type: "plain" })
      .order("created_at", { ascending: false })
      .limit(RESULTS_PER_TYPE),
    supabase
      .from("announcements")
      .select("id, title, created_at")
      .textSearch("search_vector", trimmed, { type: "plain" })
      .order("created_at", { ascending: false })
      .limit(RESULTS_PER_TYPE),
    supabase
      .from("channels")
      .select("id, name, description")
      .eq("is_archived", false)
      .textSearch("search_vector", trimmed, { type: "plain" })
      .limit(RESULTS_PER_TYPE),
  ]);

  const anyError =
    peopleRes.error || postsRes.error || announcementsRes.error || channelsRes.error;
  if (anyError) {
    console.error("search error:", anyError.message);
    return { results: empty, error: "Unable to complete search. Please try again." };
  }

  return {
    results: {
      people: peopleRes.data ?? [],
      posts: postsRes.data ?? [],
      announcements: announcementsRes.data ?? [],
      channels: channelsRes.data ?? [],
    },
    error: null,
  };
}