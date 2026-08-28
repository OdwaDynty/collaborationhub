import { validateApiKey, getServiceClient } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Announcements have no scope restriction by design (visible to
  // everyone), so no manual filtering needed here.
  const { data, error } = await supabase
    .from("announcements")
    .select(
      `id, title, content, created_at, author:profiles!announcements_author_id_fkey ( full_name )`
    )
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json(
      { error: "Unable to fetch announcements." },
      { status: 500 }
    );
  }

  return NextResponse.json({ announcements: data });
}