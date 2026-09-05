import { Megaphone } from "lucide-react";
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

      {/* Same "icon in a circle + headline + helpful sentence" pattern
          already used on Channels/Files/Messages — this was the one
          page in that family still showing a bare gray sentence. */}
      {!error && announcements.length === 0 && (
        <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-hairline bg-white py-10 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/10">
            <Megaphone className="h-5 w-5 text-brand-teal-ink" />
          </div>
          <p className="text-sm font-medium text-ink">No announcements yet</p>
          <p className="max-w-xs text-sm text-ink/50">
            Official company and department news will appear here once published.
          </p>
        </div>
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