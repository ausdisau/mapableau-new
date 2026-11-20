import type { OneNavLink } from "@/components/mapable-one";
import { PROVIDER_NAV_LINKS } from "@/lib/platform/core-ui/provider-nav";
import type { MapAbleWorkspaceId } from "@/lib/mapable-one/workspace-access";

export const CORE_ONE_NAV: OneNavLink[] = [
  { href: "/dashboard", label: "My Day", exact: true },
  { href: "/care", label: "Care" },
  { href: "/dashboard/transport", label: "Transport" },
  { href: "/dashboard/bookings", label: "Bookings" },
  { href: "/dashboard/calendar", label: "Calendar" },
  { href: "/dashboard/messages", label: "Messages" },
  { href: "/dashboard/profile", label: "Profile" },
];

export const PROVIDER_ONE_NAV: OneNavLink[] = PROVIDER_NAV_LINKS.map((l) => ({
  href: l.href,
  label: l.label,
  exact: l.match === "exact",
}));

export const WORKER_ONE_NAV: OneNavLink[] = [
  { href: "/worker/today", label: "Today" },
  { href: "/worker/schedule", label: "Schedule" },
  { href: "/worker/service-log", label: "Service log" },
  { href: "/worker/report-issue", label: "Report issue" },
  { href: "/worker/onboarding", label: "Onboarding" },
];

export const DRIVER_ONE_NAV: OneNavLink[] = [
  { href: "/driver/trips", label: "Trips" },
  { href: "/driver/profile", label: "Profile" },
];

export const EMPLOYER_ONE_NAV: OneNavLink[] = [
  { href: "/employer/jobs", label: "Jobs" },
  { href: "/employer/applications", label: "Applications" },
  { href: "/employer/calendar", label: "Calendar" },
];

export const ADMIN_ONE_NAV: OneNavLink[] = [
  { href: "/admin", label: "Command centre", exact: true },
  { href: "/admin/ops/participants", label: "Participants" },
  { href: "/admin/ops/workers", label: "Workers" },
  { href: "/admin/ops/bookings", label: "Bookings" },
  { href: "/admin/ops/safeguarding", label: "Safeguarding" },
  { href: "/admin/ops/billing", label: "Billing" },
  { href: "/admin/ops/compliance", label: "Compliance" },
  { href: "/admin/system-health", label: "System health" },
];

export const PLAN_MANAGER_ONE_NAV: OneNavLink[] = [
  { href: "/plan-manager", label: "Home", exact: true },
];

export const SUPPORT_COORDINATOR_ONE_NAV: OneNavLink[] = [
  { href: "/support-coordinator", label: "Home", exact: true },
];

export const MESSAGES_ONE_NAV: OneNavLink[] = [
  { href: "/messages", label: "Inbox", exact: true },
];

export const BILLING_ONE_NAV: OneNavLink[] = [
  { href: "/billing", label: "Billing centre", exact: true },
];

export const GOVERNMENT_ONE_NAV: OneNavLink[] = [
  { href: "/government-partner", label: "Home", exact: true },
];

export type OneShellChrome = {
  workspaceId: MapAbleWorkspaceId;
  workspaceLabel: string;
  logoHref: string;
  navLinks: OneNavLink[];
};

/**
 * Map role shell header titles (existing AuthenticatedRoleAppShell callers)
 * onto One chrome so every portal inherits the same skin.
 */
export function resolveOneShellChrome(headerTitle: string): OneShellChrome {
  const key = headerTitle.trim().toLowerCase();

  if (key === "provider") {
    return {
      workspaceId: "provider",
      workspaceLabel: "MapAble Provider",
      logoHref: "/provider",
      navLinks: PROVIDER_ONE_NAV,
    };
  }
  if (key === "worker") {
    return {
      workspaceId: "worker",
      workspaceLabel: "MapAble Worker",
      logoHref: "/worker/today",
      navLinks: WORKER_ONE_NAV,
    };
  }
  if (key === "driver") {
    return {
      workspaceId: "driver",
      workspaceLabel: "MapAble Driver",
      logoHref: "/driver/trips",
      navLinks: DRIVER_ONE_NAV,
    };
  }
  if (key === "employer") {
    return {
      workspaceId: "employer",
      workspaceLabel: "MapAble Employer",
      logoHref: "/employer/jobs",
      navLinks: EMPLOYER_ONE_NAV,
    };
  }
  if (key === "admin") {
    return {
      workspaceId: "admin",
      workspaceLabel: "MapAble Admin",
      logoHref: "/admin",
      navLinks: ADMIN_ONE_NAV,
    };
  }
  if (key === "plan manager") {
    return {
      workspaceId: "other",
      workspaceLabel: "Plan manager",
      logoHref: "/plan-manager",
      navLinks: PLAN_MANAGER_ONE_NAV,
    };
  }
  if (key === "support coordinator") {
    return {
      workspaceId: "other",
      workspaceLabel: "Support coordinator",
      logoHref: "/support-coordinator",
      navLinks: SUPPORT_COORDINATOR_ONE_NAV,
    };
  }
  if (key === "messages") {
    return {
      workspaceId: "core",
      workspaceLabel: "Messages",
      logoHref: "/messages",
      navLinks: MESSAGES_ONE_NAV,
    };
  }
  if (key === "billing" || key.startsWith("billing")) {
    return {
      workspaceId: "other",
      workspaceLabel: "Billing",
      logoHref: "/billing",
      navLinks: BILLING_ONE_NAV,
    };
  }
  if (key.includes("government")) {
    return {
      workspaceId: "other",
      workspaceLabel: "Government partner",
      logoHref: "/government-partner",
      navLinks: GOVERNMENT_ONE_NAV,
    };
  }

  return {
    workspaceId: "core",
    workspaceLabel: headerTitle || "MapAble Core",
    logoHref: "/dashboard",
    navLinks: CORE_ONE_NAV,
  };
}
