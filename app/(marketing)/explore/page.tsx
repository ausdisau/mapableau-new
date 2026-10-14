import Link from "next/link";

import { canonicalAlternate } from "@/lib/config/canonical-url";
import { publicDiscoveryRoutesByGroup } from "@/lib/public/discovery-routes";

export const metadata = {
  title: "Explore MapAble",
  description:
    "Explore MapAble's public accessibility, provider, programme, guide and knowledge surfaces.",
  alternates: canonicalAlternate("/explore"),
};

type PublicLink = {
  label: string;
  href: string;
  description: string;
};

const discoveryLinks: PublicLink[] = [
  ...publicDiscoveryRoutesByGroup("discover").map((route) => ({
    label: route.label,
    href: route.path,
    description: route.description,
  })),
  {
    label: "Local Access Guides",
    href: "/guides",
    description: "Browse practical access guides around Australia.",
  },
];

const programmeLinks: PublicLink[] = [
  {
    label: "Care",
    href: "/care",
    description: "How MapAble approaches disability support coordination.",
  },
  {
    label: "Transport",
    href: "/transport",
    description: "Accessible travel and transport programme information.",
  },
  {
    label: "Employment",
    href: "/employment",
    description: "Inclusive work pathways and adjustment support.",
  },
  {
    label: "Marketplace",
    href: "/marketplace",
    description: "Disability aids and everyday essentials programme information.",
  },
  {
    label: "Foods",
    href: "/foods",
    description: "Meals, grocery and accessible delivery workflows.",
  },
  {
    label: "Kids",
    href: "/kids",
    description: "Family, early-support and school-related programme information.",
  },
  {
    label: "Moves",
    href: "/moves",
    description: "Mobility and rehabilitation support programme information.",
  },
  ...publicDiscoveryRoutesByGroup("programme").map((route) => ({
    label: route.label,
    href: route.path,
    description: route.description,
  })),
];

const participationLinks: PublicLink[] = [
  {
    label: "Public knowledge guide",
    href: "/knowledge",
    description:
      "Ask questions grounded only in deliberately published MapAble material.",
  },
  {
    label: "Resources",
    href: "/resources",
    description: "Access guides, modules, policy links and support pathways.",
  },
  {
    label: "About",
    href: "/about",
    description: "MapAble principles, roadmap and ecosystem overview.",
  },
  ...publicDiscoveryRoutesByGroup("participate").map((route) => ({
    label: route.label,
    href: route.path,
    description: route.description,
  })),
];

const governanceLinks: PublicLink[] = [
  {
    label: "Help Centre",
    href: "/help",
    description: "Public help, rights navigation and support pathways.",
  },
  {
    label: "Accessibility statement",
    href: "/accessibility-statement",
    description: "How MapAble approaches digital accessibility.",
  },
  {
    label: "Privacy",
    href: "/privacy",
    description: "Public privacy notice.",
  },
  {
    label: "Terms",
    href: "/terms",
    description: "Public website and pilot terms.",
  },
  {
    label: "Data deletion",
    href: "/data-deletion",
    description: "How to request deletion or review of personal information.",
  },
  {
    label: "Contact",
    href: "/contact",
    description: "Pilot enquiries, accessibility feedback and contact options.",
  },
];

const groups = [
  { title: "Find and plan", links: discoveryLinks },
  { title: "Programmes", links: programmeLinks },
  { title: "Knowledge and participation", links: participationLinks },
  { title: "Rights, help and governance", links: governanceLinks },
] as const;

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">
        Public MapAble
      </p>
      <h1 className="mapable-display mt-2 text-4xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-5xl">
        Everything MapAble publishes for the public.
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
        These are public information, discovery and programme surfaces.
        Transactional participant, provider, worker, billing, audit and
        administrative systems remain separately governed.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {groups.map((group) => (
          <section
            key={group.title}
            className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm"
          >
            <h2 className="mapable-display text-2xl font-black text-[#0C1833]">
              {group.title}
            </h2>
            <div className="mt-5 grid gap-3">
              {group.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:border-[#8CCAD9] hover:bg-[#F6FBFC] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 motion-reduce:transition-none"
                >
                  <span className="block font-black text-[#005B7F]">
                    {link.label}
                  </span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">
                    {link.description}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
