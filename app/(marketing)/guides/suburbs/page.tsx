import Link from "next/link";
import React from "react";

import { SuburbGuideCard } from "@/components/guides/suburb/SuburbGuideCard";
import { SuburbGuidesExplorer } from "@/components/guides/suburb/SuburbGuidesExplorer";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicMutedCardClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  getFeaturedSuburbGuides,
  suburbAccessGuides,
  SUBURB_GUIDE_DISCLAIMER,
} from "@/lib/resources/suburb-access-guides-data";

export const metadata = {
  title: "Suburb Access Guides | MapAble",
  description:
    "MapAble suburb and locality Access Guides across Australia, organised by ABS Suburbs and Localities (SAL).",
  alternates: {
    canonical: "/guides/suburbs",
  },
};

export default function SuburbGuidesIndexPage() {
  const featured = getFeaturedSuburbGuides();

  return (
    <main className="bg-white text-[#0C1833]">
      <header className="border-b border-slate-200 bg-[#F6FBFC]">
        <div
          className={`${mapablePublicPageContainerClass} py-14 sm:py-20`}
        >
          <p className={mapablePublicEyebrowClass}>National suburb guides</p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            Suburb Access Guides for Australia
          </h1>
          <p className={mapablePublicLeadClass}>
            A scalable locality guide system based on ABS Suburbs and Localities
            (SAL). Draft pages stay clearly labelled and never replace checking
            conditions on the day.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href="#suburb-guide-results-heading"
              className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
            >
              Skip map and browse guide list
            </a>
            <Link
              href="/guides"
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
            >
              Capital and regional guides
            </Link>
          </div>
        </div>
      </header>

      <div
        className={`${mapablePublicPageContainerClass} space-y-10 py-12 sm:py-16`}
      >
        <SuburbGuidesExplorer guides={suburbAccessGuides} />

        <section aria-labelledby="featured-suburb-guides-heading">
          <h2
            id="featured-suburb-guides-heading"
            className="text-lg font-black text-[#0C1833] sm:text-xl"
          >
            Higher-confidence suburb guides
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            These localities have stronger drafted content. Thin draft pages are
            kept out of search indexes until they are useful enough.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((guide) => (
              <SuburbGuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        </section>

        <aside
          className={`${mapablePublicMutedCardClass} border-amber-200 bg-amber-50`}
          role="note"
        >
          <h2 className="text-lg font-black text-amber-950">Disclaimer</h2>
          <p className="mt-3 text-sm leading-7 text-amber-950">
            {SUBURB_GUIDE_DISCLAIMER}
          </p>
        </aside>
      </div>
    </main>
  );
}
