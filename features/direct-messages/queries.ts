import { createClient } from "@/lib/supabase/server";
import type { Conversation, DirectMessage } from "@/types/direct-messages";

// Lists the current user's conversations, newest activity first, with
// the other participant's name and whether there's anything unread.
// RLS already restricts to conversations this user is part of.
export async function getConversations(): Promise<{
  conversations: Conversation[];
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { conversations: [], error: "Not signed in." };
  }

  const { data, error } = await supabase
    .from("conversations")
    .select(
      `
      id, participant_one_id, participant_two_id,
      participant_one_last_read_at, participant_two_last_read_at,
      one:profiles!conversations_participant_one_id_fkey ( id, full_name ),
      two:profiles!conversations_participant_two_id_fkey ( id, full_name ),
      direct_messages ( content, created_at, sender_id )
    `
    )
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getConversations error:", error.message);
    return { conversations: [], error: "Unable to load conversations." };
  }

  const conversations: Conversation[] = (data ?? []).map((c) => {
    const isParticipantOne = c.participant_one_id === user.id;
    const otherParticipant = isParticipantOne ? c.two : c.one;
    const myLastReadAt = isParticipantOne
      ? c.participant_one_last_read_at
      : c.participant_two_last_read_at;

    const messages = c.direct_messages as unknown as {
      content: string;
      created_at: string;
      sender_id: string;
    }[];
    const lastMessage =
      messages.length > 0
        ? messages.reduce((a, b) => (a.created_at > b.created_at ? a : b))
        : null;

    const unread = !!(
      lastMessage &&
      lastMessage.sender_id !== user.id &&
      (!myLastReadAt || lastMessage.created_at > myLastReadAt)
    );

    return {
      id: c.id,
      other_participant: otherParticipant as unknown as {
        id: string;
        full_name: string;
      },
      last_message: lastMessage,
      unread,
    };
  });

  conversations.sort((a, b) => {
    const aTime = a.last_message?.created_at ?? "";
    const bTime = b.last_message?.created_at ?? "";
    return bTime.localeCompare(aTime);
  });

  return { conversations, error: null };
}

const MESSAGES_PAGE_SIZE = 50;

export async function getDirectMessages(conversationId: string): Promise<{
  messages: DirectMessage[];
  otherParticipant: { id: string; full_name: string } | null;
  error: string | null;
}> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: conversation, error: convError } = await supabase
    .from("conversations")
    .select(
      `
      participant_one_id, participant_two_id,
      one:profiles!conversations_participant_one_id_fkey ( id, full_name ),
      two:profiles!conversations_participant_two_id_fkey ( id, full_name )
    `
    )
    .eq("id", conversationId)
    .single();

  if (convError || !conversation) {
    return { messages: [], otherParticipant: null, error: "Conversation not found." };
  }

  const otherParticipant =
    conversation.participant_one_id === user?.id
      ? (conversation.two as unknown as { id: string; full_name: string })
      : (conversation.one as unknown as { id: string; full_name: string });

  const { data, error } = await supabase
    .from("direct_messages")
    .select("id, content, sender_id, parent_message_id, created_at")
    .eq("conversation_id", conversationId)
    .eq("is_deleted", false)
    .order("created_at", { ascending: true })
    .limit(MESSAGES_PAGE_SIZE);

  if (error) {
    console.error("getDirectMessages error:", error.message);
    return { messages: [], otherParticipant, error: "Unable to load messages." };
  }

  return { messages: data ?? [], otherParticipant, error: null };
}