import type { CurrentUser } from "@/lib/auth/current-user";
import {
  getAccountCentrePersona,
  userHasPermission,
} from "@/lib/auth/account-access";
import type { AccountCentrePersona } from "@/lib/auth/account-access";
import type { Permission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";

export type DashboardNavLinkDef = {
  href: string;
  label: string;
  anyPermission?: Permission[];
  /** If set, link only shown for these personas (plus mapable_admin sees all via dashboard layout admin link) */
  personas?: AccountCentrePersona[];
};

const ALL_LINKS: DashboardNavLinkDef[] = [
  { href: "/dashboard", label: "Control panel" },
  { href: "/dashboard/account", label: "Accounts", anyPermission: ["account:read:self"] },
  { href: "/dashboard/profile", label: "Profile", anyPermission: ["profile:read:self"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/accessibility", label: "Accessibility", anyPermission: ["accessibility:read:self"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/consent", label: "Consent", anyPermission: ["consent:manage:self"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/bookings", label: "Bookings", anyPermission: ["booking:read:self", "booking:read:any"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/care", label: "Care", anyPermission: ["care:read:self"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/transport", label: "Transport trips", anyPermission: ["transport:read:self", "transport:manage:self"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/jobs", label: "Jobs", anyPermission: ["jobs:read:public", "jobs:apply"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/calendar", label: "Calendar", anyPermission: ["calendar:read:self", "calendar:read:org"] },
  { href: "/dashboard/find-support", label: "Find support", anyPermission: ["search:providers"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/find-transport", label: "Find transport", anyPermission: ["transport:read:self"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/timesheets", label: "Timesheets", anyPermission: ["timesheet:read:self", "timesheet:manage:org", "timesheet:approve:self"] },
  { href: "/dashboard/safety", label: "Safety centre", anyPermission: ["incident:create", "incident:read:self", "support:create"] },
  { href: "/dashboard/notifications", label: "Notifications", anyPermission: ["notification:read:self"] },
  { href: "/dashboard/messages", label: "Messages", anyPermission: ["message:read"] },
  { href: "/dashboard/documents", label: "Documents", anyPermission: ["document:read"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/billing", label: "Billing centre", anyPermission: ["invoice:read:self"], personas: ["participant", "coordinator", "other"] },
  { href: "/dashboard/settings/notifications", label: "Notification settings", anyPermission: ["notification:read:self"] },
];

function linkVisible(user: CurrentUser, link: DashboardNavLinkDef): boolean {
  const persona = getAccountCentrePersona(user);

  if (link.personas && !link.personas.includes(persona)) {
    return false;
  }
  if (link.anyPermission?.length) {
    return link.anyPermission.some((p) => userHasPermission(user, p));
  }
  return true;
}

export function getDashboardNavLinks(user: CurrentUser): { href: string; label: string }[] {
  if (user.roles.some((r) => isAdminRole(r))) {
    return ALL_LINKS.filter(
      (link) =>
        !link.anyPermission ||
        link.anyPermission.some((p) => userHasPermission(user, p))
    ).map(({ href, label }) => ({ href, label }));
  }

  const persona = getAccountCentrePersona(user);
  const base = ALL_LINKS.filter((link) => linkVisible(user, link)).map(
    ({ href, label }) => ({ href, label })
  );

  if (persona === "provider") {
    const providerExtras = [
      { href: "/provider/bookings", label: "Provider console" },
    ];
    const withoutParticipantOnly = base.filter(
      (l) =>
        ![
          "/dashboard/profile",
          "/dashboard/accessibility",
          "/dashboard/consent",
          "/dashboard/find-support",
          "/dashboard/find-transport",
          "/dashboard/care",
          "/dashboard/transport",
          "/dashboard/jobs",
          "/dashboard/billing",
          "/dashboard/bookings",
        ].includes(l.href)
    );
    return [...withoutParticipantOnly, ...providerExtras];
  }

  if (persona === "worker") {
    const workerCore = base.filter((l) =>
      [
        "/dashboard",
        "/dashboard/account",
        "/dashboard/calendar",
        "/dashboard/timesheets",
        "/dashboard/safety",
        "/dashboard/notifications",
        "/dashboard/messages",
        "/dashboard/settings/notifications",
      ].includes(l.href)
    );
    return [...workerCore, { href: "/worker/today", label: "Worker today" }];
  }

  return base;
}
