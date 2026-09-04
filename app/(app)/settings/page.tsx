import { ChangePasswordForm } from "@/features/settings/change-password-form";
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

/**
 * The Settings page. This is a Server Component (no "use client" at the
 * top), which means it runs on the server, can talk to Supabase
 * directly, and can redirect before any HTML is sent to the browser.
 *
 * Currently just holds the self-service password change form — this is
 * Phase 1 of a larger plan; future phases (like connecting Google
 * Calendar) will add more sections to this same page.
 */
export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Route guard: if there's no logged-in user, send them to the login
  // page instead of showing a broken/empty settings page.
  if (!user) {
    redirect("/login");
  }

  return (
    <div className="mx-auto w-full max-w-lg space-y-6 p-6">
      <h1 className="font-heading text-lg font-semibold text-ink">Settings</h1>

      {/* Read-only display of the signed-in account's email, just for
          confirmation — not editable here. */}
      <section>
        <h2 className="mb-2 text-sm font-medium text-ink/70">Signed in as</h2>
        <p className="rounded-xl border border-hairline bg-white px-4 py-3 text-sm text-ink">
          {user.email}
        </p>
      </section>

      <section>
        <h2 className="mb-2 text-sm font-medium text-ink/70">Change password</h2>
        <ChangePasswordForm />
      </section>
    </div>
  );
}