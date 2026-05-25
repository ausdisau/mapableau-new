import type { UserRole } from "@/types/mapable";

export interface NavItem {
  href: string;
  label: string;
  icon?: string;
}

const PARTICIPANT_NAV: NavItem[] = [
  { href: "/participant", label: "Home" },
  { href: "/providers", label: "Find" },
  { href: "/bookings", label: "Bookings" },
  { href: "/messages", label: "Messages" },
  { href: "/participant/profile", label: "More" },
];

const PROVIDER_ADMIN_NAV: NavItem[] = [
  { href: "/provider", label: "Home" },
  { href: "/jobs", label: "Jobs" },
  { href: "/provider/bookings", label: "Roster" },
  { href: "/provider/messages", label: "Messages" },
  { href: "/provider/profile", label: "More" },
];

const WORKER_NAV: NavItem[] = [
  { href: "/worker", label: "Today" },
  { href: "/worker/shifts", label: "Shifts" },
  { href: "/messages", label: "Messages" },
  { href: "/worker/notes", label: "Notes" },
  { href: "/worker/profile", label: "More" },
];

const DRIVER_NAV: NavItem[] = [
  { href: "/driver", label: "Trips" },
  { href: "/driver/map", label: "Map" },
  { href: "/messages", label: "Messages" },
  { href: "/driver/safety", label: "Safety" },
  { href: "/driver/profile", label: "More" },
];

const PLAN_MANAGER_NAV: NavItem[] = [
  { href: "/invoices", label: "Invoices" },
  { href: "/plan-manager/participants", label: "Participants" },
  { href: "/messages", label: "Messages" },
  { href: "/plan-manager/profile", label: "More" },
];

const ADMIN_NAV: NavItem[] = [
  { href: "/admin", label: "Dashboard" },
  { href: "/quality", label: "Quality" },
  { href: "/admin/support-desk", label: "Support" },
  { href: "/admin/analytics", label: "Reports" },
  { href: "/admin/settings", label: "More" },
];

export function navigationForRole(role: UserRole): NavItem[] {
  switch (role) {
    case "participant":
    case "family_member":
      return PARTICIPANT_NAV;
    case "provider_admin":
    case "transport_operator":
      return PROVIDER_ADMIN_NAV;
    case "support_worker":
      return WORKER_NAV;
    case "driver":
      return DRIVER_NAV;
    case "plan_manager":
      return PLAN_MANAGER_NAV;
    case "mapable_admin":
    case "support_coordinator":
      return role === "support_coordinator"
        ? [
            { href: "/coordinator", label: "Home" },
            { href: "/coordinator/participants", label: "Participants" },
            { href: "/messages", label: "Messages" },
            { href: "/coordinator/profile", label: "More" },
          ]
        : ADMIN_NAV;
    case "employer":
      return [
        { href: "/employer", label: "Home" },
        { href: "/jobs", label: "Jobs" },
        { href: "/messages", label: "Messages" },
        { href: "/employer/profile", label: "More" },
      ];
    default:
      return [{ href: "/dashboard", label: "Home" }];
  }
}
