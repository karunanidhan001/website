import type { LucideIcon } from "lucide-react";
import {
  LayoutDashboard,
  Boxes,
  Upload,
  FileWarning,
  Users,
  CalendarClock,
  BarChart3,
  ScrollText,
  UsersRound,
  Settings,
} from "lucide-react";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { label: "Assets", href: "/assets", icon: Boxes },
  { label: "Import", href: "/import", icon: Upload },
  { label: "Claims", href: "/claims", icon: FileWarning },
  { label: "Customers", href: "/customers", icon: Users },
  { label: "Renewals", href: "/renewals", icon: CalendarClock },
  { label: "Analytics", href: "/analytics", icon: BarChart3 },
  { label: "Audit log", href: "/audit-log", icon: ScrollText },
  { label: "Team", href: "/team", icon: UsersRound },
  { label: "Settings", href: "/settings", icon: Settings },
];
