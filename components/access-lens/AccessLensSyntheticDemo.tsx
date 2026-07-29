import React from "react";

import { AccessLensDemoUnavailable } from "@/components/access-lens/AccessLensDemoUnavailable";
import { AccessLensDisclaimer } from "@/components/access-lens/AccessLensDisclaimer";
import { VisionCandidateList } from "@/components/access-lens/VisionCandidateList";
import { VisionCandidateOverlay } from "@/components/access-lens/VisionCandidateOverlay";
import {
  mapablePublicCardClass,
  mapablePublicSectionTitleClass,
} from "@/lib/marketing/public-page-styles";
import {
  VISION_ACCESS_MEASUREMENT_LIMITATION,
  VISION_ACCESS_SYNTHETIC_BANNER,
  VISION_DEVICE_TIER_LABELS,
  VISION_MEASUREMENT_CLASS_LABELS,
  getDefaultSyntheticScene,
  getSortedCandidates,
  isVisionSyntheticDemoAvailable,
  type SyntheticScene,
} from "@/lib/vision-access";

type AccessLensSyntheticDemoProps = {
  scene?: SyntheticScene;
  id?: string;
  /** When true, skip flag gate (unit/a11y tests that pass an explicit scene). */
  forceShow?: boolean;
};

export function AccessLensSyntheticDemo({
  scene = getDefaultSyntheticScene(),
  id = "access-lens-demo",
  forceShow = false,
}: AccessLensSyntheticDemoProps) {
  if (!forceShow && !isVisionSyntheticDemoAvailable()) {
    return <AccessLensDemoUnavailable />;
  }

  const headingId = `${id}-heading`;
  const candidates = getSortedCandidates(scene.candidates);
  const geometry = scene.geometryEstimates[0];

  return (
    <section aria-labelledby={headingId} id={id} className="scroll-mt-24">
      <p className={mapablePublicSectionTitleClass}>Synthetic demo</p>
      <h2
        id={headingId}
        className="mapable-display mt-2 text-2xl font-black tracking-[-0.04em] text-mapable-navy sm:text-3xl"
      >
        {scene.title}
      </h2>
      <p className="mt-3 max-w-2xl text-base leading-7 text-slate-600">
        {scene.description} Example place: {scene.placeName}.
      </p>
      <p
        className="mt-4 max-w-2xl rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-semibold text-amber-950"
        role="status"
      >
        {VISION_ACCESS_SYNTHETIC_BANNER}
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        <VisionCandidateOverlay
          candidates={candidates}
          placeName={scene.placeName}
        />
        <VisionCandidateList candidates={candidates} />
      </div>

      <div className={`mt-6 ${mapablePublicCardClass}`}>
        <h3 className="text-lg font-black text-mapable-navy">
          Device and measurement limitations
        </h3>
        <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div>
            <dt className="font-semibold text-slate-500">Capability tier</dt>
            <dd>
              {scene.device.capabilityTier} —{" "}
              {VISION_DEVICE_TIER_LABELS[scene.device.capabilityTier]}
            </dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Camera</dt>
            <dd>Not requested (synthetic fixture)</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Frame quality</dt>
            <dd>{scene.frameQuality.outcome.replaceAll("_", " ")}</dd>
          </div>
          <div>
            <dt className="font-semibold text-slate-500">Geometry method</dt>
            <dd>
              {geometry
                ? VISION_MEASUREMENT_CLASS_LABELS[geometry.method]
                : "None"}
            </dd>
          </div>
        </dl>
        <p className="mt-4 text-sm font-semibold text-mapable-navy">
          {VISION_ACCESS_MEASUREMENT_LIMITATION}
        </p>
        <ul className="mt-3 list-disc space-y-1 pl-5 text-sm leading-6 text-slate-600">
          {scene.safetyNotes.map((note) => (
            <li key={note}>{note}</li>
          ))}
        </ul>
      </div>

      <div className="mt-6">
        <AccessLensDisclaimer compact={false} />
      </div>

      <p className="mt-4 text-sm text-slate-600">
        Upload and live capture controls are disabled in Wave 1. No AccessPlace records are
        modified by this demo.
      </p>
    </section>
  );
}
