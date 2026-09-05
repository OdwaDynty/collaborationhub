import type { ChannelMessage } from "@/types/channels";
import { InlineDeleteButton } from "@/features/shared/inline-delete-button";
import { deleteChannelMessage } from "./actions";
import { createClient } from "@/lib/supabase/server";

const AVATAR_TINTS = [
  { bg: "bg-brand-teal/10", text: "text-brand-teal-ink" },
  { bg: "bg-brand-gold/15", text: "text-brand-gold" },
];

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

function getAvatarTint(name: string) {
  const sum = name.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  return AVATAR_TINTS[sum % AVATAR_TINTS.length];
}

export async function MessageList({
  messages,
  channelId,
}: {
  messages: ChannelMessage[];
  channelId: string;
}) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-ink/50">No messages yet. Be the first to post.</p>
    );
  }

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <ul className="space-y-3">
      {messages.map((message) => {
        const tint = getAvatarTint(message.author.full_name);
        return (
          <li key={message.id} className="group flex items-start gap-3">
            <div
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full font-heading text-[11px] font-semibold ${tint.bg} ${tint.text}`}
            >
              {getInitials(message.author.full_name)}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline justify-between gap-2">
                <div className="flex items-baseline gap-2">
                  <span className="font-heading text-sm font-semibold text-ink">
                    {message.author.full_name}
                  </span>
                  <span className="text-xs text-ink/40">
                    {new Date(message.created_at).toLocaleString()}
                  </span>
                </div>
                {user?.id === message.authorId && (
                  <InlineDeleteButton
                     deleteAction={deleteChannelMessage}
                     args={[message.id, channelId]}
                     successMessage="Message deleted"
                   />
                )}
              </div>
              <p className="text-sm text-ink/80">{message.content}</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}