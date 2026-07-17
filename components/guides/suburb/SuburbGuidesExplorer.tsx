"use client";

import React, { useMemo, useState } from "react";

import { SuburbGuideCard } from "@/components/guides/suburb/SuburbGuideCard";
import {
  SuburbGuideFilters,
  type SuburbGuideFiltersState,
} from "@/components/guides/suburb/SuburbGuideFilters";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";
import {
  filterSuburbGuides,
  getSuburbGuideStates,
} from "@/lib/resources/suburb-access-guides-data";
import type {
  SuburbAccessGuide,
  SuburbAccessTheme,
  SuburbGuideStatus,
} from "@/types/suburb-access-guide";

type SuburbGuidesExplorerProps = {
  guides: SuburbAccessGuide[];
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

const STATE_LABELS: Record<string, string> = {
  act: "ACT",
  nsw: "NSW",
  vic: "VIC",
  qld: "QLD",
  sa: "SA",
  wa: "WA",
  tas: "TAS",
  nt: "NT",
};

export function SuburbGuidesExplorer({ guides }: SuburbGuidesExplorerProps) {
  const [filters, setFilters] = useState<SuburbGuideFiltersState>({
    query: "",
    stateSlug: null,
    status: null,
    theme: null,
  });

  const states = useMemo(
    () =>
      getSuburbGuideStates().map((slug) => ({
        slug,
        label: STATE_LABELS[slug] ?? slug.toUpperCase(),
      })),
    [],
  );

  const filtered = useMemo(
    () =>
      filterSuburbGuides({
        query: filters.query,
        stateSlug: filters.stateSlug,
        status: filters.status,
        theme: filters.theme,
      }),
    [filters],
  );

  const isFiltered = Boolean(
    filters.query.trim() || filters.stateSlug || filters.status || filters.theme,
  );
  const visible = isFiltered ? filtered : guides;

  return (
    <div className="space-y-8">
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
          className="text-lg font-black text-[#0C1833] sm:text-xl"
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
              <SuburbGuideCard key={guide.salCode} guide={guide} />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
