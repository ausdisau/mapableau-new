import Link from "next/link";

import { canonicalAlternate } from "@/lib/config/canonical-url";

export const metadata = {
  title: "Explore MapAble",
  description:
    "Explore MapAble's public accessibility, provider, programme, guide and knowledge surfaces.",
  alternates: canonicalAlternate("/explore"),
};

const groups = [
  {
    title: "Find and plan",
    links: [
      ["Accessibility map", "/accessibility-map", "Explore public access information and evidence."],
      ["Provider finder", "/provider-finder", "Search public provider discovery information."],
      ["Local Access Guides", "/guides", "Browse practical access guides around Australia."],
      ["Journey planner", "/journey-planner", "Explore the public journey-planning surface."],
      ["Compare", "/compare", "Compare public MapAble options and explainers."],
    ],
  },
  {
    title: "Programmes",
    links: [
      ["Care", "/care", "How MapAble approaches disability support coordination."],
      ["Transport", "/transport", "Accessible travel and transport programme information."],
      ["Employment", "/employment", "Inclusive work pathways and adjustment support."],
      ["Marketplace", "/marketplace", "Disability aids and everyday essentials programme information."],
      ["Foods", "/foods", "Meals, grocery and accessible delivery workflows."],
      ["Kids", "/kids", "Family, early-support and school-related programme information."],
      ["Moves", "/moves", "Mobility and rehabilitation support programme information."],
      ["Telehealth", "/telehealth", "Accessible remote-support programme information."],
      ["Peer", "/peer", "Lived-experience community programme information."],
    ],
  },
  {
    title: "Knowledge and participation",
    links: [
      ["Public knowledge guide", "/knowledge", "Ask questions grounded only in deliberately published MapAble material."],
      ["Resources", "/resources", "Access guides, modules, policy links and support pathways."],
      ["About", "/about", "MapAble principles, roadmap and ecosystem overview."],
      ["For providers", "/for-providers", "Provider interest and public onboarding information."],
      ["Mapping days", "/mapping-days", "Community accessibility mapping information."],
      ["Add access information", "/add-access-info", "Contribute public accessibility information."],
      ["Verify my venue", "/verify-my-venue", "Venue verification information and next steps."],
      ["Access intelligence", "/access-intelligence", "Learn about evidence-led accessibility intelligence."],
      ["Access Pass", "/access-pass", "Explore the public Access Pass concept and status."],
    ],
  },
  {
    title: "Rights, help and governance",
    links: [
      ["Help Centre", "/help", "Public help, rights navigation and support pathways."],
      ["Accessibility statement", "/accessibility-statement", "How MapAble approaches digital accessibility."],
      ["Privacy", "/privacy", "Public privacy notice."],
      ["Terms", "/terms", "Public website and pilot terms."],
      ["Data deletion", "/data-deletion", "How to request deletion or review of personal information."],
      ["Contact", "/contact", "Pilot enquiries, accessibility feedback and contact options."],
    ],
  },
] as const;

export default function ExplorePage() {
  return (
    <div className="mx-auto max-w-6xl px-5 py-12 lg:px-8">
      <p className="text-sm font-black uppercase tracking-[0.16em] text-[#005B7F]">Public MapAble</p>
      <h1 className="mapable-display mt-2 text-4xl font-black tracking-[-0.04em] text-[#0C1833] sm:text-5xl">
        Everything MapAble publishes for the public.
      </h1>
      <p className="mt-4 max-w-3xl text-lg leading-8 text-slate-600">
        These are public information, discovery and programme surfaces. Transactional participant,
        provider, worker, billing, audit and administrative systems remain separately governed.
      </p>

      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {groups.map((group) => (
          <section key={group.title} className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="mapable-display text-2xl font-black text-[#0C1833]">{group.title}</h2>
            <div className="mt-5 grid gap-3">
              {group.links.map(([label, href, description]) => (
                <Link
                  key={href}
                  href={href}
                  className="rounded-2xl border border-slate-200 p-4 transition hover:border-[#8CCAD9] hover:bg-[#F6FBFC] focus:outline-none focus:ring-4 focus:ring-[#F8C51C]/40 motion-reduce:transition-none"
                >
                  <span className="block font-black text-[#005B7F]">{label}</span>
                  <span className="mt-1 block text-sm leading-6 text-slate-600">{description}</span>
                </Link>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
