"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { uploadFileSchema, MAX_FILE_SIZE } from "./schema";

export async function uploadFile(formData: FormData): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in to upload a file." };
  }

  const parsed = uploadFileSchema.safeParse({
    channelId: formData.get("channelId"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0].message };
  }

  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) {
    return { error: "Choose a file to upload." };
  }
  if (file.size > MAX_FILE_SIZE) {
    return { error: "Files must be under 4MB." };
  }

  const { channelId } = parsed.data;
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
  const storagePath = `${channelId}/${crypto.randomUUID()}-${safeName}`;

  const { error: uploadError } = await supabase.storage
    .from("channel-files")
    .upload(storagePath, file);

  if (uploadError) {
    console.error("uploadFile storage error:", uploadError.message);
    return { error: "Unable to upload file. You may not be a member of this channel." };
  }

  const { error: insertError } = await supabase.from("files").insert({
    channel_id: channelId,
    uploaded_by: user.id,
    file_name: file.name,
    file_size: file.size,
    storage_path: storagePath,
  });

  if (insertError) {
    console.error("uploadFile insert error:", insertError.message);
    // Clean up the orphaned storage object since the row failed.
    await supabase.storage.from("channel-files").remove([storagePath]);
    return { error: "Unable to save file record. Please try again." };
  }

  revalidatePath("/files");
  revalidatePath(`/channels/${channelId}`);
  return { error: null };
}

export async function getFileDownloadUrl(
  storagePath: string
): Promise<{ url: string | null; error: string | null }> {
  const supabase = await createClient();

  const { data, error } = await supabase.storage
    .from("channel-files")
    .createSignedUrl(storagePath, 60);

  if (error || !data) {
    console.error("getFileDownloadUrl error:", error?.message);
    return { url: null, error: "Unable to generate download link." };
  }

  return { url: data.signedUrl, error: null };
}