import { getAnnouncements, getCommentsForAnnouncements } from "@/features/announcements/queries";
import { AnnouncementCard } from "@/features/announcements/announcement-card";
import { NewAnnouncementForm } from "@/features/announcements/new-announcement-form";
import { createClient } from "@/lib/supabase/server";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("can_create_announcements")
    .eq("id", user!.id)
    .single();

  const { announcements, error } = await getAnnouncements();
  const commentsByAnnouncement = await getCommentsForAnnouncements(
    announcements.map((a) => a.id)
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-3 p-6">
      {profile?.can_create_announcements && <NewAnnouncementForm />}

      {error && (
        <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
      )}

      {!error && announcements.length === 0 && (
        <p className="text-sm text-zinc-500">No announcements yet.</p>
      )}

      {announcements.map((a) => (
        <AnnouncementCard
          key={a.id}
          announcement={a}
          comments={commentsByAnnouncement[a.id] ?? []}
        />
      ))}
    </div>
  );
}