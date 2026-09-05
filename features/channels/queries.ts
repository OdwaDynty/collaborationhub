import { createClient } from "@/lib/supabase/server";
import type { Channel, ChannelMessage } from "@/types/channels";

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
      id, content, parent_message_id, created_at, author_id,
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

  type RawRow = {
    id: string;
    content: string;
    parent_message_id: string | null;
    created_at: string;
    author_id: string;
    author: { full_name: string };
  };

  const messages: ChannelMessage[] = (data as unknown as RawRow[]).map((row) => ({
    id: row.id,
    content: row.content,
    parent_message_id: row.parent_message_id,
    created_at: row.created_at,
    authorId: row.author_id,
    author: row.author,
  }));

  return { messages, error: null };
}

export async function getChannelById(channelId: string): Promise<{
  channel: Pick<Channel, "id" | "name" | "description" | "visibility" | "is_archived"> | null;
  isMember: boolean;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: channel, error } = await supabase
    .from("channels")
    // is_archived added — the channel detail page needs this to
    // decide whether to show the composer or a read-only banner.
    .select("id, name, description, visibility, is_archived")
    .eq("id", channelId)
    .single();

  if (error || !channel) {
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