export type CoreNavLink = {
  href: string;
  label: string;
  description?: string;
};

export const CORE_PLATFORM_LINKS: CoreNavLink[] = [
  { href: "/core", label: "Home" },
  { href: "/ask", label: "Ask MapAble", description: "Co-Pilot + PRMS" },
  { href: "/dashboard", label: "Dashboard", description: "Your profile, bookings and care" },
  { href: "/login", label: "Sign in" },
  { href: "/provider/bookings", label: "Provider console" },
  { href: "/admin", label: "Admin" },
];

export const CORE_CIVIC_LINKS: CoreNavLink[] = [
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
    title: "Your services",
    links: [
      {
        href: "/ask",
        label: "Ask MapAble",
        description: "Co-Pilot guidance with PRMS records underneath",
      },
      { href: "/dashboard", label: "Dashboard", description: "Bookings, care, transport and profile" },
      { href: "/dashboard/bookings", label: "Bookings" },
      { href: "/dashboard/care", label: "Care" },
      {
        href: "/care/support",
        label: "Care & support",
        description: "Support needs assessment, referrals, and coordination",
      },
      { href: "/dashboard/transport", label: "Transport" },
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
