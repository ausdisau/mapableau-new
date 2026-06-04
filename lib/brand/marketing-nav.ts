import type { MapAbleNavGroup, MapAbleNavItem } from "@/components/brand/MapAbleSiteHeader";

export const MAPABLE_MARKETING_NAV: MapAbleNavItem[] = [
  { href: "/provider-finder", label: "Providers" },
  { href: "/access", label: "Access" },
  { href: "/care", label: "Care" },
  { href: "/transport", label: "Transport" },
  { href: "/employment", label: "Employment" },
  { href: "/provider-finder#how-it-works", label: "How it works" },
  { href: "/register", label: "List your service" },
];

export const MAPABLE_MARKETING_NAV_GROUPS: MapAbleNavGroup[] = [
  {
    title: "Find support",
    items: [
      { href: "/provider-finder", label: "Providers" },
      { href: "/access", label: "Access" },
    ],
  },
  {
    title: "Services",
    items: [
      {
        href: "/care",
        label: "Care",
        description: "Find support workers, request care, and confirm service delivery",
      },
      {
        href: "/transport",
        label: "Transport",
        description: "Book accessible transport and manage scheduled trips",
      },
      {
        href: "/employment",
        label: "Employment",
        description: "Inclusive employment opportunities",
      },
    ],
  },
  {
    title: "Get involved",
    items: [
      { href: "/provider-finder#how-it-works", label: "How it works" },
      { href: "/register", label: "List your service" },
    ],
  },
];
