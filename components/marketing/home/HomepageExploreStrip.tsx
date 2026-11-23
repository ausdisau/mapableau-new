import Link from "next/link";
import React from "react";

import {
  marketingOutlineCtaClass,
  marketingPrimaryCtaClass,
} from "@/lib/marketing/brand-palette";
import { homepageExploreFeatures } from "@/lib/marketing/mapable-care-combined-data";

/**
 * PDA-inspired “Who we are” rhythm: featured lead + calm list of public surfaces.
 * Still the same explore destinations — visual/UX only.
 */
export function HomepageExploreStrip() {
  const [featured, ...rest] = homepageExploreFeatures;

  return (
    <section
      aria-labelledby="explore-features-heading"
      className="border-b border-slate-200 bg-white"
    >
      <div className="mx-auto max-w-7xl px-5 py-16 lg:px-8 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start lg:gap-16">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.18em] text-[#3B5BDB]">
              Explore MapAble
            </p>
            <h2
              id="explore-features-heading"
              className="mt-3 max-w-xl text-3xl font-black tracking-[-0.04em] text-[#0C1833] md:text-4xl"
            >
              What you can use on the public site today
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-slate-600">
              These surfaces are available now as informational pages and
              discovery tools. Care bookings, live transport matching, and NDIS
              claims stay separately governed and are not generally available
              here.
            </p>
            {featured ? (
              <div className="mt-8 rounded-[1.75rem] bg-[#F7F8FC] p-6 sm:p-8">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3B5BDB]">
                  {featured.eyebrow}
                </p>
                <h3 className="mt-2 text-2xl font-black tracking-[-0.03em] text-[#0C1833]">
                  {featured.title}
                </h3>
                <p className="mt-3 text-sm leading-7 text-slate-600">
                  {featured.body}
                </p>
                <Link
                  href={featured.href}
                  className={`${marketingPrimaryCtaClass} mt-6`}
                >
                  Open {featured.title.toLowerCase()}
                </Link>
              </div>
            ) : null}
          </div>

          <ul className="divide-y divide-slate-200 border-y border-slate-200">
            {rest.map((feature) => (
              <li key={feature.href} className="py-6">
                <p className="text-xs font-black uppercase tracking-[0.16em] text-[#3B5BDB]">
                  {feature.eyebrow}
                </p>
                <h3 className="mt-2 text-xl font-black text-[#0C1833]">
                  {feature.title}
                </h3>
                <p className="mt-2 text-sm leading-6 text-slate-600">
                  {feature.body}
                </p>
                <Link
                  href={feature.href}
                  className={`${marketingOutlineCtaClass} mt-4 !min-h-10 px-4 text-xs`}
                >
                  Learn more
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
