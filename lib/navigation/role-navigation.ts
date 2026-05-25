import type { LucideIcon } from "lucide-react";
import {
  Calendar,
  ClipboardList,
  FileText,
  Home,
  LayoutDashboard,
  Map,
  MessageCircle,
  MoreHorizontal,
  Search,
  Shield,
  Truck,
  Users,
} from "lucide-react";

import type { UserRole } from "@/types/mapable";

export type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
  /** Accessible name when label is abbreviated on small screens */
  ariaLabel?: string;
};

export type NavRoleKey =
  | "participant"
  | "provider_admin"
  | "support_worker"
  | "driver"
  | "plan_manager"
  | "admin";

export function resolveNavRoleKey(role: UserRole | null): NavRoleKey {
  if (!role) return "participant";
  if (role === "mapable_admin") return "admin";
  if (role === "provider_admin" || role === "transport_operator") {
    return "provider_admin";
  }
  if (role === "support_worker") return "support_worker";
  if (role === "driver") return "driver";
  if (role === "plan_manager") return "plan_manager";
  if (
    role === "participant" ||
    role === "family_member" ||
    role === "support_coordinator"
  ) {
    return "participant";
  }
  return "participant";
}

const PARTICIPANT_NAV: NavItem[] = [
  { href: "/participant", label: "Home", icon: Home },
  { href: "/provider-finder", label: "Find", icon: Search },
  { href: "/dashboard/bookings", label: "Bookings", icon: Calendar },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/dashboard/profile", label: "More", icon: MoreHorizontal },
];

const PROVIDER_NAV: NavItem[] = [
  { href: "/provider", label: "Home", icon: Home },
  { href: "/provider/bookings", label: "Jobs", icon: ClipboardList },
  { href: "/provider/care/shifts", label: "Roster", icon: Users },
  { href: "/provider/messages", label: "Messages", icon: MessageCircle },
  { href: "/provider/support", label: "More", icon: MoreHorizontal },
];

const WORKER_NAV: NavItem[] = [
  { href: "/worker", label: "Today", icon: Home },
  { href: "/worker/shifts", label: "Shifts", icon: Calendar },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/worker/notes", label: "Notes", icon: FileText },
  { href: "/dashboard/incidents", label: "More", icon: MoreHorizontal },
];

const DRIVER_NAV: NavItem[] = [
  { href: "/driver", label: "Trips", icon: Truck },
  { href: "/driver/trips", label: "Map", icon: Map },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/driver/safety", label: "Safety", icon: Shield },
  { href: "/driver/profile", label: "More", icon: MoreHorizontal },
];

const PLAN_MANAGER_NAV: NavItem[] = [
  { href: "/plan-manager", label: "Invoices", icon: FileText },
  { href: "/plan-manager/participants", label: "Participants", icon: Users },
  { href: "/dashboard/messages", label: "Messages", icon: MessageCircle },
  { href: "/plan-manager/exceptions", label: "More", icon: MoreHorizontal },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/provider-quality", label: "Quality", icon: Shield },
  { href: "/admin/support", label: "Support", icon: MessageCircle },
  { href: "/admin/reports", label: "Reports", icon: FileText },
  { href: "/admin/settings", label: "More", icon: MoreHorizontal },
];

export function mobileNavForRole(role: UserRole | null): NavItem[] {
  const key = resolveNavRoleKey(role);
  switch (key) {
    case "provider_admin":
      return PROVIDER_NAV;
    case "support_worker":
      return WORKER_NAV;
    case "driver":
      return DRIVER_NAV;
    case "plan_manager":
      return PLAN_MANAGER_NAV;
    case "admin":
      return ADMIN_NAV;
    default:
      return PARTICIPANT_NAV;
  }
}

export function desktopNavForRole(role: UserRole | null): NavItem[] {
  return mobileNavForRole(role);
}

export function homePathForRole(role: UserRole | null): string {
  return mobileNavForRole(role)[0]?.href ?? "/dashboard";
}
