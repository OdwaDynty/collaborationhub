"use server";

import { createClient } from "@/lib/supabase/server";
import { sendMessageSchema } from "./schema";
import { revalidatePath } from "next/cache";

type ActionResult = { error: string | null; conversationId?: string };

// Finds an existing 1:1 conversation with otherProfileId, or creates one.
// Sorts the two ids before insert to satisfy conversations_participants_ordered —
// callers never need to know or care about the ordering rule.
export async function findOrCreateConversation(
  otherProfileId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }
  if (user.id === otherProfileId) {
    return { error: "You can't message yourself." };
  }

  const [participantOne, participantTwo] = [user.id, otherProfileId].sort();

  const { data: existing } = await supabase
    .from("conversations")
    .select("id")
    .eq("participant_one_id", participantOne)
    .eq("participant_two_id", participantTwo)
    .maybeSingle();

  if (existing) {
    return { error: null, conversationId: existing.id };
  }

  const { data: created, error } = await supabase
    .from("conversations")
    .insert({
      participant_one_id: participantOne,
      participant_two_id: participantTwo,
    })
    .select("id")
    .single();

  if (error || !created) {
    console.error("findOrCreateConversation error:", error?.message);
    return { error: "Unable to start conversation. Please try again." };
  }

  return { error: null, conversationId: created.id };
}

export async function sendDirectMessage(
  conversationId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to send a message." };
  }

  const parsed = sendMessageSchema.safeParse({
    content: formData.get("content"),
    parent_message_id: formData.get("parent_message_id") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("direct_messages").insert({
    conversation_id: conversationId,
    sender_id: user.id,
    content: parsed.data.content,
    parent_message_id: parsed.data.parent_message_id ?? null,
  });

  if (error) {
    console.error("sendDirectMessage error:", error.message);
    return { error: "Unable to send message. You may not be a participant." };
  }

  revalidatePath(`/messages/${conversationId}`);
  revalidatePath("/messages");
  return { error: null };
}

export async function markConversationRead(
  conversationId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("mark_conversation_read", {
    p_conversation_id: conversationId,
  });

  if (error) {
    console.error("markConversationRead error:", error.message);
    return { error: "Unable to update read status." };
  }

  revalidatePath("/messages");
  return { error: null };
}

export async function markConversationNotificationsRead(
  conversationId: string
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("notifications")
    .update({ read_at: new Date().toISOString() })
    .eq("profile_id", user.id)
    .eq("type", "direct_message")
    .eq("conversation_id", conversationId)
    .is("read_at", null);

  if (error) {
    console.error("markConversationNotificationsRead error:", error.message);
    return { error: "Unable to update notifications." };
  }

  revalidatePath("/", "layout");
  return { error: null };
}