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
        <div className="mt-4">
          <AccessNeedsTogglePanel
            needs={activeRequirements as AccessNeed}
            onChange={(next) =>
              onJourneyChange({
                ...activeRequirements,
                ...next,
              })
            }
          />
        </div>
      ) : null}
    </section>
  );
}

export type { Mode as AccessRequirementsMode };
