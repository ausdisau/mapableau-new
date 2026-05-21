export type CoreNavLink = {
  href: string;
  label: string;
  description?: string;
};

/** Links shown in the core header. */
export const CORE_PLATFORM_LINKS: CoreNavLink[] = [
  { href: "/core", label: "Home" },
  { href: "/ask", label: "Ask MapAble" },
  { href: "/dashboard", label: "Dashboard" },
  { href: "/provider-finder", label: "Provider finder" },
  { href: "/map", label: "Map" },
  { href: "/login", label: "Sign in" },
];

export const CORE_HUB_SECTIONS: {
  title: string;
  links: CoreNavLink[];
}[] = [
  {
    title: "Your account",
    links: [
      { href: "/dashboard", label: "Dashboard", description: "Your profile and tools" },
      { href: "/login", label: "Sign in" },
      { href: "/register", label: "Register" },
    ],
  },
  {
    title: "Find support",
    links: [
      {
        href: "/ask",
        label: "Ask MapAble",
        description: "Co-Pilot guidance with PRMS records underneath",
      },
      {
        href: "/provider-finder",
        label: "Provider finder",
        description: "Search NDIS and disability providers",
      },
      { href: "/map", label: "Accessibility map", description: "Explore places on the map" },
    ],
  },
  {
    title: "For providers",
    links: [
      {
        href: "/provider-admin",
        label: "Provider admin",
        description: "Manage your organisation profile",
      },
    ],
  },
];
