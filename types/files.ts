export type ChannelFile = {
  id: string;
  file_name: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  channel_id: string;
  channel?: { name: string } | null;
  uploader: { full_name: string };
};