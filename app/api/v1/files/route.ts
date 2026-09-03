import { validateApiKey, getServiceClient } from "@/lib/api/auth";
import { NextResponse } from "next/server";

// GET /api/v1/files                → list files across channels the key's owner is a member of
// GET /api/v1/files?fileId=...     → a short-lived signed download URL for one file
export async function GET(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }
  if (!auth.ownerProfileId) {
    return NextResponse.json(
      { error: "This API key has no owner assigned and cannot access files." },
      { status: 500 }
    );
  }

  const supabase = getServiceClient();
  const { searchParams } = new URL(request.url);
  const fileId = searchParams.get("fileId");

  if (fileId) {
    const { data: file } = await supabase
      .from("files")
      .select("id, channel_id, storage_path")
      .eq("id", fileId)
      .single();

    if (!file) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    // Explicit membership check — the service-role client bypasses RLS,
    // so this has to be enforced here the same way the app relies on
    // is_channel_member via RLS normally.
    const { data: membership } = await supabase
      .from("channel_members")
      .select("profile_id")
      .eq("channel_id", file.channel_id)
      .eq("profile_id", auth.ownerProfileId)
      .maybeSingle();

    if (!membership) {
      return NextResponse.json({ error: "File not found." }, { status: 404 });
    }

    const { data: signed, error: signError } = await supabase.storage
      .from("channel-files")
      .createSignedUrl(file.storage_path, 60);

    if (signError || !signed) {
      return NextResponse.json({ error: "Unable to generate download link." }, { status: 500 });
    }

    return NextResponse.json({ downloadUrl: signed.signedUrl, expiresInSeconds: 60 });
  }

  // No fileId: list files across every channel this owner is a member of.
  const { data: memberships } = await supabase
    .from("channel_members")
    .select("channel_id")
    .eq("profile_id", auth.ownerProfileId);

  const channelIds = (memberships ?? []).map((m) => m.channel_id);
  if (channelIds.length === 0) {
    return NextResponse.json({ files: [] });
  }

  const { data, error } = await supabase
    .from("files")
    .select(
      `id, file_name, file_size, channel_id, created_at,
       channel:channels ( name ),
       uploader:profiles!files_uploaded_by_fkey ( full_name )`
    )
    .in("channel_id", channelIds)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Unable to fetch files." }, { status: 500 });
  }

  return NextResponse.json({ files: data });
}