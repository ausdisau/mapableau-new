"use client";

import React, { useState } from "react";

import { AccessNeedsTogglePanel } from "@/components/access-fit/AccessNeedsTogglePanel";
import {
  countSelectedRequirements,
  requirementsSummaryLabels,
} from "@/lib/access/experience/requirement-profile";
import type { AccessRequirementProfile } from "@/lib/access/experience/types";
import type { AccessNeed } from "@/lib/access/fit/types";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

type Mode = "saved" | "journey";

const EXTENDED_BOOLEAN_FIELDS: {
  key: keyof AccessRequirementProfile;
  label: string;
}[] = [
  { key: "kerbRampRequired", label: "Kerb ramp required" },
  { key: "liftRequired", label: "Lift required" },
  { key: "changingPlacesPreferred", label: "Changing Places preferred" },
  { key: "captioningPreferred", label: "Captioning preferred" },
  { key: "highContrastSignagePreferred", label: "High-contrast signage preferred" },
  { key: "tactileCuesPreferred", label: "Tactile cues preferred" },
  { key: "quietAreaPreferred", label: "Quiet area preferred" },
  { key: "lowStimulusPreferred", label: "Low-stimulus preferred" },
  { key: "textCommunicationPreferred", label: "Text / AAC communication preferred" },
];

export function AccessRequirementsPanel({
  activeRequirements,
  savedRequirements,
  journeyMode,
  onUseSaved,
  onChangeJourney,
  onJourneyChange,
}: {
  activeRequirements: AccessRequirementProfile;
  savedRequirements?: AccessRequirementProfile;
  journeyMode: boolean;
  onUseSaved: () => void;
  onChangeJourney: () => void;
  onJourneyChange: (next: AccessRequirementProfile) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const summary = requirementsSummaryLabels(activeRequirements);
  const selectedCount = countSelectedRequirements(activeRequirements);

  return (
    <section
      aria-labelledby="my-access-requirements-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 id="my-access-requirements-heading" className="text-sm font-semibold text-[#0C1833]">
            My access requirements
          </h2>
          <p className="mt-1 text-sm text-slate-600">
            {selectedCount === 0
              ? "No requirements selected yet."
              : summary.length > 0
                ? summary.join(" · ")
                : `${selectedCount} requirement${selectedCount === 1 ? "" : "s"} selected`}
          </p>
          {journeyMode ? (
            <p className="mt-1 text-xs font-semibold text-[#005B7F]">
              Changed for this journey — your saved profile is unchanged.
            </p>
          ) : savedRequirements ? (
            <p className="mt-1 text-xs text-slate-600">Using your saved access requirements.</p>
          ) : null}
        </div>
        <div className="flex flex-wrap gap-2">
          {savedRequirements ? (
            <button
              type="button"
              className={`min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold ${mapableInteractiveFocusRing}`}
              onClick={onUseSaved}
              disabled={!journeyMode}
            >
              Use my saved access requirements
            </button>
          ) : null}
          <button
            type="button"
            className={`min-h-11 rounded-lg border border-slate-300 px-3 text-sm font-semibold ${mapableInteractiveFocusRing}`}
            onClick={() => {
              if (!journeyMode) onChangeJourney();
              setExpanded((v) => !v);
            }}
            aria-expanded={expanded}
          >
            {journeyMode ? "Change for this journey" : "Select requirements"}
          </button>
        </div>
      </div>

      {expanded ? (
        <div className="mt-4 space-y-4">
          <AccessNeedsTogglePanel
            needs={activeRequirements as AccessNeed}
            onChange={(next) =>
              onJourneyChange({
                ...activeRequirements,
                ...next,
              })
            }
          />

          <fieldset className="rounded-2xl border border-slate-200 bg-white p-4">
            <legend className="px-1 text-sm font-semibold text-[#0C1833]">
              Measurement and sensory preferences
            </legend>
            <p className="mt-1 text-xs text-slate-600">
              Missing place evidence stays UNKNOWN — preferences never invent accessibility.
            </p>
            <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
              {EXTENDED_BOOLEAN_FIELDS.map(({ key, label }) => (
                <li key={key}>
                  <label
                    className={`flex min-h-11 items-center gap-2 rounded-lg px-1 text-sm text-slate-700 ${mapableInteractiveFocusRing}`}
                  >
                    <input
                      type="checkbox"
                      className={`h-4 w-4 rounded border-slate-300 ${mapableInteractiveFocusRing}`}
                      checked={Boolean(activeRequirements[key])}
                      onChange={(event) =>
                        onJourneyChange({
                          ...activeRequirements,
                          [key]: event.target.checked,
                        })
                      }
                    />
                    <span>{label}</span>
                  </label>
                </li>
              ))}
            </ul>

            <div className="mt-4 grid gap-3 sm:grid-cols-3">
              <label className="text-sm text-slate-700">
                <span className="font-semibold">Min path width (mm)</span>
                <input
                  type="number"
                  min={0}
                  inputMode="numeric"
                  className={`mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                  value={activeRequirements.minimumPathWidthMm ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    onJourneyChange({
                      ...activeRequirements,
                      minimumPathWidthMm: raw === "" ? null : Number(raw),
                    });
                  }}
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold">Max gradient (%)</span>
                <input
                  type="number"
                  min={0}
                  inputMode="decimal"
                  className={`mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                  value={activeRequirements.maximumPreferredGradientPercent ?? ""}
                  onChange={(event) => {
                    const raw = event.target.value;
                    onJourneyChange({
                      ...activeRequirements,
                      maximumPreferredGradientPercent: raw === "" ? null : Number(raw),
                    });
                  }}
                />
              </label>
              <label className="text-sm text-slate-700">
                <span className="font-semibold">Surface tolerance</span>
                <select
                  className={`mt-1 min-h-11 w-full rounded-lg border border-slate-300 px-3 ${mapableInteractiveFocusRing}`}
                  value={activeRequirements.surfaceTolerance ?? ""}
                  onChange={(event) => {
                    const value = event.target.value;
                    onJourneyChange({
                      ...activeRequirements,
                      surfaceTolerance:
                        value === ""
                          ? null
                          : (value as AccessRequirementProfile["surfaceTolerance"]),
                    });
                  }}
                >
                  <option value="">No preference</option>
                  <option value="smooth_only">Smooth only</option>
                  <option value="firm_ok">Firm OK</option>
                  <option value="any">Any</option>
                </select>
              </label>
            </div>
          </fieldset>
        </div>
      ) : null}
    </section>
  );
}

export type { Mode as AccessRequirementsMode };
