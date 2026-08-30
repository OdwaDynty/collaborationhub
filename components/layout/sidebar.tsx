import Link from "next/link";
import { Home, Megaphone, Users, Cake, Hash, MessageCircle, ShieldCheck } from "lucide-react";

const NAV_ITEMS = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/channels", label: "Channels", icon: Hash },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/people", label: "People", icon: Users },
  { href: "/birthdays", label: "Birthdays", icon: Cake },
];

export function Sidebar({ isAdmin }: { isAdmin: boolean }) {
  const items = isAdmin
    ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : NAV_ITEMS;

  return (
    <nav className="flex gap-1 border-b px-4 py-2 sm:w-56 sm:flex-col sm:border-b-0 sm:border-r sm:px-3 sm:py-4">
      {items.map(({ href, label, icon: Icon }) => (
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