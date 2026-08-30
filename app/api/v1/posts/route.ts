import { validateApiKey, getServiceClient } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: auth.status });
  }

  const supabase = getServiceClient();

  const { data, error } = await supabase
    .from("posts")
    .select(
      `id, content, created_at, author:profiles!posts_author_id_fkey ( full_name )`
    )
    .eq("scope", "organization")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) {
    return NextResponse.json({ error: "Unable to fetch posts." }, { status: 500 });
  }

  return NextResponse.json({ posts: data });
}