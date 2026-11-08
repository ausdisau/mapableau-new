/**
 * Typed participant workspace navigation.
 * Destinations must be existing routes — no invented 404 URLs.
 */

export type ParticipantNavLink = {
  href: string;
  label: string;
  /** Exact pathname match for aria-current (e.g. Home). */
  exact?: boolean;
  matchPrefix?: string;
  description?: string;
  children?: ParticipantNavLink[];
};

export type ParticipantNavGroup = {
  id: "your-life" | "your-information" | "choice-safety";
  label: string;
  items: ParticipantNavLink[];
};

export const PARTICIPANT_NAV_GROUPS: ParticipantNavGroup[] = [
  {
    id: "your-life",
    label: "Your life",
    items: [
      {
        href: "/dashboard",
        label: "Home / My Day",
        exact: true,
        description: "Today’s arrangements and actions",
      },
      {
        href: "/care",
        label: "Care",
        matchPrefix: "/care",
        children: [
          { href: "/care/bookings", label: "Care bookings" },
          { href: "/dashboard/careos", label: "My CareOS" },
        ],
      },
      {
        href: "/dashboard/transport",
        label: "Transport",
        matchPrefix: "/dashboard/transport",
        children: [
          { href: "/dashboard/find-transport", label: "Find transport" },
        ],
      },
      {
        href: "/dashboard/bookings",
        label: "Bookings / Calendar",
        matchPrefix: "/dashboard/bookings",
        children: [
          { href: "/dashboard/calendar", label: "Calendar" },
        ],
      },
      {
        href: "/dashboard/find-support",
        label: "Find Places & Services",
        matchPrefix: "/dashboard/find-support",
        children: [
          { href: "/provider-finder", label: "Provider finder" },
        ],
      },
      {
        href: "/dashboard/messages",
        label: "Messages",
        matchPrefix: "/dashboard/messages",
      },
    ],
  },
  {
    id: "your-information",
    label: "Your information",
    items: [
      {
        href: "/dashboard/profile",
        label: "Personal Details",
        matchPrefix: "/dashboard/profile",
        description: "About you and profile picture",
      },
      {
        href: "/dashboard/accessibility",
        label: "Support & Accessibility",
        matchPrefix: "/dashboard/accessibility",
        children: [
          { href: "/dashboard/support-profile", label: "Support profile" },
        ],
      },
      {
        href: "/dashboard/billing",
        label: "Payments & Agreements",
        matchPrefix: "/dashboard/billing",
        children: [
          { href: "/dashboard/invoices", label: "Invoices" },
          { href: "/dashboard/funding", label: "Funding" },
          { href: "/dashboard/documents", label: "Documents" },
        ],
      },
    ],
  },
  {
    id: "choice-safety",
    label: "Choice & safety",
    items: [
      {
        href: "/dashboard/consent",
        label: "Privacy, Consent & Delegates",
        matchPrefix: "/dashboard/consent",
      },
      {
        href: "/dashboard/settings/notifications",
        label: "Account & Security",
        matchPrefix: "/dashboard/settings",
      },
      {
        href: "/dashboard/safety",
        label: "Help & Safety",
        matchPrefix: "/dashboard/safety",
        description: "Always available, including when AI is off",
        children: [
          { href: "/dashboard/engagement", label: "Your voice" },
          { href: "/dashboard/incidents", label: "Incidents" },
        ],
      },
    ],
  },
];

/** Flat legacy deep links retained for redirects/tests — all still valid. */
export const LEGACY_DASHBOARD_DEEP_LINKS = [
  "/dashboard",
  "/dashboard/profile",
  "/dashboard/accessibility",
  "/dashboard/consent",
  "/dashboard/bookings",
  "/care",
  "/dashboard/transport",
  "/dashboard/jobs",
  "/dashboard/calendar",
  "/dashboard/find-support",
  "/dashboard/find-transport",
  "/dashboard/safety",
  "/dashboard/engagement",
  "/dashboard/messages",
  "/dashboard/documents",
  "/dashboard/billing",
  "/dashboard/settings/notifications",
  "/dashboard/notifications",
] as const;

export function isNavLinkActive(
  pathname: string,
  link: Pick<ParticipantNavLink, "href" | "exact" | "matchPrefix">,
): boolean {
  if (link.exact) return pathname === link.href;
  const prefix = link.matchPrefix ?? link.href;
  return pathname === link.href || pathname.startsWith(`${prefix}/`);
}

export function flattenParticipantNavLinks(
  groups: ParticipantNavGroup[] = PARTICIPANT_NAV_GROUPS,
): ParticipantNavLink[] {
  const out: ParticipantNavLink[] = [];
  for (const group of groups) {
    for (const item of group.items) {
      out.push(item);
      if (item.children) out.push(...item.children);
    }
  }
  return out;
}
