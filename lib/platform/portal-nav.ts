import type { PortalNavLink } from "@/components/core/PortalNav";

import type { PortalModuleConfig } from "@/lib/platform/types";

export const CARE_NAV_LINKS: PortalNavLink[] = [
  { href: "/care/request", label: "Request care" },
  { href: "/care/bookings", label: "Bookings" },
  { href: "/care/service-logs", label: "Service logs" },
  { href: "/care/find", label: "Find providers" },
];

export const WORKER_NAV_LINKS: PortalNavLink[] = [
  { href: "/worker/today", label: "Today" },
  { href: "/worker/service-log", label: "Service log" },
  { href: "/worker/report-issue", label: "Report issue" },
];

export const EMPLOYER_NAV_LINKS: PortalNavLink[] = [
  { href: "/employer/jobs", label: "Jobs" },
  { href: "/employer/applications", label: "Applications" },
  { href: "/employer/calendar", label: "Calendar" },
];

export const DRIVER_NAV_LINKS: PortalNavLink[] = [
  { href: "/driver/trips", label: "Trips" },
  { href: "/driver/profile", label: "Profile" },
];

export const PROVIDER_NAV_LINKS: PortalNavLink[] = [
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
  { href: "/enterprise-provider", label: "Enterprise" },
];

export const PORTAL_MODULES: Record<string, PortalModuleConfig> = {
  care: {
    key: "care",
    title: "MapAble Care",
    links: CARE_NAV_LINKS,
  },
  worker: {
    key: "worker",
    title: "Worker",
    links: WORKER_NAV_LINKS,
  },
  employer: {
    key: "employer",
    title: "Employer",
    links: EMPLOYER_NAV_LINKS,
  },
  driver: {
    key: "driver",
    title: "MapAble Driver",
    links: DRIVER_NAV_LINKS,
  },
  provider: {
    key: "provider",
    title: "Provider console",
    links: PROVIDER_NAV_LINKS,
  },
};
