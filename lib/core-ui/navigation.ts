export type CoreNavLink = {
  href: string;
  label: string;
  description?: string;
};

/** Hero copy for `/core` — aligned with Master Business Plan single-account language. */
export const CORE_HUB_HERO = {
  eyebrow: "MapAble Core · Australian Disability Ltd",
  titleLead: "One account for care, transport",
  titleAccent: "and employment",
  description:
    "MapAble Core is the ecosystem backbone: a single secure account, billing and subscriptions in one place, unified messaging, and support when you need it. Built for participants, providers and administrators — consent-aware by default, with plain language and accessible design.",
  socialEnterpriseNote:
    "MapAble is an Australian Disability Ltd social-enterprise initiative — disability justice, transparency and participant control are built in, not bolted on.",
} as const;

export const CORE_PLATFORM_LINKS: CoreNavLink[] = [
  { href: "/core", label: "Home" },
  { href: "/ask", label: "Ask MapAble", description: "Co-Pilot + PRMS" },
  {
    href: "/dashboard",
    label: "Control panel",
    description: "Your profile, bookings, care and scheduled transport trips",
  },
  { href: "/login", label: "Sign in" },
  { href: "/provider/bookings", label: "Provider console" },
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
      { href: "/data-vault", label: "Data vault", description: "Export or portability requests" },
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
      { href: "/enterprise-provider", label: "Enterprise console" },
      { href: "/academy", label: "Provider academy" },
      { href: "/assessor", label: "Assessor tools" },
      { href: "/accreditation", label: "Accreditation" },
    ],
  },
];
