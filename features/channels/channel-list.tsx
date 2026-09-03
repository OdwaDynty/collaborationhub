import Link from "next/link";
import { Hash } from "lucide-react";
import type { Channel } from "@/types/channels";
import { JoinLeaveButton } from "./join-leave-button";

export function ChannelList({ channels }: { channels: Channel[] }) {
  if (channels.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-hairline bg-white py-10 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-teal/10">
          <Hash className="h-5 w-5 text-brand-teal-ink" />
        </div>
        <p className="text-sm font-medium text-ink">No channels yet</p>
        <p className="max-w-xs text-sm text-ink/50">
          Create one above to start a space for your team.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
      {channels.map((channel) => (
        <li key={channel.id} className="flex items-center justify-between gap-3 p-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal">
              <span className="font-heading text-sm font-semibold text-white">#</span>
            </div>
            <div className="min-w-0">
              {channel.is_member ? (
                <Link
                  href={`/channels/${channel.id}`}
                  className="font-heading text-sm font-semibold text-ink hover:underline"
                >
                  {channel.name}
                </Link>
              ) : (
                <span className="font-heading text-sm font-semibold text-ink">
                  {channel.name}
                </span>
              )}
              {channel.description && (
                <p className="truncate text-sm text-ink/50">{channel.description}</p>
              )}
              {channel.visibility === "private" && (
                <span className="text-xs text-brand-gold">Private</span>
              )}
            </div>
          </div>

          <JoinLeaveButton channelId={channel.id} isMember={channel.is_member} />
        </li>
      ))}
    </ul>
  );
}