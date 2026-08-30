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
    <article className="rounded border p-4">
      <div className="flex items-center justify-between text-sm text-zinc-500">
        <span className="font-medium text-zinc-900 dark:text-zinc-100">
          {announcement.author.full_name}
        </span>
        <span className="rounded bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-950 dark:text-amber-300">
          {announcement.scope === "organization"
            ? "Official"
            : `Official · ${announcement.department?.name ?? "Department"}`}
        </span>
      </div>
      <h3 className="mt-2 font-semibold text-zinc-900 dark:text-zinc-100">
        {announcement.title}
      </h3>
      <p className="mt-1 whitespace-pre-wrap text-sm text-zinc-800 dark:text-zinc-200">
        {announcement.content}
      </p>
      <time className="mt-2 block text-xs text-zinc-400">
        {new Date(announcement.created_at).toLocaleString()}
      </time>

      {comments.length > 0 && (
        <ul className="mt-3 space-y-2 border-t pt-3">
          {comments.map((c) => (
            <li key={c.id} className="text-sm">
              <span className="font-medium">{c.author.full_name}</span>{" "}
              <span className="text-zinc-700 dark:text-zinc-300">
                {c.content}
              </span>
            </li>
          ))}
        </ul>
      )}

      <NewAnnouncementCommentForm announcementId={announcement.id} />
    </article>
  );
}