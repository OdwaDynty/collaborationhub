"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
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
  const pathname = usePathname();
  const items = isAdmin
    ? [...NAV_ITEMS, { href: "/admin", label: "Admin", icon: ShieldCheck }]
    : NAV_ITEMS;

  return (
    <nav className="flex flex-wrap items-center gap-1 bg-brand-teal-ink px-3 py-2 sm:w-56 sm:flex-col sm:items-stretch sm:py-4">
      <div className="hidden px-2 pb-5 font-heading text-base font-semibold text-white sm:block">
        Zibuke Africa
      </div>
      {items.map(({ href, label, icon: Icon }) => {
        const isActive = pathname === href || pathname?.startsWith(`${href}/`);
        return (
          <Link
            key={href}
            href={href}
            className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition-colors ${
              isActive
                ? "bg-brand-gold font-medium text-white"
                : "text-white/70 hover:bg-white/5 hover:text-white"
            }`}
          >
            <Icon className="h-4 w-4" />
            <span className="hidden sm:inline">{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}