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
  { href: "/care", label: "Care", description: "Care portal" },
  {
    href: "/dashboard/billing",
    label: "Billing centre",
    description: "Invoices and payment management",
  },
  { href: "/dashboard/safety", label: "Safety centre" },
  {
    href: "/provider-finder",
    label: "Provider finder",
    description: "Search registered providers",
  },
  { href: "/access", label: "Access map", description: "Accessibility map and reviews" },
  { href: "/worker", label: "Worker portal", description: "Support worker tools" },
  { href: "/driver", label: "Driver portal", description: "Trips and tracking" },
  { href: "/employer", label: "Employer portal", description: "Jobs and applications" },
  { href: "/plan-manager", label: "Plan manager" },
  { href: "/support-coordinator", label: "Support coordinator" },
  { href: "/provider/bookings", label: "Provider console" },
  { href: "/admin", label: "Admin" },
  { href: "/login", label: "Sign in" },
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
  { href: "/accreditation", label: "Accreditation" },
];

export const CORE_HUB_SECTIONS: {
  title: string;
  links: CoreNavLink[];
}[] = [
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
      { href: "/messages", label: "Messages", description: "Communication centre" },
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
      { href: "/dashboard/care", label: "Care" },
      { href: "/dashboard/billing", label: "Billing centre" },
      { href: "/dashboard/safety", label: "Safety centre" },
      { href: "/dashboard/transport", label: "Transport trips" },
      { href: "/care", label: "Care portal", description: "Standalone care module" },
      { href: "/data-vault", label: "Data vault", description: "Export or portability requests" },
      {
        href: "/provider-finder",
        label: "Provider finder",
        description: "Search registered providers",
      },
    ],
  },
  {
    title: "Role portals",
    links: [
      { href: "/worker", label: "Support worker", description: "Today's tasks and service logs" },
      { href: "/driver", label: "Driver", description: "Trips and schedule" },
      { href: "/employer", label: "Employer", description: "Jobs and applications" },
      { href: "/plan-manager", label: "Plan manager", description: "Plan management portal" },
      {
        href: "/support-coordinator",
        label: "Support coordinator",
        description: "Coordination tools",
      },
      {
        href: "/practitioner/scheduling",
        label: "Practitioner",
        description: "Practitioner scheduling",
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
    title: "Civic participation",
    links: CORE_CIVIC_LINKS.filter((l) =>
      ["/membership", "/investment-models"].includes(l.href)
    ),
  },
  {
    title: "For providers & partners",
    links: [
      {
        href: "/provider/bookings",
        label: "Provider console",
        description: "Manage bookings and care",
      },
      { href: "/enterprise-provider", label: "Enterprise console" },
      { href: "/provider-admin", label: "Provider admin", description: "Multi-tenant management" },
      { href: "/academy", label: "Provider academy" },
      { href: "/assessor", label: "Assessor tools" },
      { href: "/accreditation", label: "Accreditation" },
      { href: "/government-partner", label: "Government partner portal" },
    ],
  },
  {
    title: "Platform admin",
    links: [
      { href: "/admin", label: "Admin console", description: "Platform administration" },
    ],
  },
];
