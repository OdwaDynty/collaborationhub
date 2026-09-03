"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Bell } from "lucide-react";
import type { NotificationSummary } from "@/types/notifications";
import { markDirectMessageNotificationsRead } from "./actions";

export function NotificationBell({ summary }: { summary: NotificationSummary }) {
  const [open, setOpen] = useState(false);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const totalCount =
    summary.directMessages.unreadCount +
    summary.channelsWithUnread.length +
    (summary.announcementsUnread ? 1 : 0);

  function handleDmClick() {
    setOpen(false);
    startTransition(async () => {
      await markDirectMessageNotificationsRead();
      router.refresh();
    });
  }

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative rounded-lg p-1.5 text-ink/60 transition-colors hover:bg-canvas hover:text-ink"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {totalCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-medium text-white">
            {totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded-xl border border-hairline bg-white text-ink shadow-lg">
          {totalCount === 0 && (
            <p className="p-3 text-sm text-ink/50">You&apos;re all caught up.</p>
          )}

          {summary.directMessages.items.length > 0 && (
            <div className="border-b border-hairline p-2">
              <p className="px-1 py-1 text-xs font-medium uppercase tracking-wide text-ink/40">
                Messages
              </p>
              {summary.directMessages.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/messages/${item.conversationId}`}
                  onClick={handleDmClick}
                  className="block truncate rounded-lg px-2 py-1.5 text-sm text-ink/80 transition-colors hover:bg-canvas"
                >
                  {item.content}
                </Link>
              ))}
            </div>
          )}

          {summary.channelsWithUnread.length > 0 && (
            <div className="border-b border-hairline p-2">
              <p className="px-1 py-1 text-xs font-medium uppercase tracking-wide text-ink/40">
                Channels
              </p>
              {summary.channelsWithUnread.map((c) => (
                <Link
                  key={c.channelId}
                  href={`/channels/${c.channelId}`}
                  onClick={() => setOpen(false)}
                  className="block rounded-lg px-2 py-1.5 text-sm text-ink/80 transition-colors hover:bg-canvas"
                >
                  New activity in # {c.name}
                </Link>
              ))}
            </div>
          )}

          {summary.announcementsUnread && (
            <div className="p-2">
              <Link
                href="/announcements"
                onClick={() => setOpen(false)}
                className="block rounded-lg px-2 py-1.5 text-sm text-ink/80 transition-colors hover:bg-canvas"
              >
                New announcement
              </Link>
            </div>
          )}
        </div>
      )}
    </div>
  );
}