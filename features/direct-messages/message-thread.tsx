import type { DirectMessage } from "@/types/direct-messages";

export function MessageThread({
  messages,
  currentUserId,
}: {
  messages: DirectMessage[];
  currentUserId: string;
}) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No messages yet. Say hello.
      </p>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
      {messages.map((message) => {
        const isOwn = message.sender_id === currentUserId;
        return (
          <li
            key={message.id}
            className={`flex ${isOwn ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[75%] rounded px-3 py-2 text-sm ${
                isOwn
                  ? "bg-zinc-900 text-white dark:bg-zinc-50 dark:text-zinc-900"
                  : "border text-zinc-800 dark:text-zinc-200"
              }`}
            >
              <p className="whitespace-pre-wrap">{message.content}</p>
              <time className="mt-1 block text-right text-[10px] opacity-70">
                {new Date(message.created_at).toLocaleTimeString([], {
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </time>
            </div>
          </li>
        );
      })}
    </ul>
  );
}