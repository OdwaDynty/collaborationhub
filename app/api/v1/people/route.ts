import { validateApiKey, getServiceClient } from "@/lib/api/auth";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const auth = await validateApiKey(request);
  if (!auth.valid) {
    return NextResponse.json({ error: auth.error }, { status: 401 });
  }

  const supabase = getServiceClient();

  // Directory data is intentionally minimal — no email, no auth
  // identifiers — appropriate for a third-party integration context.
  const { data, error } = await supabase
    .from("profiles")
    .select(
      `id, full_name, job_title, department:departments ( name )`
    )
    .order("full_name")
    .limit(100);

  if (error) {
    return NextResponse.json(
      { error: "Unable to fetch directory." },
      { status: 500 }
    );
  }

  return NextResponse.json({ people: data });
}