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
      id, title, content, scope, created_at,
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
      id, content, created_at, announcement_id,
      author:profiles!announcement_comments_author_id_fkey ( full_name )
    `
    )
    .in("announcement_id", announcementIds)
    .order("created_at", { ascending: true });

  if (error) {
    console.error("getCommentsForAnnouncements error:", error.message);
    return {};
  }

  const grouped: Record<string, AnnouncementComment[]> = {};
  for (const row of data as unknown as (AnnouncementComment & { announcement_id: string })[]) {
    grouped[row.announcement_id] = grouped[row.announcement_id] ?? [];
    grouped[row.announcement_id].push(row);
  }
  return grouped;
}