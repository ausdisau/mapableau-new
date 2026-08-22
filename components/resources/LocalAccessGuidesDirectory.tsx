"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import { getLocalAccessHrefForCity } from "@/lib/demo/local-access-pages";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicEyebrowClass,
  mapablePublicLeadClass,
  mapablePublicPageContainerClass,
  mapablePublicPrimaryButtonClass,
  mapablePublicSecondaryButtonClass,
  mapablePublicTitleClass,
} from "@/lib/marketing/public-page-styles";
import type { AccessGuide } from "@/lib/resources/access-guides-data";
import {
  accessGuideDownloads,
  accessGuideStatusLabel,
  getAccessGuideStates,
} from "@/lib/resources/access-guides-data";

const REGIONAL_TIERS = ["Tier 1", "Tier 2", "Tier 3"] as const;

type LocalAccessGuidesDirectoryProps = {
  guides: AccessGuide[];
  capitalGuides: AccessGuide[];
};

function matchesGuideQuery(guide: AccessGuide, query: string, state: string) {
  if (state && guide.state !== state) return false;
  const q = query.trim().toLowerCase();
  if (!q) return true;
  return (
    guide.city.toLowerCase().includes(q) ||
    guide.state.toLowerCase().includes(q) ||
    guide.guideType.toLowerCase().includes(q) ||
    guide.launchAngle.toLowerCase().includes(q)
  );
}

function GuideCard({ guide }: { guide: AccessGuide }) {
  const localHref = getLocalAccessHrefForCity(guide.city);

  return (
    <article className={`${mapablePublicCardClass} flex h-full flex-col`}>
      <p className="text-xs font-bold uppercase tracking-[0.14em] text-[#005B7F]">
        {guide.state} · {guide.guideType}
      </p>
      <h3 className="mt-2 text-lg font-black text-[#0C1833]">{guide.city}</h3>
      <p className="mt-2 text-xs font-semibold text-slate-500">
        {accessGuideStatusLabel(guide)}
      </p>
      <p className="mt-3 line-clamp-3 flex-1 text-sm leading-7 text-slate-700">
        {guide.launchAngle}
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={guide.href}
          className={`inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
        >
          Open {guide.city} guide
        </Link>
        {localHref ? (
          <Link
            href={localHref}
            className={`inline-flex min-h-11 items-center text-sm font-bold text-[#005B7F] underline ${mapableCareFocusRing}`}
          >
            Local access page
          </Link>
        ) : null}
      </div>
    </article>
  );
}

