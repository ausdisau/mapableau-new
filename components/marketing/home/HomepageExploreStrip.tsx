import Link from "next/link";
import React from "react";

import { homepageExploreFeatures } from "@/lib/marketing/mapable-care-combined-data";
import { AppGrid, ModuleCard } from "@mapable/ui";

/**
 * Public discovery links grounded in live informational routes / explainers.
 * Does not promote flag-gated bookings, claims, or payments.
 */
export function HomepageExploreStrip() {
  return (
    <section
      aria-labelledby="explore-features-heading"
      className="border-y border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-12 lg:px-8 lg:py-14">
        <p className="text-sm font-black uppercase tracking-[0.18em] text-[#005B7F]">
          Explore MapAble
        </p>
        <h2
          id="explore-features-heading"
          className="mt-3 max-w-3xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
        >
          What you can use on the public site today
        </h2>
        <p className="mt-4 max-w-2xl text-base leading-7 text-slate-600">
          These surfaces are available now as informational pages and discovery
          tools. Care bookings, live transport matching, and NDIS claims stay
          separately governed and are not generally available here.
        </p>
        <AppGrid columns={3} className="mt-8 gap-x-8 gap-y-6">
          {homepageExploreFeatures.map((feature) => (
            <ModuleCard
              key={feature.href}
              eyebrow={feature.eyebrow}
              title={feature.title}
              description={feature.body}
              href={feature.href}
              linkComponent={Link}
              className="border-t border-slate-200 bg-white pt-5 shadow-none hover:shadow-sm"
            />
          ))}
        </AppGrid>
      </div>
    </section>
  );
}
