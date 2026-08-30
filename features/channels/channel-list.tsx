import Link from "next/link";
import type { Channel } from "@/types/channels";
import { JoinLeaveButton } from "./join-leave-button";

export function ChannelList({ channels }: { channels: Channel[] }) {
  if (channels.length === 0) {
    return <p className="text-sm text-zinc-500">No channels yet.</p>;
  }

  return (
    <ul className="divide-y rounded border">
      {channels.map((channel) => (
        <li
          key={channel.id}
          className="flex items-center justify-between gap-3 p-3"
        >
          <div className="min-w-0">
            {channel.is_member ? (
              <Link
                href={`/channels/${channel.id}`}
                className="font-medium underline"
              >
                # {channel.name}
              </Link>
            ) : (
              <span className="font-medium"># {channel.name}</span>
            )}
            {channel.description && (
              <p className="truncate text-sm text-zinc-500">
                {channel.description}
              </p>
            )}
            {channel.visibility === "private" && (
              <span className="text-xs text-zinc-400">Private</span>
            )}
          </div>

          <JoinLeaveButton channelId={channel.id} isMember={channel.is_member} />
        </li>
      ))}
    </ul>
  );
}