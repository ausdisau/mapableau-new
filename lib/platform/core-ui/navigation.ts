import { isParticipantInformationVaultEnabled } from "@/lib/privacy/participant-vault/flags";

export type CoreNavLink = {
  href: string;
  label: string;
  description?: string;
};

export const CORE_PLATFORM_LINKS: CoreNavLink[] = [
  { href: "/core", label: "Home" },
  { href: "/ask", label: "Ask MapAble", description: "Co-Pilot + PRMS" },
  {
    href: "/dashboard",
    label: "Control panel",
    description: "Your profile, bookings, care and scheduled transport trips",
  },
  { href: "/login", label: "Sign in" },
  {
    href: "/provider",
    label: "Provider control panel",
    description: "Workers, care inbox, roster, billing and NDIS claiming",
  },
  { href: "/admin", label: "Admin" },
];

export const CORE_CIVIC_LINKS: CoreNavLink[] = [
  { href: "/peers", label: "MapAble PEERS", description: "Disability community without feed algorithms" },
  { href: "/transparency", label: "Transparency" },
  { href: "/accountability", label: "Accountability" },
  { href: "/decisions", label: "Decisions" },
  { href: "/governance", label: "Governance" },
  { href: "/safeguards", label: "Safeguards" },
  { href: "/algorithms", label: "Algorithms" },
  { href: "/oversight", label: "Oversight" },
  { href: "/outcomes", label: "Outcomes" },
  { href: "/status", label: "Status" },
  { href: "/insights/national", label: "National insights" },
  { href: "/membership", label: "Membership" },
  { href: "/investment-models", label: "Investment models" },
  { href: "/ecosystem", label: "API ecosystem" },
  { href: "/partners/certified", label: "Certified partners" },
  { href: "/research-federation", label: "Research federation" },
  { href: "/audit-index", label: "Civic audit" },
  { href: "/reports/data-trust", label: "Data trust reports" },
  { href: "/sustainability", label: "Sustainability" },
  { href: "/accreditation", label: "Accreditation" },
];

export const CORE_HUB_SECTIONS: {
  title: string;
  links: CoreNavLink[];
}[] = [
  {
    title: "MapAble services",
    links: [
      {
        href: "/care",
        label: "MapAble Care",
        description: "Find support workers, request care, and confirm service delivery",
      },
      {
        href: "/transport",
        label: "MapAble Transport",
        description: "Book accessible transport and manage scheduled trips",
      },
      {
        href: "/dashboard/jobs",
        label: "MapAble Jobs",
        description: "Inclusive employment opportunities",
      },
      {
        href: "/access",
        label: "MapAble Access",
        description: "Accessibility map and place reviews",
      },
      {
        href: "/provider-finder",
        label: "Provider finder",
        description: "Search NDIS providers and support services",
      },
    ],
  },
  {
    title: "Community",
    links: [
      {
        href: "/peers",
        label: "MapAble PEERS",
        description: "Rooms and discussion — chronological, not algorithmic",
      },
      {
        href: "/access",
        label: "MapAble Access",
        description: "Accessibility map and community place reviews",
      },
    ],
  },
  {
    title: "Your services",
    links: [
      {
        href: "/ask",
        label: "Ask MapAble",
        description: "Co-Pilot guidance with PRMS records underneath",
      },
      {
        href: "/dashboard",
        label: "Control panel",
        description: "Bookings, care, scheduled transport trips and profile",
      },
      { href: "/dashboard/bookings", label: "Bookings" },
      {
        href: "/care",
        label: "MapAble Care",
        description: "Support workers, bookings and service logs",
      },
      { href: "/dashboard/billing", label: "Billing centre" },
      { href: "/dashboard/safety", label: "Safety centre" },
      {
        href: "/transport",
        label: "MapAble Transport",
        description: "Accessible trips and operator search",
      },
      {
        href: "/data-vault",
        label: "Export and deletion",
        description: "Platform export, portability and deletion requests",
      },
    ],
  },
  {
    title: "Public accountability",
    links: CORE_CIVIC_LINKS.filter((l) =>
      ["/transparency", "/accountability", "/decisions", "/governance", "/safeguards"].includes(
        l.href
      )
    ),
  },
  {
    title: "Platform transparency",
    links: CORE_CIVIC_LINKS.filter((l) =>
      ["/algorithms", "/oversight", "/outcomes", "/status", "/insights/national"].includes(
        l.href
      )
    ),
  },
  {
    title: "For providers & partners",
    links: [
      {
        href: "/provider",
        label: "Provider control panel",
        description: "Enterprise workspace metrics and provider operations",
      },
      { href: "/academy", label: "Provider academy" },
      { href: "/assessor", label: "Assessor tools" },
      { href: "/accreditation", label: "Accreditation" },
    ],
  },
];

const INFORMATION_VAULT_LINK: CoreNavLink = {
  href: "/vault",
  label: "Information vault",
  description: "Your identity documents, plans and sharing",
};

/**
 * Hub sections with the information vault link only when the flag is on.
 * Keep CORE_HUB_SECTIONS static so default production nav does not change.
 */
export function getCoreHubSections(
  environment: NodeJS.ProcessEnv = process.env,
): typeof CORE_HUB_SECTIONS {
  if (!isParticipantInformationVaultEnabled(environment)) {
    return CORE_HUB_SECTIONS;
  }
  return CORE_HUB_SECTIONS.map((section) => {
    if (section.title !== "Your services") return section;
    if (section.links.some((link) => link.href === "/vault")) return section;
    return {
      ...section,
      links: [...section.links, INFORMATION_VAULT_LINK],
    };
  });
}
