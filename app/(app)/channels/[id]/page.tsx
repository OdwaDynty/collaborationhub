import { getChannelById, getChannelMessages } from "@/features/channels/queries";
import { MessageList } from "@/features/channels/message-list";
import { NewMessageForm } from "@/features/channels/new-message-form";
import { MarkChannelReadOnMount } from "@/features/notifications/mark-channel-read-on-mount";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

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

      <div>
        <h1 className="font-heading text-lg font-semibold text-ink"># {channel.name}</h1>
        {channel.description && (
          <p className="text-sm text-ink/50">{channel.description}</p>
        )}
      </div>

      {messagesError && <p className="text-sm text-red-600">{messagesError}</p>}

      {!messagesError && <MessageList messages={messages} />}

      {isMember ? (
        <NewMessageForm channelId={id} />
      ) : (
        <p className="text-sm text-ink/50">Join this channel to post messages.</p>
      )}
    </div>
  );
}