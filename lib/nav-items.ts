import { Home, Megaphone, Users, Cake, Hash, MessageCircle, ShieldCheck, Folder, BarChart3, Calendar, LucideIcon } from "lucide-react";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/messages", label: "Messages", icon: MessageCircle },
  { href: "/channels", label: "Channels", icon: Hash },
  { href: "/files", label: "Files", icon: Folder },
  { href: "/announcements", label: "Announcements", icon: Megaphone },
  { href: "/calendar", label: "Calendar", icon: Calendar },
  { href: "/people", label: "People", icon: Users },
  { href: "/birthdays", label: "Birthdays", icon: Cake },
];

export const ADMIN_NAV_ITEMS: NavItem[] = [
  { href: "/reports", label: "Reports", icon: BarChart3 },
  { href: "/admin", label: "Admin", icon: ShieldCheck },
];