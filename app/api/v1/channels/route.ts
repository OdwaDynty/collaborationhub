import { validateApiKey, getServiceClient } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getServiceClient();

  // Public channels only — an API key has no employee identity, so it
  // can't be "a member" of a private channel the way a logged-in user
  // can. Private channels are excluded entirely, not just their messages.
  const { data, error } = await supabase
    .from("channels")
    .select("id, name, description, visibility, created_at")
    .eq("visibility", "public")
    .eq("is_archived", false)
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Unable to fetch channels." }, { status: 500 });
  }

  return NextResponse.json({ channels: data });
}