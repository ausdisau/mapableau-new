import type {
  MapAbleNavGroup,
  MapAbleNavItem,
} from "@/components/brand/MapAbleSiteHeader";

export const MAPABLE_MARKETING_NAV: MapAbleNavItem[] = [
  { href: "/care", label: "Care" },
  { href: "/transport", label: "Transport" },
  { href: "/employment", label: "Employment" },
  { href: "/providers", label: "Providers" },
  { href: "/resources", label: "Resources" },
];

export const MAPABLE_MARKETING_NAV_GROUPS: MapAbleNavGroup[] = [
  {
    title: "Find support",
    items: [
      { href: "/providers", label: "Providers" },
      { href: "/provider-finder", label: "Provider finder" },
      { href: "/care", label: "Care" },
      { href: "/transport", label: "Transport" },
      { href: "/employment", label: "Employment" },
      { href: "/access", label: "Accessible places" },
    ],
  },
  {
    title: "Guidance",
    items: [
      {
        href: "/ask",
        label: "Ask MapAble",
        description: "Plain-language NDIS and support guidance",
      },
      {
        href: "/provider-finder#how-it-works",
        label: "How it works",
        description: "Compare options and take the next step with confidence",
      },
      {
        href: "/resources",
        label: "Resources",
        description: "Participant, provider and policy resources",
      },
      {
        href: "/help",
        label: "Help Centre",
        description: "Support for pilot interest, privacy and access requests",
      },
    ],
  },
  {
    title: "Get involved",
    items: [
      { href: "/for-providers", label: "Register provider interest" },
      { href: "/contact", label: "Contact MapAble" },
      { href: "/provider", label: "Provider console" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];