export function LocalAccessGuidesDirectory({
  guides,
  capitalGuides,
}: LocalAccessGuidesDirectoryProps) {
  const [query, setQuery] = useState("");
  const [state, setState] = useState("");
  const states = useMemo(() => getAccessGuideStates(), []);
  const isFiltering = query.trim().length > 0 || state.length > 0;

  const filtered = useMemo(
    () => guides.filter((guide) => matchesGuideQuery(guide, query, state)),
    [guides, query, state],
  );

  const filteredCapitals = useMemo(
    () =>
      capitalGuides.filter((guide) => matchesGuideQuery(guide, query, state)),
    [capitalGuides, query, state],
  );

  const regionalCount = guides.length - capitalGuides.length;

  return (
    <div className="bg-white text-[#0C1833]">
      <section className="relative overflow-hidden border-b border-slate-200 bg-[#F6FBFC]">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-[-6rem] top-[-6rem] h-64 w-64 rounded-full bg-[#F8C51C]/25 blur-3xl"
        />
        <div
          className={`${mapablePublicPageContainerClass} relative py-14 sm:py-20`}
        >
          <p className={mapablePublicEyebrowClass}>Local Access Guides</p>
          <h1 className={`${mapablePublicTitleClass} mt-3`}>
            Accessibility guides for cities and towns across Australia.
          </h1>
          <p className={mapablePublicLeadClass}>
            Capital starter guides are drafted first. Regional Tier 1–3 guides
            need local verification of beach access, transport, toilets,
            gradients and quiet routes. Confirm critical details before you
            travel.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={accessGuideDownloads.pdf}
              download
              className={mapablePublicPrimaryButtonClass}
            >
              Download guides pack (PDF)
            </a>
            <a
              href={accessGuideDownloads.docx}
              download
              className={mapablePublicSecondaryButtonClass}
            >
              Download Word (.docx)
            </a>
            <Link
              href="/accessibility-map"
              className={mapablePublicSecondaryButtonClass}
            >
              Open accessibility map
            </Link>
            <a href="#guides-capital" className={mapablePublicSecondaryButtonClass}>
              Jump to capitals
            </a>
          </div>
        </div>
      </section>

      <section
        className={`${mapablePublicPageContainerClass} py-10 lg:py-12`}
        aria-labelledby="guides-search-heading"
      >
        <h2 id="guides-search-heading" className="text-xl font-black">
          Search and filter
        </h2>
        <p className="mt-2 max-w-3xl text-sm text-slate-600">
          Filter {capitalGuides.length} capital starter guides and{" "}
          {regionalCount} regional guides by city or state.
        </p>
        <div
          role="search"
          className="mt-5 grid gap-4 rounded-2xl border border-slate-200 bg-white p-4 sm:grid-cols-[1fr_12rem]"
          aria-label="Guide filters"
        >
          <div>
            <label htmlFor="guide-query" className="text-sm font-semibold">
              Search city or region
            </label>
            <input
              id="guide-query"
              type="search"
              className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 px-3 ${mapableCareFocusRing}`}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Sydney, Newcastle, Gold Coast…"
            />
          </div>
          <div>
            <label htmlFor="guide-state" className="text-sm font-semibold">
              State or territory
            </label>
            <select
              id="guide-state"
              className={`mt-1 min-h-11 w-full rounded-xl border border-slate-300 bg-white px-3 ${mapableCareFocusRing}`}
              value={state}
              onChange={(event) => setState(event.target.value)}
            >
              <option value="">All</option>
              {states.map((code) => (
                <option key={code} value={code}>
                  {code}
                </option>
              ))}
            </select>
          </div>
        </div>
        <p className="mt-3 text-sm text-slate-600" role="status">
          Showing {filtered.length} guide{filtered.length === 1 ? "" : "s"}
        </p>
      </section>

      {isFiltering ? (
        <section
          className="border-b border-slate-200 bg-white"
          aria-labelledby="guides-results-heading"
        >
          <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
            <p className={mapablePublicEyebrowClass}>Results</p>
            <h2
              id="guides-results-heading"
              className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
            >
              Matching Local Access Guides
            </h2>
            {filtered.length === 0 ? (
              <p className="mt-4 text-sm text-slate-600">
                No guides match that search. Try another city or clear the
                state filter.
              </p>
            ) : (
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filtered.map((guide) => (
                  <GuideCard key={guide.href} guide={guide} />
                ))}
              </div>
            )}
          </div>
        </section>
      ) : (
        <>
          <section
            id="guides-capital"
            className="border-b border-slate-200 bg-[#F6FBFC]"
            aria-labelledby="guides-capital-heading"
          >
            <div className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}>
              <p className={mapablePublicEyebrowClass}>Capital launch</p>
              <h2
                id="guides-capital-heading"
                className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
              >
                Capital Access Guides
              </h2>
              <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                Start with a capital city guide for visitor-facing day planning.
              </p>
              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                {filteredCapitals.map((guide) => (
                  <GuideCard key={guide.href} guide={guide} />
                ))}
              </div>
            </div>
          </section>

          {REGIONAL_TIERS.map((tier) => {
            const tierGuides = guides.filter(
              (guide) => guide.priorityTier === tier,
            );
            return (
              <section
                key={tier}
                id={`guides-${tier.toLowerCase().replace(/\s+/g, "-")}`}
                className="border-b border-slate-200 bg-white"
                aria-labelledby={`guides-${tier}-heading`}
              >
                <div
                  className={`${mapablePublicPageContainerClass} py-12 lg:py-16`}
                >
                  <p className={mapablePublicEyebrowClass}>{tier}</p>
                  <h2
                    id={`guides-${tier}-heading`}
                    className="mt-2 text-2xl font-black tracking-tight text-mapable-navy sm:text-3xl"
                  >
                    {tier} regional Access Guides
                  </h2>
                  <p className="mt-3 max-w-3xl text-base leading-7 text-slate-600">
                    {tierGuides.length} locations scheduled for local
                    verification.
                  </p>
                  <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {tierGuides.map((guide) => (
                      <GuideCard key={guide.href} guide={guide} />
                    ))}
                  </div>
                </div>
              </section>
            );
          })}
        </>
      )}

      <p
        className={`${mapablePublicPageContainerClass} py-8 text-sm text-slate-600`}
        role="note"
      >
        Access information changes and should be confirmed before travelling.
      </p>
    </div>
  );
}
