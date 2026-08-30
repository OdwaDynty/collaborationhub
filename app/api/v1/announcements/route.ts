import { validateApiKey, getServiceClient } from "@/lib/api/auth";
import { NextResponse } from "next/server";
import { z } from "zod";

export async function GET(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getServiceClient();

  // Restricted to organization-wide only, same reasoning as posts — an
  // API key has no employee/department context, so department-scoped
  // announcements must never be returned here. (This was previously
  // missing — a real gap found while extending this route.)
  const { data, error } = await supabase
    .from("announcements")
    .select(
      `id, title, content, created_at, author:profiles!announcements_author_id_fkey ( full_name )`
    )
    .eq("scope", "organization")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Unable to fetch announcements." }, { status: 500 });
  }

  return NextResponse.json({ announcements: data });
}

const createAnnouncementApiSchema = z.object({
  title: z.string().trim().min(1).max(200),
  content: z.string().trim().min(1).max(5000),
});

export async function POST(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  if (!auth.canWrite) {
    return NextResponse.json(
      { error: "This API key does not have write access." },
      { status: 403 }
    );
  }

  if (!auth.ownerProfileId) {
    return NextResponse.json(
      { error: "This API key has no owner assigned and cannot create content." },
      { status: 500 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400 });
  }

  const parsed = createAnnouncementApiSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0].message },
      { status: 400 }
    );
  }

  const supabase = getServiceClient();

  // API-created announcements are always organization-wide — an
  // external system has no department context to scope to correctly,
  // and getting that wrong would be a real visibility bug, not a
  // cosmetic one.
  const { data, error } = await supabase
    .from("announcements")
    .insert({
      author_id: auth.ownerProfileId,
      title: parsed.data.title,
      content: parsed.data.content,
      scope: "organization",
    })
    .select("id")
    .single();

  if (error || !data) {
    console.error("API createAnnouncement error:", error?.message);
    return NextResponse.json({ error: "Unable to create announcement." }, { status: 500 });
  }

  // Audit logging for API writes, same table as admin actions. This
  // can't go through a database trigger the way admin changes do,
  // since there's no authenticated user session (auth.uid()) behind
  // an API-key request — logged explicitly here instead.
  await supabase.from("audit_events").insert({
    actor_id: auth.ownerProfileId,
    action: "api_announcement_created",
    target_type: "announcement",
    target_id: data.id,
    metadata: { api_key_id: auth.keyId, title: parsed.data.title },
  });

  return NextResponse.json({ id: data.id }, { status: 201 });
}