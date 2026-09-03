import Link from "next/link";
import type { Conversation } from "@/types/direct-messages";

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

export function ConversationList({ conversations }: { conversations: Conversation[] }) {
  if (conversations.length === 0) {
    return (
      <div className="rounded-xl border border-dashed border-hairline p-6 text-center">
        <p className="text-sm text-ink/50">No conversations yet.</p>
        <p className="mt-1 text-sm text-ink/50">
          Head to{" "}
          <Link href="/people" className="font-medium text-brand-teal underline">
            People
          </Link>{" "}
          to find a colleague and start one.
        </p>
      </div>
    );
  }

  return (
    <ul className="divide-y divide-hairline rounded-xl border border-hairline bg-white">
      {conversations.map((c) => {
        const tint = getAvatarTint(c.other_participant.full_name);
        return (
          <li key={c.id}>
            <Link
              href={`/messages/${c.id}`}
              className="flex items-center gap-3 p-3 transition-colors hover:bg-canvas"
            >
              <div
                className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full font-heading text-xs font-semibold ${tint.bg} ${tint.text}`}
              >
                {getInitials(c.other_participant.full_name)}
              </div>
              <div className="min-w-0 flex-1">
                <p
                  className={`font-heading text-sm ${c.unread ? "font-semibold text-ink" : "font-medium text-ink/90"}`}
                >
                  {c.other_participant.full_name}
                </p>
                {c.last_message && (
                  <p className="truncate text-sm text-ink/50">
                    {c.last_message.content}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 items-center gap-2">
                {c.last_message && (
                  <time className="text-xs text-ink/40">
                    {new Date(c.last_message.created_at).toLocaleDateString()}
                  </time>
                )}
                {c.unread && (
                  <span className="h-2 w-2 rounded-full bg-brand-gold" aria-label="Unread" />
                )}
              </div>
            </Link>
          </li>
        );
      })}
    </ul>
  );
}