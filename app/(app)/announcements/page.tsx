import { getAnnouncements, getCommentsForAnnouncements } from "@/features/announcements/queries";
import { AnnouncementCard } from "@/features/announcements/announcement-card";
import { NewAnnouncementForm } from "@/features/announcements/new-announcement-form";
import { MarkAnnouncementsReadOnMount } from "@/features/notifications/mark-announcements-read-on-mount";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export default async function AnnouncementsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("can_create_announcements")
    .eq("id", user!.id)
    .single();

  const { data: departments } = await supabase
    .from("departments")
    .select("id, name")
    .order("name");

  const { announcements, error } = await getAnnouncements();
  const commentsByAnnouncement = await getCommentsForAnnouncements(
    announcements.map((a) => a.id)
  );

  return (
    <div className="mx-auto w-full max-w-2xl space-y-4 p-6">
      <MarkAnnouncementsReadOnMount />

      {profile?.can_create_announcements && (
        <NewAnnouncementForm departments={departments ?? []} />
      )}

      {error && <p className="text-sm text-red-600">{error}</p>}

      {!error && announcements.length === 0 && (
        <p className="text-sm text-ink/50">No announcements yet.</p>
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