import { getDirectMessages } from "@/features/direct-messages/queries";
import { MarkReadOnMount } from "@/features/direct-messages/mark-read-on-mount";
import { MessageThread } from "@/features/direct-messages/message-thread";
import { NewMessageForm } from "@/features/direct-messages/new-message-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

function getInitials(name: string) {
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase();
}

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

      <div className="flex items-center gap-3 border-b border-hairline pb-3">
        <Link
          href="/messages"
          aria-label="Back to messages"
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-canvas hover:text-brand-teal"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-teal/10 font-heading text-xs font-semibold text-brand-teal-ink">
          {getInitials(otherParticipant.full_name)}
        </div>
        <h1 className="font-heading text-base font-semibold text-ink">
          {otherParticipant.full_name}
        </h1>
      </div>

      <MessageThread messages={messages} currentUserId={user!.id} />

      <NewMessageForm conversationId={id} />
    </div>
  );
}