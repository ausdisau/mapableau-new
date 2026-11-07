import type { FooterLink } from "@/lib/marketing/mapable-care-combined-data";
import { marketingFeatureRoutes } from "@/lib/marketing/mapable-care-routes";

export type MarketingNavItem = {
  label: string;
  href: string;
  description: string;
};

export type MarketingNavGroup = {
  id: string;
  label: string;
  description: string;
  items: MarketingNavItem[];
};

const placesLabItem: MarketingNavItem | null =
  process.env.NEXT_PUBLIC_MAPABLE_PLACES_PROTOTYPE_ENABLED === "true"
    ? {
        label: "Places Lab",
        href: "/places",
        description: "Experimental place discovery prototypes and labs.",
      }
    : null;

/**
 * Desktop megamenu groups — kept in sync with homepage Explore and footer Platform links.
 */
export function getMarketingNavGroups(): MarketingNavGroup[] {
  const exploreItems: MarketingNavItem[] = [
    {
      label: "Accessible places",
      href: "/accessibility-map",
      description:
        "Browse venues with access notes, measurements and confidence levels.",
    },
    ...(placesLabItem ? [placesLabItem] : []),
    {
      label: "Local Access Guides",
      href: "/guides",
      description: "City and regional accessibility guides you can download.",
    },
    {
      label: "Providers",
      href: "/providers",
      description: "Discover providers and list interest for the pilot.",
    },
    {
      label: "Provider finder",
      href: "/provider-finder",
      description: "Search care, transport, jobs and places in one flow.",
    },
  ];

  const programmeItems: MarketingNavItem[] = [
    {
      label: "Care",
      href: "/care",
      description: "How consent-aware care coordination is intended to work.",
    },
    {
      label: "Transport",
      href: "/transport",
      description: "Accessible journey planning — informational programme pages.",
    },
    {
      label: "Employment",
      href: "/employment",
      description: "Inclusive work pathways and workplace adjustment support.",
    },
    {
      label: "Marketplace",
      href: marketingFeatureRoutes.marketplace,
      description: "Year-one marketplace explainer — separately gated when live.",
    },
  ];

  const supportItems: MarketingNavItem[] = [
    {
      label: "NDIS Guidance",
      href: marketingFeatureRoutes.ask,
      description: "Plain-language NDIS questions — not claim submission.",
    },
    {
      label: "Resources",
      href: "/resources",
      description: "Articles, explainers and reference material.",
    },
    {
      label: "Help Centre",
      href: "/help",
      description: "Pilot interest, privacy and access help.",
    },
    {
      label: "Contact",
      href: "/contact",
      description: "Reach the MapAble team.",
    },
  ];

  return [
    {
      id: "explore",
      label: "Explore",
      description: "Maps, guides and discovery",
      items: exploreItems,
    },
    {
      id: "programmes",
      label: "Programmes",
      description: "Care, transport and work explainers",
      items: programmeItems,
    },
    {
      id: "support",
      label: "Support",
      description: "Guidance and help",
      items: supportItems,
    },
  ];
}

/** Single flat list for sitemap-style consumers and tests. */
export function getAllMarketingNavItems(): MarketingNavItem[] {
  return getMarketingNavGroups().flatMap((g) => g.items);
}

export type MarketingBreadcrumb = { label: string; href: string };

const PATH_SEGMENT_LABELS: Record<string, string> = {
  care: "Care",
  transport: "Transport",
  employment: "Employment",
  marketplace: "Marketplace",
  providers: "Providers",
  "provider-finder": "Provider finder",
  "accessibility-map": "Accessible places",
  access: "Access",
  places: "Places Lab",
  guides: "Local Access Guides",
  ask: "NDIS Guidance",
  resources: "Resources",
  help: "Help Centre",
  contact: "Contact",
  about: "About",
  privacy: "Privacy",
  terms: "Terms of Service",
  peer: "PEERS",
  telehealth: "Telehealth",
  "for-providers": "For providers",
  pricing: "Pricing",
  "accessibility-statement": "Accessibility",
  "data-deletion": "Data deletion",
  login: "Sign in",
  register: "Get started",
  dashboard: "Dashboard",
};

/**
 * Builds Home → … breadcrumbs from a pathname. Skips home-only; uses last segment as current page.
 */
export function buildMarketingBreadcrumbs(pathname: string | null): MarketingBreadcrumb[] {
  if (!pathname || pathname === "/") return [];

  const segments = pathname.split("/").filter(Boolean);
  const crumbs: MarketingBreadcrumb[] = [{ label: "Home", href: "/" }];

  let path = "";
  for (let i = 0; i < segments.length; i++) {
    const segment = segments[i];
    path += `/${segment}`;
    const isLast = i === segments.length - 1;
    const label = (() => {
      const mapped = PATH_SEGMENT_LABELS[segment];
      if (mapped) return mapped;
      if (/^[a-z]{2,3}$/i.test(segment)) {
        return segment.toUpperCase();
      }
      return segment
        .split("-")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");
    })();

    if (isLast) {
      crumbs.push({ label, href: path });
    } else {
      crumbs.push({ label, href: path });
    }
  }

  return crumbs;
}

const RELATED_OVERRIDES: Record<string, FooterLink[]> = {
  "/care": [
    { label: "Provider finder", href: "/provider-finder?area=Care" },
    { label: "Transport", href: "/transport" },
    { label: "Help Centre", href: "/help" },
  ],
  "/transport": [
    { label: "Provider finder", href: "/provider-finder?area=Transport" },
    { label: "Care", href: "/care" },
    { label: "Accessible places", href: "/accessibility-map" },
  ],
  "/employment": [
    { label: "Provider finder", href: "/provider-finder?area=Jobs" },
    { label: "Care", href: "/care" },
    { label: "Resources", href: "/resources" },
  ],
  "/marketplace": [
    { label: "Providers", href: "/providers" },
    { label: "Provider finder", href: "/provider-finder" },
    { label: "Contact", href: "/contact" },
  ],
  "/telehealth": [
    { label: "Help Centre", href: "/help" },
    { label: "Privacy", href: "/privacy" },
    { label: "Contact", href: "/contact" },
  ],
  "/peer": [
    { label: "About MapAble", href: "/about" },
    { label: "Resources", href: "/resources" },
    { label: "Contact", href: "/contact" },
  ],
};

function defaultRelatedFromExplore(currentHref: string): FooterLink[] {
  const blocked = new Set([
    "/care",
    "/transport",
    "/employment",
    "/marketplace",
    "/foods",
    "/kids",
    "/moves",
  ]);
  const fromExplore = [
    { label: "Care", href: "/care" },
    { label: "Transport", href: "/transport" },
    { label: "Employment", href: "/employment" },
    { label: "Marketplace", href: "/marketplace" },
    { label: "Foods", href: "/foods" },
    { label: "Kids", href: "/kids" },
    { label: "Moves", href: "/moves" },
    { label: "Accessible places", href: "/accessibility-map" },
    { label: "Provider finder", href: "/provider-finder" },
  ].filter((item) => item.href !== currentHref && !blocked.has(item.href));

  return fromExplore.slice(0, 6);
}

/** Contextual backlinks for module explainer pages (replaces a single static chip list). */
export function getPublicModuleRelatedLinks(currentHref: string): FooterLink[] {
  const normalized = currentHref.split("?")[0] ?? currentHref;
  const override = RELATED_OVERRIDES[normalized];
  if (override) return override;
  return defaultRelatedFromExplore(normalized);
}
