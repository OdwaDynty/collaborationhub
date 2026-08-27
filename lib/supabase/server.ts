// Supabase client for use in Server Components, Route Handlers, and Server Actions.
// Reads/writes auth cookies via Next's cookies() so the session persists
// across server-rendered requests.
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // setAll is called from a Server Component in some cases,
            // where cookies can't be written. Safe to ignore — middleware
            // handles refreshing sessions instead.
          }
        },
      },
    }
  );
}