import { getDirectMessages } from "@/features/direct-messages/queries";
import { MarkReadOnMount } from "@/features/direct-messages/mark-read-on-mount";
import { MessageThread } from "@/features/direct-messages/message-thread";
import { NewMessageForm } from "@/features/direct-messages/new-message-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";

export default async function ConversationPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect("/login");
  }

  const { messages, otherParticipant, error } = await getDirectMessages(id);

  if (error || !otherParticipant) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <p className="text-sm text-red-600">{error ?? "Conversation not found."}</p>
      </div>
    );
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] w-full max-w-2xl flex-col gap-3 p-6">
      <MarkReadOnMount conversationId={id} />

      <div>
        <Link href="/messages" className="text-xs text-ink/50 underline">
          ← Back to messages
        </Link>
        <h1 className="font-heading text-lg font-semibold text-ink">
          {otherParticipant.full_name}
        </h1>
      </div>

      <MessageThread messages={messages} currentUserId={user!.id} />

      <NewMessageForm conversationId={id} />
    </div>
  );
}