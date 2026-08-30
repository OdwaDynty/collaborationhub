"use server";

import { createClient } from "@/lib/supabase/server";
import { createChannelSchema, postChannelMessageSchema } from "./schema";
import { revalidatePath } from "next/cache";

type ActionResult = { error: string | null };

export async function createChannel(formData: FormData): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to create a channel." };
  }

  const parsed = createChannelSchema.safeParse({
    name: formData.get("name"),
    description: formData.get("description") || undefined,
    visibility: formData.get("visibility"),
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  // Check permission here for a clear error message — RLS enforces
  // it too, but a raw insert rejection isn't user-friendly.
  const { data: profile } = await supabase
    .from("profiles")
    .select("can_create_channels")
    .eq("id", user.id)
    .single();

  if (!profile?.can_create_channels) {
    return { error: "You don't have permission to create channels." };
  }

  const { data: channel, error } = await supabase
    .from("channels")
    .insert({
      name: parsed.data.name,
      description: parsed.data.description ?? null,
      visibility: parsed.data.visibility,
      created_by: user.id,
    })
    .select("id")
    .single();

  if (error || !channel) {
    console.error("createChannel error:", error?.message);
    return { error: "Unable to create channel. Please try again." };
  }

  // Creator auto-joins as channel admin.
  const { error: memberError } = await supabase.from("channel_members").insert({
    channel_id: channel.id,
    profile_id: user.id,
    role: "admin",
  });

  if (memberError) {
    console.error("createChannel auto-join error:", memberError.message);
  }

  revalidatePath("/channels");
  return { error: null };
}

export async function joinChannel(channelId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to join a channel." };
  }

  const { error } = await supabase.from("channel_members").insert({
    channel_id: channelId,
    profile_id: user.id,
  });

  if (error) {
    console.error("joinChannel error:", error.message);
    return { error: "Unable to join channel. It may be private." };
  }

  revalidatePath("/channels");
  return { error: null };
}

export async function leaveChannel(channelId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { error } = await supabase
    .from("channel_members")
    .delete()
    .eq("channel_id", channelId)
    .eq("profile_id", user.id);

  if (error) {
    console.error("leaveChannel error:", error.message);
    return { error: "Unable to leave channel. Please try again." };
  }

  revalidatePath("/channels");
  return { error: null };
}

export async function postChannelMessage(
  channelId: string,
  formData: FormData
): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to post." };
  }

  const parsed = postChannelMessageSchema.safeParse({
    content: formData.get("content"),
    parent_message_id: formData.get("parent_message_id") || undefined,
  });

  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const { error } = await supabase.from("channel_messages").insert({
    channel_id: channelId,
    author_id: user.id,
    content: parsed.data.content,
    parent_message_id: parsed.data.parent_message_id ?? null,
  });

  if (error) {
    console.error("postChannelMessage error:", error.message);
    return { error: "Unable to post message. You may not be a member." };
  }

  revalidatePath(`/channels/${channelId}`);
  return { error: null };
}