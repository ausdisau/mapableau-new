export type MapAbleMarketingNavItem = {
  label: string;
  href: string;
  hasDropdown?: boolean;
};

/** Primary marketing navigation (public site header). */
export const MAPABLE_MARKETING_NAV: MapAbleMarketingNavItem[] = [
  {
    label: "Find support",
    href: "/provider-finder",
    hasDropdown: true,
  },
  {
    label: "Become a support worker",
    href: "/register",
    hasDropdown: true,
  },
  {
    label: "Coordinators and providers",
    href: "/provider-finder",
    hasDropdown: true,
  },
  {
    label: "Pricing",
    href: "/membership",
    hasDropdown: false,
  },
  {
    label: "More",
    href: "/core",
    hasDropdown: true,
  },
];

export const MAPABLE_MARKETING_UTILITY_LINKS = [
  { label: "Contact us", href: "/dashboard/support/new" },
  { label: "Help Centre", href: "/ask" },
] as const;
