"use client";

import Link from "next/link";
import React, { useMemo, useState } from "react";

import { GuideFilters, type GuideFiltersState } from "@/components/guides/GuideFilters";
import { GuideList } from "@/components/guides/GuideList";
import { GuideMap } from "@/components/guides/GuideMap";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import {
  mapablePublicCardClass,
  mapablePublicPrimaryButtonClass,
} from "@/lib/marketing/public-page-styles";
import {
  accessGuideDownloads,
  filterAccessGuides,
  getAccessGuideStates,
  getAccessGuideTiers,
  type AccessGuide,
  type AccessGuideStatusKey,
} from "@/lib/resources/access-guides-data";

type GuidesMapExplorerProps = {
  guides: AccessGuide[];
};

const FILTERABLE_STATUSES: AccessGuideStatusKey[] = [
  "drafted",
  "needs_verification",
  "partner_supplied",
  "community_reported",
  "planned",
];

export function GuidesMapExplorer({ guides }: GuidesMapExplorerProps) {
  const [filters, setFilters] = useState<GuideFiltersState>({
    query: "",
    state: null,
    tier: null,
    status: null,
  });
  const [selectedGuideId, setSelectedGuideId] = useState<string | null>(null);

  const states = useMemo(() => getAccessGuideStates(), []);
  const tiers = useMemo(() => getAccessGuideTiers(), []);

  const filtered = useMemo(
    () =>
      filterAccessGuides({
        query: filters.query,
        state: filters.state,
        tier: filters.tier,
        status: filters.status,
      }),
    [filters],
  );

  const isFiltered = Boolean(
    filters.query.trim() || filters.state || filters.tier || filters.status,
  );

  const visibleGuides = isFiltered ? filtered : guides;

  return (
    <div className="space-y-8">
      <a
        href="#guides-list"
        className={`inline-flex min-h-11 items-center rounded-2xl border border-slate-200 bg-white px-4 text-sm font-bold text-[#005B7F] ${mapableCareFocusRing}`}
      >
        Skip map and browse guide list
      </a>

      <div className={mapablePublicCardClass}>
        <h3 className="text-lg font-black text-[#0C1833]">
          Search and filters
        </h3>
        <p className="mt-3 text-sm leading-7 text-slate-700">
          Filters update both the map markers and the accessible guide list.
          Status chips cover drafted, partner supplied, community reported and
          needs local verification.
        </p>
        <div className="mt-6">
          <GuideFilters
            filters={filters}
            states={states}
            tiers={tiers}
            statuses={FILTERABLE_STATUSES}
            resultCount={visibleGuides.length}
            onChange={setFilters}
          />
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <a
          href={accessGuideDownloads.pdf}
          download
          className={`${mapablePublicPrimaryButtonClass} ${mapableCareFocusRing}`}
        >
          Download guides pack (PDF)
        </a>
        <a
          href={accessGuideDownloads.docx}
          download
          className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
        >
          Download Word (.docx)
        </a>
        <a
          href={accessGuideDownloads.rolloutMatrix}
          download
          className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
        >
          Rollout matrix (CSV)
        </a>
        <Link
          href="/resources"
          className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-slate-200 bg-white px-6 text-sm font-bold text-[#005B7F] transition hover:bg-slate-50 ${mapableCareFocusRing}`}
        >
          Resources hub
        </Link>
      </div>

      <GuideMap
        guides={visibleGuides}
        selectedGuideId={
          selectedGuideId &&
          visibleGuides.some((guide) => guide.id === selectedGuideId)
            ? selectedGuideId
            : null
        }
        onSelectGuide={(guideId) =>
          setSelectedGuideId(guideId ? guideId : null)
        }
      />

      <GuideList
        guides={visibleGuides}
        selectedGuideId={selectedGuideId}
        isFiltered={isFiltered}
        onSelectGuide={setSelectedGuideId}
      />
    </div>
  );
}
