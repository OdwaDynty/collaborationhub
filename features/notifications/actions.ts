"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

type ActionResult = { error: string | null };

export async function markDirectMessageNotificationsRead(): Promise<ActionResult> {
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
    .is("read_at", null);

  if (error) {
    console.error("markDirectMessageNotificationsRead error:", error.message);
    return { error: "Unable to update notifications." };
  }
  revalidatePath("/", "layout");
  return { error: null };
}

export async function markChannelRead(channelId: string): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("channel_members")
    .update({ last_read_at: new Date().toISOString() })
    .eq("channel_id", channelId)
    .eq("profile_id", user.id);

  if (error) {
    console.error("markChannelRead error:", error.message);
    return { error: "Unable to update channel read status." };
  }
  revalidatePath("/", "layout");
  return { error: null };
}

export async function markAnnouncementsRead(): Promise<ActionResult> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "Not signed in." };

  const { error } = await supabase
    .from("profiles")
    .update({ last_read_announcements_at: new Date().toISOString() })
    .eq("id", user.id);

  if (error) {
    console.error("markAnnouncementsRead error:", error.message);
    return { error: "Unable to update read status." };
  }
  revalidatePath("/", "layout");
  return { error: null };
}