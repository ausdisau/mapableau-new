import Link from "next/link";
import React from "react";

import { PrintChecklistButton } from "@/components/resources/PrintChecklistButton";
import { ReportUpdateCTA } from "@/components/tours/ReportUpdateCTA";
import { TourCard } from "@/components/tours/TourCard";
import { ToursExplorer } from "@/components/tours/ToursExplorer";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicMutedCardClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  formatTourCategory,
  getFeaturedTours,
  getTourCategories,
  tours,
} from "@/lib/resources/tours-data";

export const metadata = {
  title: "Accessible Tours | MapAble",
  description:
    "Explore MapAble accessible tours with practical route notes, toilets, quiet spaces, transport information and verified access details.",
};

const relatedModules = [
  { label: "Resources", href: "/resources" },
  { label: "Accessible places", href: "/access" },
  { label: "Transport", href: "/transport" },
  { label: "Care", href: "/care" },
  { label: "Employment", href: "/employment" },
  { label: "Provider finder", href: "/provider-finder" },
] as const;

export default function ToursIndexPage() {
  const featured = getFeaturedTours();
  const categories = getTourCategories();

  return (
    <div className="bg-white text-[#0C1833]">
      <header className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC] print:bg-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F8C51C]/25 blur-3xl motion-reduce:hidden print:hidden"
        />
        <div
          className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}
        >
          <p className={mapablePublicEyebrowClass}>MapAble Tours</p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            Accessible tours for real-world outings
          </h1>
          <p className={mapablePublicLeadClass}>
            Practical, plain-language tours with route notes, toilets, quiet
            spaces, transport flags and an accessible list-view for every map.
            Advisory planning support — not a guarantee of access.
          </p>
          <div className="mt-8 flex flex-wrap gap-3 print:hidden">
            <a
              href="#featured-tours"
              className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
            >
              Browse featured tours
            </a>
            <Link
              href="/resources"
              className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
            >
              Back to resources
            </Link>
            <PrintChecklistButton label="Print this page" />
          </div>
        </div>
      </header>

      <div
        className={`${mapablePublicPageContainerClass} space-y-10 py-12 sm:py-16`}
      >
        <ToursExplorer tours={tours} />

        <section id="featured-tours" aria-labelledby="featured-tours-heading">
          <h2
            id="featured-tours-heading"
            className="text-lg font-black text-[#0C1833] sm:text-xl"
          >
            Featured tours
          </h2>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-700">
            Start with tours that have been drafted for low-rush planning.
            Always re-check hours, bookings and transport before you go.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {featured.map((tour) => (
              <TourCard key={tour.id} tour={tour} />
            ))}
          </div>
        </section>

        <section
          id="tour-categories"
          aria-labelledby="tour-categories-heading"
          className={mapablePublicMutedCardClass}
        >
          <h2
            id="tour-categories-heading"
            className="text-lg font-black text-[#0C1833] sm:text-xl"
          >
            Tour categories
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Categories help you skim. They are planning labels, not clinical or
            NDIS classifications.
          </p>
          <ul className="mt-4 flex flex-wrap gap-2">
            {categories.map((category) => (
              <li
                key={category}
                className="rounded-2xl border border-slate-200 bg-white px-4 py-2 text-sm font-bold text-[#005B7F]"
              >
                {formatTourCategory(category)}
              </li>
            ))}
          </ul>
        </section>

        <section
          id="verification-explanation"
          aria-labelledby="verification-explanation-heading"
          className={mapablePublicCardClass}
        >
          <h2
            id="verification-explanation-heading"
            className="text-lg font-black text-[#0C1833] sm:text-xl"
          >
            How verification works
          </h2>
          <p className="mt-3 text-sm leading-7 text-slate-700">
            Tour verification statuses describe how recently access notes were
            drafted or checked. They do not mean a venue has been certified
            compliant, and they do not guarantee access on the day you visit.
          </p>
          <ul className="mt-4 list-disc space-y-2 pl-5 text-sm leading-7 text-slate-700">
            <li>
              <strong>Community draft</strong> — assembled from public venue
              notes and practical planning patterns; still needs local checks.
            </li>
            <li>
              <strong>Locally checked</strong> — a recent human review of key
              toilets, parking, quiet options or transport notes.
            </li>
            <li>
              <strong>Needs re-check</strong> — details may be out of date;
              confirm before travelling.
            </li>
          </ul>
        </section>

        <ReportUpdateCTA />

        <section
          aria-labelledby="related-modules-heading"
          className={mapablePublicMutedCardClass}
        >
          <h2
            id="related-modules-heading"
            className="text-lg font-black text-[#0C1833]"
          >
            Related MapAble modules
          </h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {relatedModules.map((module) => (
              <li key={module.href}>
                <Link
                  href={module.href}
                  className={`inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
                >
                  {module.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
