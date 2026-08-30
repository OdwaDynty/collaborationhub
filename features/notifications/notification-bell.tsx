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
        className="relative rounded p-1.5 hover:bg-zinc-100 dark:hover:bg-zinc-900"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {totalCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-medium text-white">
            {totalCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-10 mt-2 w-72 rounded border bg-white shadow-lg dark:bg-zinc-950">
          {totalCount === 0 && (
            <p className="p-3 text-sm text-zinc-500">You&apos;re all caught up.</p>
          )}

          {summary.directMessages.items.length > 0 && (
            <div className="border-b p-2">
              <p className="px-1 py-1 text-xs font-medium text-zinc-500">Messages</p>
              {summary.directMessages.items.map((item) => (
                <Link
                  key={item.id}
                  href={`/messages/${item.conversationId}`}
                  onClick={handleDmClick}
                  className="block truncate rounded px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
                >
                  {item.content}
                </Link>
              ))}
            </div>
          )}

          {summary.channelsWithUnread.length > 0 && (
            <div className="border-b p-2">
              <p className="px-1 py-1 text-xs font-medium text-zinc-500">Channels</p>
              {summary.channelsWithUnread.map((c) => (
                <Link
                  key={c.channelId}
                  href={`/channels/${c.channelId}`}
                  onClick={() => setOpen(false)}
                  className="block rounded px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
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
                className="block rounded px-2 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
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