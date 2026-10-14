export type PublicDiscoveryGroup =
  | "discover"
  | "participate"
  | "programme";

export type PublicDiscoveryRoute = {
  path: string;
  label: string;
  description: string;
  group: PublicDiscoveryGroup;
};

export const PUBLIC_DISCOVERY_ROUTES: readonly PublicDiscoveryRoute[] = [
  {
    path: "/access",
    label: "MapAble Access",
    description: "Public access information, venue profiles and access-note concepts.",
    group: "discover",
  },
  {
    path: "/accessibility-map",
    label: "Accessibility map",
    description: "Explore public accessibility information and evidence for places.",
    group: "discover",
  },
  {
    path: "/providers",
    label: "Providers",
    description: "Browse public provider discovery information.",
    group: "discover",
  },
  {
    path: "/provider-finder",
    label: "Provider finder",
    description: "Search public provider and service discovery information.",
    group: "discover",
  },
  {
    path: "/journey-planner",
    label: "Journey planner",
    description: "Explore the public journey-planning surface.",
    group: "discover",
  },
  {
    path: "/compare",
    label: "Compare",
    description: "Compare public MapAble options and programme information.",
    group: "discover",
  },
  {
    path: "/pricing",
    label: "Pricing",
    description: "Review the public status of MapAble pricing and billing models.",
    group: "participate",
  },
  {
    path: "/for-providers",
    label: "For providers",
    description: "Provider interest, onboarding information and public next steps.",
    group: "participate",
  },
  {
    path: "/mapping-days",
    label: "Mapping days",
    description: "Community accessibility mapping information and participation.",
    group: "participate",
  },
  {
    path: "/add-access-info",
    label: "Add access information",
    description: "Contribute public accessibility information through the governed intake path.",
    group: "participate",
  },
  {
    path: "/verify-my-venue",
    label: "Verify my venue",
    description: "Venue verification information and public next steps.",
    group: "participate",
  },
  {
    path: "/provider-growth",
    label: "Provider growth",
    description: "Public information for providers improving accessibility and discovery.",
    group: "participate",
  },
  {
    path: "/access-intelligence",
    label: "Access intelligence",
    description: "Learn about MapAble's evidence-led accessibility intelligence approach.",
    group: "participate",
  },
  {
    path: "/access-pass",
    label: "Access Pass",
    description: "Explore the public Access Pass concept and its current status.",
    group: "participate",
  },
  {
    path: "/peer",
    label: "MapAble Peer",
    description: "Public information about lived-experience community features.",
    group: "programme",
  },
  {
    path: "/telehealth",
    label: "MapAble Telehealth",
    description: "Public information about accessible remote-support workflows.",
    group: "programme",
  },
] as const;

export function publicDiscoverySitemapPaths(): string[] {
  return PUBLIC_DISCOVERY_ROUTES.map((route) => route.path);
}

export function publicDiscoveryRoutesByGroup(
  group: PublicDiscoveryGroup,
): readonly PublicDiscoveryRoute[] {
  return PUBLIC_DISCOVERY_ROUTES.filter((route) => route.group === group);
}
