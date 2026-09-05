import Link from "next/link";
import { CalendarPlus } from "lucide-react";
import type { Announcement, AnnouncementComment } from "@/types/announcements";
import { NewAnnouncementCommentForm } from "./new-announcement-form";

export function AnnouncementCard({
  announcement,
  comments,
}: {
  announcement: Announcement;
  comments: AnnouncementComment[];
}) {
  return (
    <article className="rounded-xl border border-hairline bg-white p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="font-heading text-sm font-semibold text-ink">
          {announcement.author.full_name}
        </span>
        <span className="shrink-0 rounded-full bg-brand-gold/15 px-3 py-1 text-xs font-semibold text-brand-gold">
          {announcement.scope === "organization"
            ? "Official"
            : `Official · ${announcement.department?.name ?? "Department"}`}
        </span>
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

      {/* Only shown if this announcement actually has an event date/time
          attached — plain news announcements (event_at is null) don't
          get this button at all. Using Link here instead of a raw <a>
          tag — functionally the same for a download link, but avoids
          the tag being mangled when copied from chat. */}
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
            <li key={c.id} className="text-sm">
              <span className="font-heading font-semibold text-ink">
                {c.author.full_name}
              </span>{" "}
              <span className="text-ink/70">{c.content}</span>
            </li>
          ))}
        </ul>
      )}

      <NewAnnouncementCommentForm announcementId={announcement.id} />
    </article>
  );
}