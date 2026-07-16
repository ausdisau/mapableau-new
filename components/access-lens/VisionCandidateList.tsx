import React from "react";

import {
  VISION_FEATURE_LABELS,
  VISION_HAZARD_LABELS,
  VISION_PARTICIPANT_STATE_LABELS,
  type PerceptionCandidate,
} from "@/lib/vision-access";
import { mapablePublicCardClass } from "@/lib/marketing/public-page-styles";

type VisionCandidateListProps = {
  candidates: PerceptionCandidate[];
  id?: string;
  heading?: string;
  description?: string;
};

function classLabel(candidate: PerceptionCandidate): string {
  if (candidate.featureClass) {
    return VISION_FEATURE_LABELS[candidate.featureClass];
  }
  if (candidate.hazardClass) {
    return VISION_HAZARD_LABELS[candidate.hazardClass];
  }
  return candidate.kind;
}

export function VisionCandidateList({
  candidates,
  id = "access-lens-candidate-list",
  heading = "Candidate list",
  description = "Authoritative text equivalent for every overlay. Prefer this view if you do not want to use the visual preview.",
}: VisionCandidateListProps) {
  return (
    <div className={mapablePublicCardClass} id={id} tabIndex={-1}>
      <h3 className="text-lg font-black text-mapable-navy">{heading}</h3>
      <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
      <ol className="mt-5 space-y-3">
        {candidates.map((candidate, index) => (
          <li
            key={candidate.id}
            className="rounded-2xl border border-slate-200 bg-mapable-surface p-4"
          >
            <p className="text-xs font-black uppercase tracking-[0.12em] text-mapable-brand">
              {index + 1}. {classLabel(candidate)}
            </p>
            <p className="mt-1 text-base font-bold text-mapable-navy">{candidate.label}</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              {candidate.description}
            </p>
            <dl className="mt-3 grid gap-1 text-xs font-semibold text-slate-700 sm:grid-cols-2">
              <div>
                <dt className="inline text-slate-500">State: </dt>
                <dd className="inline">
                  {VISION_PARTICIPANT_STATE_LABELS[candidate.participantFacingState]}
                </dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Lifecycle: </dt>
                <dd className="inline">{candidate.state.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Source: </dt>
                <dd className="inline">{candidate.source.replaceAll("_", " ")}</dd>
              </div>
              <div>
                <dt className="inline text-slate-500">Measurement: </dt>
                <dd className="inline">Unavailable (not a certified measurement)</dd>
              </div>
            </dl>
          </li>
        ))}
      </ol>
    </div>
  );
}
