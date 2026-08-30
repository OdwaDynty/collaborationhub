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
      <header className="flex items-center justify-between gap-3 border-b px-6 py-3">
        <span className="text-sm font-medium">Zibuke Africa</span>
        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <SearchBox />
          <NotificationBell summary={summary} />
          <span>{user?.email}</span>
          <form action={signOut}>
            <button type="submit" className="underline">
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