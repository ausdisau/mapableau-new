import type { CoreNavLink } from "@/lib/core-ui/navigation";

export type CoreServicePillar = {
  id: string;
  name: string;
  tagline: string;
  description: string;
  primaryHref: string;
  primaryLabel: string;
  secondaryLinks: CoreNavLink[];
};

/** Three service offerings from the Master Business Plan — live deep links. */
export const CORE_SERVICE_PILLARS: CoreServicePillar[] = [
  {
    id: "care",
    name: "Care",
    tagline: "Compassionate support",
    description:
      "Book support workers, manage care plans and case notes with consent-aware records — not automatic NDIS Commission submissions.",
    primaryHref: "/dashboard/care",
    primaryLabel: "Open care",
    secondaryLinks: [
      { href: "/dashboard/bookings", label: "Bookings" },
      { href: "/ask", label: "Ask MapAble", description: "Co-Pilot + PRMS guidance" },
    ],
  },
  {
    id: "transport",
    name: "Transport",
    tagline: "Accessible journeys",
    description:
      "Schedule accessible transport trips, track bookings and coordinate door-to-door travel with your profile.",
    primaryHref: "/dashboard/transport",
    primaryLabel: "Open transport",
    secondaryLinks: [
      { href: "/dashboard/bookings", label: "All bookings" },
      { href: "/access", label: "MapAble Access", description: "Places and accessibility reviews" },
    ],
  },
  {
    id: "employment",
    name: "Employment",
    tagline: "MapAble for Jobs",
    description:
      "Find inclusive employers, apply for roles and access workplace adjustments — employment support, not a generic job board.",
    primaryHref: "/dashboard/jobs",
    primaryLabel: "Open jobs",
    secondaryLinks: [
      { href: "/enterprise-provider", label: "Enterprise console", description: "Employers and partners" },
      { href: "/employer/jobs", label: "Post a role", description: "Employer job listings" },
    ],
  },
];

export const CORE_PILLARS_SECTION = {
  title: "Service pillars",
  description:
    "Care, transport and employment are the three offerings MapAble is built around — each with live tools today.",
} as const;
