import type { PortalNavLink } from "@/components/core/PortalNav";

export const PROVIDER_NAV_LINKS: PortalNavLink[] = [
  { href: "/provider", label: "Control panel" },
  { href: "/provider/bookings", label: "Bookings" },
  { href: "/provider/care", label: "Care" },
  { href: "/provider/care/requests", label: "Care inbox" },
  { href: "/provider/care/roster", label: "Care roster" },
  { href: "/provider/care/service-logs", label: "Care logs" },
  { href: "/provider/care/shifts", label: "Shifts" },
  { href: "/provider/transport", label: "Transport" },
  { href: "/provider/workers", label: "Workers" },
  { href: "/provider/vehicles", label: "Vehicles" },
  { href: "/provider/drivers", label: "Drivers" },
  { href: "/provider/calendar", label: "Calendar" },
  { href: "/provider/capacity", label: "Capacity" },
  { href: "/provider/messages", label: "Messages" },
  { href: "/provider/billing", label: "Billing" },
  { href: "/provider/ndia-claims", label: "NDIA claims" },
  { href: "/provider/ndis-claims/ready", label: "NDIS claiming" },
  { href: "/provider/support", label: "Support" },
];
