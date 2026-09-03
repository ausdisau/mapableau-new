"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

import { AccessFitBreakdownV2 } from "@/components/access-fit/AccessFitBreakdownV2";
import { QuickObservationDialog } from "@/components/accessibility-map/QuickObservationDialog";
import { toAccessExplorationPlace } from "@/lib/access/experience/to-access-exploration-place";
import {
  loadExplorationSession,
} from "@/lib/access/experience/session-storage";
import {
  resolveActiveRequirements,
} from "@/lib/access/experience/exploration-state";
import {
  buildGoHandoffHref,
  GO_SANDBOX_DISCLAIMER,
} from "@/lib/access/experience/go-handoff";
import { calculateAccessFitV2 } from "@/lib/access/fit/calculate-access-fit-v2";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

export function AccessPlaceExperienceV2Panel({
  place,
}: {
  place: {
    id: string;
    name: string;
    category: string;
    description?: string | null;
    addressText?: string | null;
    suburb?: string | null;
    stateOrRegion?: string | null;
    confidence: string;
    sourceType: string;
    updatedAt?: string | null;
    features: string[];
  };
}) {
  const [observationOpen, setObservationOpen] = useState(false);
  const [requirements, setRequirements] = useState(() =>
    resolveActiveRequirements(loadExplorationSession()),
  );

  useEffect(() => {
    setRequirements(resolveActiveRequirements(loadExplorationSession()));
  }, []);

  const explorationPlace = useMemo(
    () =>
      toAccessExplorationPlace({
        id: place.id,
        name: place.name,
        category: place.category,
        description: place.description,
        addressText: place.addressText,
        suburb: place.suburb,
        stateOrRegion: place.stateOrRegion,
        confidence: place.confidence,
        sourceType: place.sourceType,
        updatedAt: place.updatedAt,
        features: place.features.map((type) => ({ type })),
      }),
    [place],
  );

  const fit = calculateAccessFitV2(requirements, explorationPlace.accessProfile);
  const goHref = buildGoHandoffHref({
    destinationPlaceId: place.id,
    requirements,
  });

  return (
    <section className="space-y-6 rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5">
      <div>
        <h2 className="text-lg font-black text-[#0C1833]">
          Access fit for your selected requirements
        </h2>
        <p className="mt-1 text-sm text-slate-600">
          Based on your current exploration session. No single universal
          accessibility score is shown as the verdict.
        </p>
      </div>

      <AccessFitBreakdownV2 result={fit} />

      <section aria-labelledby="capability-facts-heading">
        <h3 id="capability-facts-heading" className="text-base font-semibold">
          Capability facts
        </h3>
        {explorationPlace.capabilities.length === 0 ? (
          <p className="mt-2 text-sm text-slate-600">
            No affirmative capability tags published yet — remaining fields are
            UNKNOWN.
          </p>
        ) : (
          <ul className="mt-2 space-y-2">
            {explorationPlace.capabilities.map((cap) => (
              <li
                key={cap.key}
                className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm"
              >
                <span className="font-semibold">{cap.label}</span>
                <span className="ml-2 text-slate-600">
                  {cap.evidenceRefs[0]?.sourceType
                    ? `· ${cap.evidenceRefs[0].sourceType.replace(/_/g, " ")}`
                    : ""}
                </span>
              </li>
            ))}
          </ul>
        )}
        <p className="mt-2 text-xs text-slate-600">
          Unknown fields: {explorationPlace.unknownCapabilityCount}. Missing
          evidence is never treated as inaccessible.
        </p>
        {explorationPlace.provenanceSummary ? (
          <p className="mt-1 text-xs text-slate-600">
            {explorationPlace.provenanceSummary}
          </p>
        ) : null}
      </section>

      <div className="flex flex-wrap gap-3">
        <Link
          href={goHref}
          className={`inline-flex min-h-11 items-center rounded-xl bg-[#005B7F] px-4 text-sm font-black text-white ${mapableInteractiveFocusRing}`}
        >
          Plan route
        </Link>
        <button
          type="button"
          className={`inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
          onClick={() => setObservationOpen(true)}
        >
          Report a change
        </button>
      </div>
      <p className="text-xs text-slate-600">{GO_SANDBOX_DISCLAIMER}</p>

      {observationOpen ? (
        <QuickObservationDialog
          place={{ id: place.id, name: place.name }}
          onClose={() => setObservationOpen(false)}
          onSubmitted={() => setObservationOpen(false)}
        />
      ) : null}
    </section>
  );
}
