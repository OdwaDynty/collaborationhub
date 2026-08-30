import Link from "next/link";
import type { Conversation } from "@/types/direct-messages";

export function ConversationList({ conversations }: { conversations: Conversation[] }) {
  if (conversations.length === 0) {
    return <p className="text-sm text-zinc-500">No conversations yet.</p>;
  }

  return (
    <ul className="divide-y rounded border">
      {conversations.map((c) => (
        <li key={c.id}>
          <Link
            href={`/messages/${c.id}`}
            className="flex items-center justify-between gap-3 p-3 hover:bg-zinc-50 dark:hover:bg-zinc-900"
          >
            <div className="min-w-0">
              <p className={c.unread ? "font-semibold" : "font-medium"}>
                {c.other_participant.full_name}
              </p>
              {c.last_message && (
                <p className="truncate text-sm text-zinc-500">
                  {c.last_message.content}
                </p>
              )}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {c.last_message && (
                <time className="text-xs text-zinc-400">
                  {new Date(c.last_message.created_at).toLocaleDateString()}
                </time>
              )}
              {c.unread && (
                <span className="h-2 w-2 rounded-full bg-blue-600" aria-label="Unread" />
              )}
            </div>
          </Link>
        </li>
      ))}
    </ul>
  );
}