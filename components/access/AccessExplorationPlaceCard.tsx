"use client";

import Link from "next/link";
import { forwardRef } from "react";

import type { AccessExplorationPlace } from "@/lib/access/experience/access-exploration-dto";
import { buildGoHandoffHref } from "@/lib/access/experience/go-handoff";
import type { AccessRequirementProfile } from "@/lib/access/experience/types";
import {
  accessFitV2SummaryLine,
  calculateAccessFitV2,
} from "@/lib/access/fit/calculate-access-fit-v2";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

export type AccessExplorationPlaceCardProps = {
  place: AccessExplorationPlace;
  requirements: AccessRequirementProfile;
  isSelected?: boolean;
  onSelect?: () => void;
  onReportChange?: () => void;
};

export const AccessExplorationPlaceCard = forwardRef<
  HTMLElement,
  AccessExplorationPlaceCardProps
>(function AccessExplorationPlaceCard(
  {
    place,
    requirements,
    isSelected = false,
    onSelect,
    onReportChange,
  },
  ref,
) {
  const fit = calculateAccessFitV2(requirements, place.accessProfile);
  const goHref = buildGoHandoffHref({
    destinationPlaceId: place.placeId,
    requirements,
  });

  return (
    <article
      ref={ref}
      className={`rounded-2xl border bg-white p-5 transition ${
        isSelected
          ? "border-[#005B7F] ring-2 ring-[#005B7F]/30"
          : "border-slate-200"
      }`}
      aria-current={isSelected ? "true" : undefined}
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 className="text-xl font-black text-[#0C1833]">{place.name}</h3>
          <p className="text-sm capitalize text-slate-600">
            {place.category.replace(/_/g, " ")}
            {place.suburb ? ` · ${place.suburb}` : ""}
            {place.stateOrRegion ? `, ${place.stateOrRegion}` : ""}
          </p>
          {!place.hasCoordinates ? (
            <p className="mt-1 text-xs font-semibold text-slate-600">
              List only — coordinates not published
            </p>
          ) : null}
        </div>
        <p className="text-xs text-slate-600">
          Confidence {place.confidence}
          {place.lastVerified
            ? ` · Verified ${place.lastVerified.slice(0, 10)}`
            : ""}
        </p>
      </div>

      <p className="mt-3 text-sm text-slate-700" role="status">
        {accessFitV2SummaryLine(fit)}
      </p>
      {place.provenanceSummary ? (
        <p className="mt-1 text-xs text-slate-600">{place.provenanceSummary}</p>
      ) : null}
      {place.disputed ? (
        <p className="mt-1 text-xs font-semibold text-amber-800">
          Some evidence is disputed — review details carefully.
        </p>
      ) : null}

      {place.capabilities.length > 0 ? (
        <ul className="mt-3 flex flex-wrap gap-2" aria-label="Known access facts">
          {place.capabilities.slice(0, 4).map((cap) => (
            <li
              key={cap.key}
              className="rounded-full bg-[#F6FBFC] px-3 py-1 text-xs font-semibold text-[#005B7F]"
            >
              {cap.label}
            </li>
          ))}
        </ul>
      ) : null}

      {fit.unknownCount > 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          {fit.unknownCount} unknown requirement
          {fit.unknownCount === 1 ? "" : "s"}
        </p>
      ) : null}

      <div className="mt-4 flex flex-wrap gap-3">
        {onSelect ? (
          <button
            type="button"
            className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
            onClick={onSelect}
            aria-pressed={isSelected}
          >
            {isSelected ? "Selected" : "Select"}
          </button>
        ) : null}
        <Link
          href={`/access/places/${place.placeId}`}
          className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableInteractiveFocusRing}`}
        >
          View details
        </Link>
        <Link
          href={goHref}
          className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
        >
          Plan route
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
});
