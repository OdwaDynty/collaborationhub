import { Hash } from "lucide-react";
import { ChannelArchiveButton } from "./channel-archive-button";

type AdminChannel = { id: string; name: string; visibility: "public" | "private" };

export function ChannelListAdmin({
  channels,
  mode,
}: {
  channels: AdminChannel[];
  mode: "archive" | "unarchive";
}) {
  if (channels.length === 0) {
    return (
      <p className="text-sm text-ink/50">
        {mode === "archive" ? "No active channels." : "No archived channels."}
      </p>
    );
  }

  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
      {channels.map((channel) => (
        <li key={channel.id} className="flex items-center justify-between gap-3 p-3">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-brand-teal">
              <Hash className="h-4 w-4 text-white" />
            </div>
            <div>
              <p className="font-heading text-sm font-semibold text-ink">
                {channel.name}
              </p>
              {channel.visibility === "private" && (
                <span className="text-xs text-brand-gold">Private</span>
              )}
            </div>
          </div>
          <ChannelArchiveButton channelId={channel.id} mode={mode} />
        </li>
      ))}
    </ul>
  );
}