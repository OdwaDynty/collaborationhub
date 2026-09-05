// Shared TypeScript type for a shared file. Kept in one place so every
// file that touches a ChannelFile agrees on its exact shape.
export type ChannelFile = {
  id: string;
  file_name: string;
  file_size: number;
  storage_path: string;
  created_at: string;
  channel_id: string;
  // The profile id of whoever uploaded this file — needed (alongside
  // adminChannelIds, see queries.ts) to decide whether the CURRENT
  // viewer is allowed to see a Delete button on this specific file.
  uploaded_by: string;
  channel?: { name: string } | null;
  uploader: { full_name: string };
};