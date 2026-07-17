"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import { SuburbGuideCard } from "@/components/guides/suburb/SuburbGuideCard";
import {
  SuburbGuideFilters,
  type SuburbGuideFiltersState,
} from "@/components/guides/suburb/SuburbGuideFilters";
import { SuburbGuidesIndexMap } from "@/components/guides/suburb/SuburbGuidesIndexMap";
import {
  filterSuburbGuideList,
  stateLabelFromSlug,
} from "@/lib/guides/suburb-guide-utils";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
} from "@/lib/marketing/public-page-styles";
import { getSuburbGuideStates } from "@/lib/resources/suburb-access-guides-data";
import type {
  SuburbAccessGuide,
  SuburbAccessTheme,
  SuburbGuideStatus,
} from "@/types/suburb-access-guide";

type SuburbGuidesExplorerProps = {
  guides: SuburbAccessGuide[];
  /** Pre-select a state filter (e.g. on /guides/suburbs/[state]). */
  initialStateSlug?: string | null;
  showStateLinks?: boolean;
};

const STATUSES: SuburbGuideStatus[] = [
  "not-started",
  "draft",
  "data-enriched",
  "community-reported",
  "partner-supplied",
  "mapable-reviewed",
  "mapable-verified",
  "needs-local-verification",
];

const THEMES: SuburbAccessTheme[] = [
  "transport",
  "toilets",
  "parking-dropoff",
  "step-free",
  "sensory",
  "venues",
  "health-support",
  "hazards",
];

export function SuburbGuidesExplorer({
  guides,
  initialStateSlug = null,
  showStateLinks = true,
}: SuburbGuidesExplorerProps) {
  const [filters, setFilters] = useState<SuburbGuideFiltersState>({
    query: "",
    stateSlug: initialStateSlug,
    status: null,
    theme: null,
  });

  const states = useMemo(
    () =>
      getSuburbGuideStates().map((slug) => ({
        slug,
        label: stateLabelFromSlug(slug),
      })),
    [],
  );

  const visible = useMemo(
    () =>
      filterSuburbGuideList(guides, {
        query: filters.query,
        stateSlug: filters.stateSlug,
        status: filters.status,
        theme: filters.theme,
      }),
    [filters, guides],
  );

  const mapGuides = visible.length > 0 ? visible : guides;

  return (
    <div className="space-y-8">
      <div className="flex flex-wrap gap-3">
        <a
          href="#suburb-guide-results-heading"
          className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
        >
          Skip map and browse guide list
        </a>
        <Link
          href="/guides"
          className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
        >
          Capital and regional guides
        </Link>
      </div>

      <SuburbGuidesIndexMap guides={mapGuides} />

      {showStateLinks ? (
        <nav aria-label="Browse by state" className={mapablePublicCardClass}>
          <h2 className="text-lg font-black text-[#0C1833]">Browse by state</h2>
          <ul className="mt-4 flex flex-wrap gap-2">
            {states.map((state) => (
              <li key={state.slug}>
                <Link
                  href={`/guides/suburbs/${state.slug}`}
                  className={`inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
                >
                  {state.label}
                </Link>
              </li>
            ))}
          </ul>
        </nav>
      ) : null}

      <div className={mapablePublicCardClass}>
        <h2 className="text-lg font-black text-[#0C1833] sm:text-xl">
          Search suburb Access Guides
        </h2>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Filter by state, verification status or access theme. Result counts
          are announced for screen-reader users.
        </p>
        <div className="mt-6">
          <SuburbGuideFilters
            filters={filters}
            states={states}
            statuses={STATUSES}
            themes={THEMES}
            resultCount={visible.length}
            onChange={setFilters}
          />
        </div>
      </div>

      <section aria-labelledby="suburb-guide-results-heading">
        <h2
          id="suburb-guide-results-heading"
          className="scroll-mt-24 text-lg font-black text-[#0C1833] sm:text-xl"
        >
          Suburb guide results
        </h2>
        {visible.length === 0 ? (
          <p className="mt-4 text-sm leading-7 text-slate-700">
            No suburb guides match those filters yet. Clear a filter or browse
            the capital and regional guides.
          </p>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {visible.map((guide) => (
              <SuburbGuideCard key={guide.id} guide={guide} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
