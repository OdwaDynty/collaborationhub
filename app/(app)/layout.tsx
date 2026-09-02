import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { Sidebar } from "@/components/layout/sidebar";
import { NotificationBell } from "@/features/notifications/notification-bell";
import { getUnreadSummary } from "@/features/notifications/queries";
import { SearchBox } from "@/features/search/search-box";

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
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex flex-wrap items-center justify-between gap-2 bg-teal-700 px-4 py-3 text-white sm:gap-3 sm:px-6">
        <span className="text-sm font-medium">Zibuke Africa</span>
        <div className="flex flex-wrap items-center justify-end gap-2 text-sm text-teal-50 sm:gap-3">
          <SearchBox />
          <NotificationBell summary={summary} />
          <span className="hidden md:inline">{user?.email}</span>
          <form action={signOut}>
            <button type="submit" className="shrink-0 underline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 flex-col sm:flex-row">
        <Sidebar isAdmin={profile?.role === "admin"} />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}