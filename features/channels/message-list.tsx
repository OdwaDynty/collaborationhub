import type { ChannelMessage } from "@/types/channels";

export function MessageList({ messages }: { messages: ChannelMessage[] }) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-zinc-500">
        No messages yet. Be the first to post.
      </p>
    );
  }

  return (
    <ul className="space-y-3">
      {messages.map((message) => (
        <li key={message.id} className="text-sm">
          <span className="font-medium">{message.author.full_name}</span>{" "}
          <span className="text-xs text-zinc-400">
            {new Date(message.created_at).toLocaleString()}
          </span>
          <p className="text-zinc-800 dark:text-zinc-200">{message.content}</p>
        </li>
      ))}
    </ul>
  );
}