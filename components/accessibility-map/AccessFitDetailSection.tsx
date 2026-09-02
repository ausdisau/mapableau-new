"use client";

import React, { useEffect, useState } from "react";

import { AccessFitBreakdown } from "@/components/access-fit/AccessFitBreakdown";
import { AccessFitBreakdownV2 } from "@/components/access-fit/AccessFitBreakdownV2";
import { WhatToConfirmList } from "@/components/access-fit/WhatToConfirmList";
import { QuickObservationDialog } from "@/components/accessibility-map/QuickObservationDialog";
import { isClientAccessExperienceV2Enabled } from "@/lib/access/experience/flags";
import { accessNeedToRequirementProfile } from "@/lib/access/experience/requirement-profile";
import { loadJourneyRequirementsForDetail } from "@/lib/access/experience/session-storage";
import { DEFAULT_ACCESS_REQUIREMENT_PROFILE } from "@/lib/access/experience/types";
import { calculateAccessFit } from "@/lib/access/fit/calculate-access-fit";
import { calculateAccessFitV2 } from "@/lib/access/fit/calculate-access-fit-v2";
import { DEMO_ACCESS_NEEDS } from "@/lib/access/fit/types";
import type { DemoAccessPlace } from "@/lib/demo/accessibility-places";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";


export function AccessFitDetailSection({
  place,
  unknownDomainQuestions,
}: {
  place: DemoAccessPlace;
  unknownDomainQuestions: string[];
}) {
  const v2Enabled = isClientAccessExperienceV2Enabled();
  const [showObservation, setShowObservation] = useState(false);
  const [requirements, setRequirements] = useState(DEFAULT_ACCESS_REQUIREMENT_PROFILE);

  useEffect(() => {
    if (!v2Enabled) return;
    const loaded = loadJourneyRequirementsForDetail();
    if (loaded) setRequirements(loaded);
  }, [v2Enabled]);

  if (!v2Enabled) {
    const fit = calculateAccessFit(DEMO_ACCESS_NEEDS, place.profile);
    return (
      <>
        <AccessFitBreakdown result={fit} />
        <WhatToConfirmList
          questions={[...fit.recommendedQuestions, ...unknownDomainQuestions]}
        />
      </>
    );
  }

  const fitV2 = calculateAccessFitV2(requirements, place.profile);
  const legacyNeeds = accessNeedToRequirementProfile(requirements);
  const legacyFit = calculateAccessFit(legacyNeeds, place.profile);

  return (
    <>
      <AccessFitBreakdownV2 result={fitV2} />
      <WhatToConfirmList
        questions={[
          ...legacyFit.recommendedQuestions,
          ...unknownDomainQuestions,
        ]}
      />
      <section className="rounded-2xl border border-slate-200 bg-[#F6FBFC] p-5">
        <h2 className="text-lg font-black">What we don&apos;t know</h2>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm text-slate-700">
          {place.domains
            .filter((d) => d.status === "unknown")
            .map((d) => (
              <li key={d.name}>
                {d.name}: {d.summary}
              </li>
            ))}
          {fitV2.unknownCount === 0 ? (
            <li>No unknown requirements for your current selection.</li>
          ) : null}
        </ul>
        <button
          type="button"
          className={`mt-4 inline-flex min-h-11 items-center rounded-xl border border-slate-300 bg-white px-4 text-sm font-black ${mapableInteractiveFocusRing}`}
          onClick={() => setShowObservation(true)}
        >
          Report what you found
        </button>
      </section>
      {showObservation ? (
        <QuickObservationDialog
          place={place}
          onClose={() => setShowObservation(false)}
          onSubmitted={() => setShowObservation(false)}
        />
      ) : null}
    </>
  );
}
