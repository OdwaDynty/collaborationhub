import Link from "next/link";
import { Newspaper, Megaphone, Users, Cake } from "lucide-react";

const NAV_ITEMS = [
  { href: "/feed", label: "Feed", icon: Newspaper },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/people", label: "People", icon: Users },
  { href: "/birthdays", label: "Birthdays", icon: Cake },
];

export function Sidebar() {
  return (
    <nav className="flex gap-1 border-b px-4 py-2 sm:w-56 sm:flex-col sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
      {NAV_ITEMS.map(({ href, label, icon: Icon }) => (
        <Link
          key={href}
          href={href}
          className="flex items-center gap-2 rounded px-3 py-2 text-sm text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-900"
        >
          <Icon className="h-4 w-4" />
          <span className="hidden sm:inline">{label}</span>
        </Link>
      ))}
    </nav>
  );
}