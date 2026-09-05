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

/**
 * Deletes a shared file — both the actual stored bytes and its
 * database row. Only the original uploader or a channel admin can
 * succeed here, enforced by the database and storage RLS policies.
 *
 * CORRECTED ORDER (this is the fix for the bug where files stayed in
 * storage after "successful" deletion): storage is deleted FIRST,
 * while the files row still exists — because the storage RLS policy's
 * permission check (can_delete_file) works by looking up this exact
 * row to confirm the caller is the uploader or a channel admin. If the
 * row were deleted first, that lookup would always fail afterward,
 * since there'd be nothing left to check permission against.
 */
export async function deleteFile(fileId: string): Promise<{ error: string | null }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return { error: "You must be signed in." };
  }

  const { data: file, error: fetchError } = await supabase
    .from("files")
    .select("storage_path")
    .eq("id", fileId)
    .single();

  if (fetchError || !file) {
    return { error: "File not found." };
  }

  // Delete the actual stored bytes first — see the doc comment above
  // for exactly why this ordering matters.
  const { data: removedObjects, error: storageError } = await supabase.storage
    .from("channel-files")
    .remove([file.storage_path]);

  if (storageError) {
    console.error("deleteFile storage error:", storageError.message);
    return { error: "Unable to delete file. Please try again." };
  }

  // IMPORTANT: Supabase Storage's RLS behaves like database RLS — if a
  // delete is blocked by policy, it does NOT throw an error, it just
  // silently removes nothing. Checking only `storageError` (as the
  // original version did) would miss this entirely. The only reliable
  // way to detect a blocked delete is checking whether anything was
  // actually returned as removed.
  if (!removedObjects || removedObjects.length === 0) {
    return { error: "You don't have permission to delete this file." };
  }

  // Now that the file is confirmed gone from storage, remove its
  // database row too.
  const { error: deleteRowError } = await supabase
    .from("files")
    .delete()
    .eq("id", fileId);

  if (deleteRowError) {
    // A genuinely inconsistent state worth surfacing rather than
    // hiding: the file's bytes are gone, but its row would still show
    // in the list. Unlike the original version, this is reported to
    // the user instead of silently swallowed.
    console.error(
      "deleteFile row cleanup error (storage already removed):",
      deleteRowError.message
    );
    return {
      error: "File content removed, but the listing couldn't be cleaned up. Please refresh.",
    };
  }

  revalidatePath("/files");
  return { error: null };
}