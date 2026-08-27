import { createClient } from "@/lib/supabase/server";
import { signOut } from "@/lib/auth/actions";
import { Sidebar } from "@/components/layout/sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <div className="flex min-h-full flex-1 flex-col">
      <header className="flex items-center justify-between border-b px-6 py-3">
        <span className="text-sm font-medium">Zibuke Africa</span>
        <div className="flex items-center gap-3 text-sm text-zinc-600 dark:text-zinc-400">
          <span>{user?.email}</span>
          <form action={signOut}>
            <button type="submit" className="underline">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="flex flex-1 flex-col sm:flex-row">
        <Sidebar />
        <main className="flex flex-1 flex-col">{children}</main>
      </div>
    </div>
  );
}