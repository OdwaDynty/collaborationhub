import Link from "next/link";
import { Settings, LogOut } from "lucide-react";
import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { Sidebar } from "@/components/layout/sidebar";
import { PageTitle } from "@/components/layout/page-title";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { getUnreadSummary } from "@/features/notifications/queries";
import { SearchBox } from "@/features/search/search-box";

/**
 * The shared layout every page under app/(app)/ renders inside —
 * this is what puts the sidebar and header on every logged-in page
 * without each individual page needing to build them itself.
 */
export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  const summary = await getUnreadSummary();

  return (
    <div className="flex min-h-full flex-1 flex-col sm:flex-row">
      <Sidebar isAdmin={profile?.role === "admin"} />
      <div className="flex flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-white px-4 py-3 shadow-sm sm:gap-3 sm:px-6">
          <PageTitle />

          <div className="flex flex-wrap items-center justify-end gap-2 text-ink sm:gap-3">
            <SearchBox />
            <NotificationBell summary={summary} />

            <Link
              href="/settings"
              aria-label="Settings"
              className="rounded-lg p-1.5 text-ink/60 transition-colors hover:bg-canvas hover:text-brand-teal"
            >
              <Settings className="h-4 w-4" />
            </Link>

            <span className="hidden text-sm text-ink/60 md:inline">{user?.email}</span>

            {/* Restyled from a bare underlined text link to a proper
                small outlined button — matches the same visual weight
                as other secondary actions elsewhere in the app (e.g.
                "Deactivate" in Admin). The hover state shifts toward
                red specifically because signing out is a "leave"
                action — a subtle, honest visual cue without making it
                look alarming or destructive at rest. */}
            <form action={signOut}>
              <button
                type="submit"
                className="flex shrink-0 items-center gap-1.5 rounded-lg border border-hairline px-3 py-1.5 text-sm font-medium text-ink/70 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
              >
                <LogOut className="h-3.5 w-3.5" />
                Sign out
              </button>
            </form>
          </div>
        </header>
        <main className="flex flex-1 flex-col bg-canvas">{children}</main>
      </div>
    </div>
  );
}