import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import type { Announcement, AnnouncementComment } from "@/types/announcements";
import { NewAnnouncementCommentForm } from "./new-announcement-form";
import { InlineDeleteButton } from "@/features/shared/inline-delete-button";
import { deleteAnnouncementComment } from "./actions";
import { deleteAnnouncement } from "@/features/admin/actions";
import { createClient } from "@/lib/supabase/server";

export async function AnnouncementCard({
  announcement,
  comments,
  isAdmin,
}: {
  announcement: Announcement;
  comments: AnnouncementComment[];
  // Whether the CURRENT viewer is an admin — controls whether they see
  // a delete option on this announcement at all. Unlike comments
  // (where only the comment's own author can delete it), any admin
  // can delete any announcement, since these are official company
  // communications, not personal posts.
  isAdmin: boolean;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <article className="group rounded-xl border border-hairline bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-heading text-sm font-semibold text-ink">
          {announcement.author.full_name}
        </span>
        <div className="flex shrink-0 items-center gap-2">
          <span className="rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-semibold text-brand-gold">
            {announcement.scope === "organization"
              ? "Official"
              : `Official · ${announcement.department?.name ?? "Department"}`}
          </span>
          {isAdmin && (
            <InlineDeleteButton
              deleteAction={deleteAnnouncement}
              args={[announcement.id]}
              successMessage="Announcement deleted"
            />
          )}
        </div>
      </div>
      <h3 className="mt-2 font-heading text-base font-semibold text-brand-teal-ink">
        {announcement.title}
      </h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-ink/80">
        {announcement.content}
      </p>
      <time className="mt-2 block text-xs text-ink/40">
        {new Date(announcement.created_at).toLocaleString()}
      </time>

      {announcement.event_at && (
        <Link
          href={`/api/calendar/announcement/${announcement.id}`}
          className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-brand-teal/10 px-3 py-1.5 text-xs font-medium text-brand-teal-ink transition-colors hover:bg-brand-teal/20"
        >
          <CalendarPlus className="h-3.5 w-3.5" />
          Add to Calendar — {new Date(announcement.event_at).toLocaleString(undefined, {
            month: "short",
            day: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })}
        </Link>
      )}

      {comments.length > 0 && (
        <ul className="mt-3 space-y-2 border-t border-hairline pt-3">
          {comments.map((c) => (
            <li key={c.id} className="group flex items-start justify-between gap-2 text-sm">
              <p>
                <span className="font-heading font-semibold text-ink">
                  {c.author.full_name}
                </span>{" "}
                <span className="text-ink/70">{c.content}</span>
              </p>
              {user?.id === c.authorId && (
                <InlineDeleteButton
                  deleteAction={deleteAnnouncementComment}
                  args={[c.id]}
                  successMessage="Comment deleted"
                />
              )}
            </li>
          ))}
        </ul>
      )}

      <NewAnnouncementCommentForm announcementId={announcement.id} />
    </article>
  );
}