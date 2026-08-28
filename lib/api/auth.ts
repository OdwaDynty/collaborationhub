import { createHash } from "crypto";
import { createClient } from "@supabase/supabase-js";

// API routes use the service role key — this bypasses RLS entirely,
// so every API route MUST manually restrict what it returns (e.g.
// org-wide posts only). Never expose this client or key to the browser.
function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

export async function validateApiKey(
  request: Request
): Promise<{ valid: boolean; error?: string }> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, error: "Missing or malformed Authorization header." };
  }

  const key = authHeader.slice("Bearer ".length).trim();
  const keyHash = createHash("sha256").update(key).digest("hex");

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, revoked_at")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data || data.revoked_at) {
    return { valid: false, error: "Invalid or revoked API key." };
  }

  // Fire-and-forget usage tracking — don't block the request on this.
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return { valid: true };
}

export { getServiceClient };