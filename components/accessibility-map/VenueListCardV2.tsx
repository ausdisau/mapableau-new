"use client";

import Link from "next/link";
import { forwardRef } from "react";

import { cn } from "@/app/lib/utils";
import {
  AccessDataSourceMarker,
  resolveAccessDataSourceKind,
} from "@/components/access/AccessDataSourceMarker";
import type { AccessRequirementProfile } from "@/lib/access/experience/types";
import {
  accessFitV2SummaryLine,
  calculateAccessFitV2,
} from "@/lib/access/fit/calculate-access-fit-v2";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import {
  mapableCareFocusRing,
  mapableInteractiveFocusRing,
} from "@/lib/marketing/mapable-care-tokens";


export type VenueListCardV2Props = {
  place: DemoAccessPlace;
  requirements: AccessRequirementProfile;
  isSelected?: boolean;
  onSelect?: () => void;
  onReportChange?: () => void;
  className?: string;
};

export const VenueListCardV2 = forwardRef<HTMLElement, VenueListCardV2Props>(
  function VenueListCardV2(
    { place, requirements, isSelected = false, onSelect, onReportChange, className },
    ref,
  ) {
    const fit = calculateAccessFitV2(requirements, place.profile);
    const sourceKind = resolveAccessDataSourceKind({
      isDemo: place.isDemo,
      source: place.source,
      tier: place.tier,
    });

    return (
      <article
        ref={ref}
        className={cn(
          "rounded-2xl border bg-white p-5 shadow-sm transition",
          isSelected
            ? "border-[#005B7F] ring-2 ring-[#005B7F]/30"
            : "border-slate-200",
          className,
        )}
        aria-current={isSelected ? "true" : undefined}
      >
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-xl font-black">{place.name}</h2>
            <p className="text-sm capitalize text-slate-600">
              {place.category.replace(/_/g, " ")} · {place.suburb}, {place.state}
            </p>
          </div>
          <AccessDataSourceMarker kind={sourceKind} className="max-w-xs text-left" />
        </div>

        <p className="mt-3 text-sm text-slate-700" role="status">
          {accessFitV2SummaryLine(fit)}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Last checked {place.lastChecked} · Confidence {place.confidence}
        </p>

        <ul className="mt-3 flex flex-wrap gap-2">
          {place.topAccessFacts.slice(0, 3).map((fact) => (
            <li
              key={fact}
              className="rounded-full bg-[#F6FBFC] px-3 py-1 text-xs font-semibold text-[#005B7F]"
            >
              {fact}
            </li>
          ))}
        </ul>

        {fit.unknownCount > 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            {fit.unknownCount} unknown requirement{fit.unknownCount === 1 ? "" : "s"}
          </p>
        ) : null}

        <div className="mt-4 flex flex-wrap gap-3">
          {onSelect ? (
            <button
              type="button"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableCareFocusRing}`}
              onClick={onSelect}
              aria-pressed={isSelected}
            >
              {isSelected ? "Selected" : "Select"}
            </button>
          ) : null}
          <Link
            href={`/accessibility-map/${place.slug}`}
            className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableInteractiveFocusRing}`}
          >
            View access details
          </Link>
          {onReportChange ? (
            <button
              type="button"
              className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
              onClick={onReportChange}
            >
              Report a change
            </button>
          ) : null}
        </div>
      </article>
    );
  },
);
