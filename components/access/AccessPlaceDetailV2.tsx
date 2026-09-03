"use client";

import Link from "next/link";
import { useMemo, useState } from "react";

import { AccessFitBreakdownV2 } from "@/components/access-fit/AccessFitBreakdownV2";
import { QuickObservationDialog } from "@/components/accessibility-map/QuickObservationDialog";
import type { AccessExplorationDto } from "@/lib/access/experience/access-exploration-dto";
import {
  ACCESS_GO_HANDOFF_SANDBOX_NOTICE,
  accessToGoHref,
} from "@/lib/access/experience/access-route-handoff";
import { loadJourneyRequirementsForDetail } from "@/lib/access/experience/session-storage";
import type { AccessRequirementProfile } from "@/lib/access/experience/types";
import { DEFAULT_ACCESS_REQUIREMENT_PROFILE } from "@/lib/access/experience/types";
import { calculateAccessFitV2 } from "@/lib/access/fit/calculate-access-fit-v2";
import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";

function factLabel(value: boolean | number | string | null | undefined): string {
  if (value === null || value === undefined) return "Unknown";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  return String(value);
}

export function AccessPlaceDetailV2({ place }: { place: AccessExplorationDto }) {
  const journeyRequirements = loadJourneyRequirementsForDetail();
  const requirements: AccessRequirementProfile =
    journeyRequirements ?? DEFAULT_ACCESS_REQUIREMENT_PROFILE;
  const [reportOpen, setReportOpen] = useState(false);

  const fit = useMemo(
    () => calculateAccessFitV2(requirements, place.placeProfile),
    [requirements, place.placeProfile],
  );

  const facts = place.capabilityFacts;
  const goHref = accessToGoHref({
    destinationPlaceId: place.accessPlaceId,
    destinationName: place.name,
    requirements,
    journeyOverrideActive: Boolean(journeyRequirements),
  });

  return (
    <div className="mx-auto max-w-3xl space-y-8 px-4 py-8">
      <nav aria-label="Breadcrumb">
        <Link
          href="/access"
          className="text-sm font-medium text-[#005B7F] underline-offset-2 hover:underline"
        >
          Back to Access
        </Link>
      </nav>

      <header className="space-y-2">
        <h1 className="text-3xl font-black tracking-tight text-[#0C1833]">
          {place.name}
        </h1>
        <p className="text-sm text-slate-600">
          {[place.addressText, place.suburb, place.stateOrRegion]
            .filter(Boolean)
            .join(", ") || place.category.replaceAll("_", " ")}
        </p>
        <p className="text-xs text-slate-500">
          Evidence: {GAIS_EVIDENCE_STATE_LABELS[place.evidence.dominantState]} ·{" "}
          {place.evidence.freshnessLabel}
          {place.evidence.disputed ? " · Disputed reports present" : ""}
        </p>
      </header>

      <AccessFitBreakdownV2 result={fit} />

      <section
        aria-labelledby="facts-heading"
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 id="facts-heading" className="text-lg font-semibold text-[#0C1833]">
          Access facts
        </h2>
        <p className="text-sm text-slate-600">
          Missing measurements stay Unknown — MapAble does not invent values.
        </p>
        <dl className="grid gap-3 sm:grid-cols-2">
          {(
            [
              ["Path width (mm)", facts.pathWidthMm],
              ["Door width (mm)", facts.doorWidthMm],
              ["Max gradient (%)", facts.maxGradientPercent],
              ["Kerb ramp", facts.kerbRampPresent],
              ["Lift", facts.liftPresent],
              ["Changing Places", facts.changingPlacesPresent],
              ["Captioning", facts.captioningAvailable],
              ["High-contrast signage", facts.highContrastSignage],
              ["Tactile cues", facts.tactileCues],
              ["Quiet area", facts.quietArea],
              ["Low-stimulus environment", facts.lowStimulusEnvironment],
              ["Text / AAC communication", facts.textAacCommunication],
              ["Surface firmness", facts.surfaceFirmness],
            ] as const
          ).map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                {label}
              </dt>
              <dd className="text-sm text-slate-800">{factLabel(value)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section
        aria-labelledby="evidence-heading"
        className="space-y-3 rounded-2xl border border-slate-200 bg-white p-5"
      >
        <h2 id="evidence-heading" className="text-lg font-semibold text-[#0C1833]">
          Evidence & provenance
        </h2>
        <p className="text-sm text-slate-700">
          Confidence: {place.evidence.confidenceLabel}. Freshness:{" "}
          {place.evidence.freshnessLabel}.
        </p>
        {place.evidence.refs.length === 0 ? (
          <p className="text-sm text-slate-600">No evidence references published yet.</p>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-sm text-slate-700">
            {place.evidence.refs.map((ref, index) => (
              <li key={`${ref.sourceLabel ?? ref.sourceType}-${index}`}>
                {ref.sourceLabel ?? ref.sourceType}
                {ref.observedAt ? ` · observed ${ref.observedAt}` : ""}
              </li>
            ))}
          </ul>
        )}
      </section>

      {place.accreditation ? (
        <section
          aria-labelledby="accreditation-heading"
          className="rounded-2xl border border-slate-200 bg-slate-50 p-5"
        >
          <h2
            id="accreditation-heading"
            className="text-lg font-semibold text-[#0C1833]"
          >
            Accreditation
          </h2>
          <p className="mt-1 text-sm text-slate-700">
            Tier: {place.accreditation.tier ?? "Not stated"}
          </p>
          <p className="mt-2 text-xs text-slate-600">
            {place.accreditation.disclaimer}
          </p>
        </section>
      ) : null}

      <section aria-labelledby="actions-heading" className="space-y-3">
        <h2 id="actions-heading" className="text-lg font-semibold text-[#0C1833]">
          Actions
        </h2>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            className="min-h-11 rounded-xl border border-slate-300 px-4 text-sm font-medium"
            onClick={() => setReportOpen(true)}
          >
            Report a change
          </button>
          <Link
            href={goHref}
            className="inline-flex min-h-11 items-center rounded-xl bg-[#0C1833] px-4 text-sm font-medium text-white"
          >
            Plan route
          </Link>
        </div>
        <p className="text-xs text-slate-500">{ACCESS_GO_HANDOFF_SANDBOX_NOTICE}</p>
      </section>

      {reportOpen ? (
        <QuickObservationDialog
          place={{ id: place.accessPlaceId, name: place.name }}
          onClose={() => setReportOpen(false)}
          onSubmitted={() => setReportOpen(false)}
        />
      ) : null}
    </div>
  );
}
