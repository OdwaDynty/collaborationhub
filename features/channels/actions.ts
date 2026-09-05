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

  // Checked here for a clear, specific error message — the database's
  // channel_messages_insert_if_member RLS policy would block this
  // regardless, but "unable to post message" alone wouldn't tell
  // someone WHY, when the real reason is simply that the channel has
  // been archived.
  const { data: channel } = await supabase
    .from("channels")
    .select("is_archived")
    .eq("id", channelId)
    .single();

  if (channel?.is_archived) {
    return { error: "This channel has been archived and no longer accepts new messages." };
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

export async function deleteChannelMessage(
  messageId: string,
  channelId: string
): Promise<ActionResult> {
  const supabase = await createClient();

  const { error } = await supabase.rpc("soft_delete_channel_message", {
    p_message_id: messageId,
  });

  if (error) {
    console.error("deleteChannelMessage error:", error.message);
    return {
      error: error.message.includes("permission")
        ? "You can only delete your own messages."
        : "Unable to delete message. Please try again.",
    };
  }

  revalidatePath(`/channels/${channelId}`);
  return { error: null };
}

/**
 * Archives a channel — sets is_archived to true, which immediately
 * removes it from every regular channel listing (getChannels already
 * filters `.eq("is_archived", false)`) without deleting anything.
 *
 * No manual permission check is written here on purpose: the existing
 * "channels_update_by_admin" RLS policy (added back in the original
 * Admin+Audit phase) already restricts UPDATE on the channels table to
 * admins only. If a non-admin somehow called this, the update would
 * simply affect zero rows rather than succeeding — the database is
 * the real enforcement, this function just triggers it.
 *
 * The audit_channel_events_trigger (also already in place) fires
 * automatically the moment is_archived flips from false to true,
 * logging a 'channel_archived' event with no extra code needed here.
 */
export async function archiveChannel(channelId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("channels")
    .update({ is_archived: true }, { count: "exact" })
    .eq("id", channelId);

  if (error) {
    console.error("archiveChannel error:", error.message);
    return { error: "Unable to archive channel. Please try again." };
  }

  // Same reasoning as deleteFile's count check earlier — RLS silently
  // updates zero rows rather than throwing when it blocks an
  // unauthorized request, so `count` is the only reliable way to know
  // whether anything actually happened.
  if (!count) {
    return { error: "You don't have permission to archive this channel." };
  }

  revalidatePath("/admin");
  revalidatePath("/channels");
  return { error: null };
}

/**
 * Reverses an archive — sets is_archived back to false, making the
 * channel reappear in every regular listing again. Uses the exact
 * same admin-only RLS policy as archiveChannel (channels_update_by_
 * admin doesn't distinguish direction), and the audit trigger now
 * correctly logs this as its own 'channel_unarchived' event.
 */
export async function unarchiveChannel(channelId: string): Promise<ActionResult> {
  const supabase = await createClient();

  const { error, count } = await supabase
    .from("channels")
    .update({ is_archived: false }, { count: "exact" })
    .eq("id", channelId);

  if (error) {
    console.error("unarchiveChannel error:", error.message);
    return { error: "Unable to unarchive channel. Please try again." };
  }

  if (!count) {
    return { error: "You don't have permission to unarchive this channel." };
  }

  revalidatePath("/admin");
  revalidatePath("/channels");
  return { error: null };
}