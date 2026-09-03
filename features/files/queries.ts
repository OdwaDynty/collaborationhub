import { createClient } from "@/lib/supabase/server";
import type { ChannelFile } from "@/types/files";

export async function getFilesForUserChannels(): Promise<{
  files: ChannelFile[];
  error: string | null;
}> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("files")
    .select(
      `id, file_name, file_size, storage_path, created_at, channel_id,
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
      `id, file_name, file_size, storage_path, created_at, channel_id,
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