import { createClient } from "@/lib/supabase/server";
import type { Channel, ChannelMessage } from "@/types/channels";

// Fetches channels visible to the current user (public + ones they're a
// member of, per RLS) along with whether they're already a member —
// used to decide whether to show "Join" or "Open" in the UI.
export async function getChannels(): Promise<{
  channels: Channel[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data, error } = await supabase
    .from("channels")
    .select(
      `
      id, name, description, visibility, created_by, created_at,
      channel_members ( profile_id )
    `
    )
    .eq("is_archived", false)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getChannels error:", error.message);
    return { channels: [], error: "Unable to load channels." };
  }

  const channels = (data ?? []).map((c) => ({
    id: c.id,
    name: c.name,
    description: c.description,
    visibility: c.visibility,
    created_by: c.created_by,
    created_at: c.created_at,
    is_member: c.channel_members.some((m) => m.profile_id === user?.id),
  })) as Channel[];

  return { channels, error: null };
}

const MESSAGES_PAGE_SIZE = 50;

export async function getChannelMessages(channelId: string): Promise<{
  messages: ChannelMessage[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("channel_messages")
    .select(
      `
      id, content, parent_message_id, created_at,
      author:profiles!channel_messages_author_id_fkey ( full_name )
    `
    )
    .eq("channel_id", channelId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(MESSAGES_PAGE_SIZE);

  if (error) {
    console.error("getChannelMessages error:", error.message);
    return { messages: [], error: "Unable to load messages. You may not be a member." };
  }

  return { messages: (data ?? []) as unknown as ChannelMessage[], error: null };
}

// Add this function to the existing features/channels/queries.ts

export async function getChannelById(channelId: string): Promise<{
  channel: (Channel extends never ? never : Pick<Channel, "id" | "name" | "description" | "visibility">) | null;
  isMember: boolean;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: channel, error } = await supabase
    .from("channels")
    .select("id, name, description, visibility")
    .eq("id", channelId)
    .single();

  if (error || !channel) {
    // RLS returns no row for private channels the user isn't in —
    // same "not found" path whether it truly doesn't exist or is hidden.
    return { channel: null, isMember: false, error: "Channel not found." };
  }

  const { data: membership } = await supabase
    .from("channel_members")
    .select("profile_id")
    .eq("channel_id", channelId)
    .eq("profile_id", user?.id ?? "")
    .maybeSingle();

  return { channel, isMember: !!membership, error: null };
}