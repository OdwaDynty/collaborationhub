"use client";

import { usePathname } from "next/navigation";
import { NAV_ITEMS, ADMIN_NAV_ITEMS } from "@/lib/nav-items";

const ALL_ITEMS = [...NAV_ITEMS, ...ADMIN_NAV_ITEMS];

export function PageTitle() {
  const pathname = usePathname();
  const current = ALL_ITEMS.find(
    (item) => pathname === item.href || pathname?.startsWith(`${item.href}/`)
  );

  if (!current) return <div />;

  const Icon = current.icon;

  return (
    <div className="flex items-center gap-2">
      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-teal/10">
        <Icon className="h-4 w-4 text-brand-teal-ink" />
      </div>
      <span className="font-heading text-sm font-semibold text-ink">{current.label}</span>
    </div>
  );
}