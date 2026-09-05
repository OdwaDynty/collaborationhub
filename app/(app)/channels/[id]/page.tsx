import { getChannelById, getChannelMessages } from "@/features/channels/queries";
import { MessageList } from "@/features/channels/message-list";
import { NewMessageForm } from "@/features/channels/new-message-form";
import { MarkChannelReadOnMount } from "@/features/notifications/mark-channel-read-on-mount";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { Archive } from "lucide-react";

export default async function ChannelDetailPage({
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

  const { channel, isMember, error: channelError } = await getChannelById(id);

  if (channelError || !channel) {
    return (
      <div className="mx-auto w-full max-w-2xl p-6">
        <p className="text-sm text-red-600">{channelError ?? "Channel not found."}</p>
      </div>
    );
  }

  const { messages, error: messagesError } = await getChannelMessages(id);

  return (
    <div className="mx-auto flex w-full max-w-2xl flex-col gap-4 p-6">
      <MarkChannelReadOnMount channelId={id} />

      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-teal">
          <span className="font-heading text-base font-semibold text-white">#</span>
        </div>
        <div>
          <h1 className="font-heading text-lg font-semibold text-ink">{channel.name}</h1>
          {channel.description && (
            <p className="text-sm text-ink/50">{channel.description}</p>
          )}
        </div>
      </div>

      {/* An archived channel is intentionally still fully readable —
          history stays available for reference — but visitors get a
          clear, honest signal that it's no longer active, and the
          composer below is replaced entirely rather than just
          disabled, so there's no ambiguity about whether posting is
          still possible. */}
      {channel.is_archived && (
        <div className="flex items-center gap-2 rounded-xl border border-dashed border-hairline bg-canvas px-4 py-3">
          <Archive className="h-4 w-4 shrink-0 text-ink/40" />
          <p className="text-sm text-ink/50">
            This channel has been archived. You can still read its history, but no new messages or files can be added.
          </p>
        </div>
      )}

      {messagesError && <p className="text-sm text-red-600">{messagesError}</p>}

      {!messagesError && <MessageList messages={messages} channelId={id} />}

      {channel.is_archived ? null : isMember ? (
        <NewMessageForm channelId={id} />
      ) : (
        <p className="text-sm text-ink/50">Join this channel to post messages.</p>
      )}
    </div>
  );
}