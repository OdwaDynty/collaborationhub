import type { DirectMessage } from "@/types/direct-messages";
import { InlineDeleteButton } from "@/features/shared/inline-delete-button";
import { deleteDirectMessage } from "./actions";

export function MessageThread({
  messages,
  currentUserId,
  conversationId,
}: {
  messages: DirectMessage[];
  currentUserId: string;
  conversationId: string;
}) {
  if (messages.length === 0) {
    return (
      <p className="text-sm text-ink/50">No messages yet. Say hello.</p>
    );
  }

  return (
    <ul className="flex flex-1 flex-col gap-2 overflow-y-auto">
      {messages.map((message) => {
        const isOwn = message.sender_id === currentUserId;
        return (
          <li key={message.id} className={`group flex ${isOwn ? "justify-end" : "justify-start"}`}>
            <div className="flex items-center gap-1">
              {/* Only the sender's OWN messages get a delete option,
                  and it's placed to the LEFT of the bubble for own
                  messages (which are right-aligned) so it doesn't
                  overlap the timestamp inside the bubble. */}
              {isOwn && (
               <InlineDeleteButton
                     deleteAction={deleteDirectMessage}
                     args={[message.id, conversationId]}
                     successMessage="Message deleted"
                  />
              )}
              <div
                className={`max-w-[75%] rounded-xl px-3 py-2 text-sm ${
                  isOwn
                    ? "bg-brand-teal text-white"
                    : "border border-hairline bg-white text-ink/90"
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
            </div>
          </li>
        );
      })}
    </ul>
  );
}