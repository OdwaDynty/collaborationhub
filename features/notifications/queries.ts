import { createClient } from "@/lib/supabase/server";
import type { NotificationSummary } from "@/types/notifications";

// Merges three different unread mechanisms into one summary:
// - direct messages: real stored notification rows (fanout=1, cheap)
// - channels: derived from last_read_at vs latest message per membership
// - announcements: derived from a single profile timestamp
// Note: the channel loop is one query per membership — fine at demo
// scale (a handful of channels per person), but worth batching into a
// single query with a lateral join if channel counts grow a lot.
export async function getUnreadSummary(): Promise<NotificationSummary> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const empty: NotificationSummary = {
    directMessages: { unreadCount: 0, items: [] },
    channelsWithUnread: [],
    announcementsUnread: false,
  };

  if (!user) return empty;

  const { data: dmNotifications } = await supabase
    .from("notifications")
    .select("id, conversation_id, content, created_at")
    .eq("profile_id", user.id)
    .eq("type", "direct_message")
    .is("read_at", null)
    .order("created_at", { ascending: false })
    .limit(5);

  const { count: dmUnreadCount } = await supabase
    .from("notifications")
    .select("id", { count: "exact", head: true })
    .eq("profile_id", user.id)
    .eq("type", "direct_message")
    .is("read_at", null);

  const { data: memberships } = await supabase
    .from("channel_members")
    .select("channel_id, last_read_at, channels ( name )")
    .eq("profile_id", user.id);

  const channelsWithUnread: NotificationSummary["channelsWithUnread"] = [];
  for (const m of memberships ?? []) {
    const { data: latest } = await supabase
      .from("channel_messages")
      .select("created_at")
      .eq("channel_id", m.channel_id)
      .eq("is_deleted", false)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (latest && (!m.last_read_at || latest.created_at > m.last_read_at)) {
      channelsWithUnread.push({
        channelId: m.channel_id,
        name: (m.channels as unknown as { name: string })?.name ?? "Channel",
      });
    }
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("last_read_announcements_at")
    .eq("id", user.id)
    .single();

  const { data: latestAnnouncement } = await supabase
    .from("announcements")
    .select("created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  const announcementsUnread = !!(
    latestAnnouncement &&
    (!profile?.last_read_announcements_at ||
      latestAnnouncement.created_at > profile.last_read_announcements_at)
  );

  return {
    directMessages: {
      unreadCount: dmUnreadCount ?? 0,
      items: (dmNotifications ?? []).map((n) => ({
        id: n.id,
        conversationId: n.conversation_id,
        content: n.content,
        createdAt: n.created_at,
      })),
    },
    channelsWithUnread,
    announcementsUnread,
  };
}