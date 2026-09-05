import { createClient } from "@/lib/supabase/server";
import type { ChannelFile } from "@/types/files";

export async function getFilesForUserChannels(): Promise<{
  files: ChannelFile[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("files")
    // uploaded_by added to the select list — the file-list component
    // needs this to decide who gets to see a Delete button.
    .select(
      `id, file_name, file_size, storage_path, created_at, channel_id, uploaded_by,
       channel:channels ( name ),
       uploader:profiles!files_uploaded_by_fkey ( full_name )`
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    console.error("getFilesForUserChannels error:", error.message);
    return { files: [], error: "Unable to load files." };
  }

  return { files: (data ?? []) as unknown as ChannelFile[], error: null };
}

export async function getFilesForChannel(channelId: string): Promise<{
  files: ChannelFile[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("files")
    .select(
      `id, file_name, file_size, storage_path, created_at, channel_id, uploaded_by,
       uploader:profiles!files_uploaded_by_fkey ( full_name )`
    )
    .eq("channel_id", channelId)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("getFilesForChannel error:", error.message);
    return { files: [], error: "Unable to load files." };
  }

  return { files: (data ?? []) as unknown as ChannelFile[], error: null };
}

/**
 * Returns the set of channel ids where the current user holds the
 * "admin" role — used purely to decide, in the UI, which files show a
 * Delete button for a channel admin who didn't upload them themselves.
 *
 * This is a UI convenience only — the REAL permission enforcement is
 * the database RLS policies (files_delete_if_owner_or_channel_admin
 * and the storage policy backed by can_delete_file()). Even if this
 * function returned the wrong answer, the database would still refuse
 * an unauthorized delete.
 */
export async function getAdminChannelIds(): Promise<string[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return [];

  const { data, error } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("profile_id", user.id)
    .eq("role", "admin");

  if (error) {
    console.error("getAdminChannelIds error:", error.message);
    return [];
  }

  return (data ?? []).map((row) => row.channel_id);
}