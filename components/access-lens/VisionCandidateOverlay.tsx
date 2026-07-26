import React from "react";

import { mapablePublicMutedCardClass } from "@/lib/marketing/public-page-styles";
import {
  VISION_PARTICIPANT_STATE_LABELS,
  type PerceptionCandidate,
} from "@/lib/vision-access";

type VisionCandidateOverlayProps = {
  candidates: PerceptionCandidate[];
  placeName?: string;
};

function overlayPositionClass(index: number): string {
  const positions = [
    "top-6 left-4",
    "top-24 right-4",
    "top-[11rem] left-4",
    "bottom-28 right-4",
    "bottom-16 left-4",
  ];
  return positions[index % positions.length] ?? "top-6 left-4";
}

/**
 * Decorative mock preview. List view remains the accessible equivalent.
 * aria-hidden on individual chips; the phone frame has a summary aria-label.
 */
export function VisionCandidateOverlay({
  candidates,
  placeName,
}: VisionCandidateOverlayProps) {
  const visible = candidates.slice(0, 5);
  const label = placeName
    ? `Synthetic phone preview for ${placeName} with provisional access candidate labels`
    : "Synthetic phone preview with provisional access candidate labels";

  return (
    <div className={mapablePublicMutedCardClass}>
      <p className="text-sm font-bold text-mapable-navy">Synthetic camera view</p>
      <p className="mt-1 text-sm text-slate-600">
        Visual overlays only — fixtures, not live detection. Use the candidate list for the
        same information.
      </p>
      <div className="mt-4 flex justify-center">
        <div
          className="relative aspect-[9/16] w-full max-w-[280px] overflow-hidden rounded-[2rem] border-4 border-mapable-navy bg-slate-800 shadow-lg"
          role="img"
          aria-label={label}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 bg-gradient-to-b from-slate-600 via-slate-700 to-slate-900 motion-reduce:bg-slate-700"
          />
          <div
            aria-hidden="true"
            className="absolute left-1/2 top-3 h-2 w-16 -translate-x-1/2 rounded-full bg-slate-950"
          />
          <ul className="absolute inset-0 list-none p-0" aria-hidden="true">
            {visible.map((candidate, index) => (
              <li
                key={candidate.id}
                className={`absolute max-w-[11rem] rounded-lg border-2 border-white bg-mapable-navy/95 px-2 py-1.5 text-left text-xs font-bold leading-snug text-white shadow-md ${overlayPositionClass(index)}`}
              >
                <span className="block">{candidate.label}</span>
                <span className="mt-0.5 block text-[10px] font-semibold text-mapable-gold">
                  {VISION_PARTICIPANT_STATE_LABELS[candidate.participantFacingState]}
                </span>
              </li>
            ))}
          </ul>
          <div className="absolute bottom-4 left-1/2 flex -translate-x-1/2 gap-3">
            <span
              className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-full border-2 border-white bg-white/10 text-xs font-bold text-white"
              aria-hidden="true"
            >
              Demo
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
