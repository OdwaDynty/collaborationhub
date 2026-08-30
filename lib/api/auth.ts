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

const RATE_LIMIT_PER_MINUTE = 60;
const RATE_LIMIT_WINDOW_SECONDS = 60;

type ApiAuthResult =
  | { valid: true; keyId: string; ownerProfileId: string | null; canWrite: boolean }
  | { valid: false; status: 401 | 429; error: string };

export async function validateApiKey(request: Request): Promise<ApiAuthResult> {
  const authHeader = request.headers.get("authorization");

  if (!authHeader?.startsWith("Bearer ")) {
    return { valid: false, status: 401, error: "Missing or malformed Authorization header." };
  }

  const key = authHeader.slice("Bearer ".length).trim();
  const keyHash = createHash("sha256").update(key).digest("hex");

  const supabase = getServiceClient();
  const { data, error } = await supabase
    .from("api_keys")
    .select("id, revoked_at, owner_profile_id, can_write")
    .eq("key_hash", keyHash)
    .single();

  if (error || !data || data.revoked_at) {
    return { valid: false, status: 401, error: "Invalid or revoked API key." };
  }

  // Atomic, race-safe rate limit check — a single SQL function with a
  // row lock, not a read-then-write from application code (which two
  // concurrent requests could both pass incorrectly).
  const { data: allowed, error: rateLimitError } = await supabase.rpc(
    "check_and_increment_rate_limit",
    {
      p_key_id: data.id,
      p_limit: RATE_LIMIT_PER_MINUTE,
      p_window_seconds: RATE_LIMIT_WINDOW_SECONDS,
    }
  );

  if (rateLimitError) {
    // Fail open on a rate-limiter infrastructure error rather than
    // blocking all traffic — a bug in the limiter shouldn't become
    // a full outage for every integration.
    console.error("Rate limit check error:", rateLimitError.message);
  } else if (!allowed) {
    return {
      valid: false,
      status: 429,
      error: `Rate limit exceeded: max ${RATE_LIMIT_PER_MINUTE} requests per minute.`,
    };
  }

  // Fire-and-forget usage tracking — don't block the request on this.
  supabase
    .from("api_keys")
    .update({ last_used_at: new Date().toISOString() })
    .eq("id", data.id)
    .then(() => {});

  return {
    valid: true,
    keyId: data.id,
    ownerProfileId: data.owner_profile_id,
    canWrite: data.can_write,
  };
}

export { getServiceClient };