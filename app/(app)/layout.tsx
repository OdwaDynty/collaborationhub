import Link from "next/link";
import { Settings } from "lucide-react";
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

  // Fetch the user's role so we know whether to show admin-only nav
  // items (like "Admin" and "Reports") in the sidebar.
  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user?.id ?? "")
    .maybeSingle();

  // Fetches the counts/items shown in the notification bell dropdown
  // (unread messages, channels with new activity, unread announcements).
  const summary = await getUnreadSummary();

  return (
    <div className="flex min-h-full flex-1 flex-col sm:flex-row">
      <Sidebar isAdmin={profile?.role === "admin"} />
      <div className="flex flex-1 flex-col">
        <header className="flex flex-wrap items-center justify-between gap-2 border-b border-hairline bg-white px-4 py-3 shadow-sm sm:gap-3 sm:px-6">
          {/* Shows the current page's icon + name, e.g. "🏠 Home" */}
          <PageTitle />

          <div className="flex flex-wrap items-center justify-end gap-2 text-ink sm:gap-3">
            <SearchBox />
            <NotificationBell summary={summary} />

            {/* Settings gear icon — links to the account-level Settings
                page. Deliberately placed here in the header, not in the
                main Sidebar nav list, since Settings is about the
                signed-in account, not a "workspace" page like Channels
                or Announcements. */}
            <Link
              href="/settings"
              aria-label="Settings"
              className="rounded-lg p-1.5 text-ink/60 transition-colors hover:bg-canvas hover:text-brand-teal"
            >
              <Settings className="h-4 w-4" />
            </Link>

            {/* Hidden on small screens (md breakpoint) to prevent the
                header from overflowing/clipping on mobile — see the
                earlier mobile header fix. */}
            <span className="hidden text-sm text-ink/60 md:inline">{user?.email}</span>

            <form action={signOut}>
              <button
                type="submit"
                className="shrink-0 text-sm font-medium text-brand-teal underline"
              >
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