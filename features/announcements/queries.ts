import { createClient } from "@/lib/supabase/server";
import type { Announcement, AnnouncementComment } from "@/types/announcements";

const ANNOUNCEMENTS_PAGE_SIZE = 20;

export async function getAnnouncements(): Promise<{
  announcements: Announcement[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcements")
    .select(
      `
      id, title, content, scope, created_at, event_at,
      author:profiles!announcements_author_id_fkey ( full_name ),
      department:departments ( name )
    `
    )
    .order("created_at", { ascending: false })
    .limit(ANNOUNCEMENTS_PAGE_SIZE);

  if (error) {
    console.error("getAnnouncements error:", error.message);
    return {
      announcements: [],
      error: "Unable to load announcements. Please try again.",
    };
  }

  return { announcements: (data ?? []) as unknown as Announcement[], error: null };
}

export async function getCommentsForAnnouncements(
  announcementIds: string[]
): Promise<Record<string, AnnouncementComment[]>> {
  if (announcementIds.length === 0) return {};

  const supabase = await createClient();

  const { data, error } = await supabase
    .from("announcement_comments")
    .select(
      `
      id, content, created_at, announcement_id, author_id,
      author:profiles!announcement_comments_author_id_fkey ( full_name )
    `
    )
    .in("announcement_id", announcementIds)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getCommentsForAnnouncements error:", error.message);
    return {};
  }

  type RawRow = {
    id: string;
    content: string;
    created_at: string;
    announcement_id: string;
    author_id: string;
    author: { full_name: string };
  };

  const grouped: Record<string, AnnouncementComment[]> = {};
  for (const row of data as unknown as RawRow[]) {
    const comment: AnnouncementComment = {
      id: row.id,
      content: row.content,
      created_at: row.created_at,
      authorId: row.author_id,
      author: row.author,
    };
    grouped[row.announcement_id] = grouped[row.announcement_id] ?? [];
    grouped[row.announcement_id].push(comment);
  }
  return grouped;
}