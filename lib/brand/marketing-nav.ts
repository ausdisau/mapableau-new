import type { MapAbleNavGroup, MapAbleNavItem } from "@/components/brand/MapAbleSiteHeader";

export const MAPABLE_MARKETING_NAV: MapAbleNavItem[] = [
  { href: "/", label: "Home" },
  { href: "/provider-finder", label: "Find support" },
  { href: "/access", label: "Places" },
  { href: "/ask", label: "NDIS help" },
  { href: "/provider-finder#how-it-works", label: "How it works" },
  { href: "/register", label: "List your service" },
];

export const MAPABLE_MARKETING_NAV_GROUPS: MapAbleNavGroup[] = [
  {
    title: "Find support",
    items: [
      { href: "/provider-finder", label: "Provider finder" },
      { href: "/provider-finder?area=Care", label: "Care" },
      { href: "/provider-finder?area=Transport", label: "Transport" },
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
    ],
  },
  {
    title: "Get involved",
    items: [
      { href: "/register", label: "List your service" },
      { href: "/provider", label: "Provider console" },
      { href: "/dashboard", label: "Dashboard" },
    ],
  },
];
