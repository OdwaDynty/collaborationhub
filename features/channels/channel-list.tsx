import Link from "next/link";
import type { Channel } from "@/types/channels";
import { JoinLeaveButton } from "./join-leave-button";

export function ChannelList({ channels }: { channels: Channel[] }) {
  if (channels.length === 0) {
    return <p className="text-sm text-ink/50">No channels yet.</p>;
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