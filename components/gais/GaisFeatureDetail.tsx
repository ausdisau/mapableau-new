"use client";

import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";
import type { AccessRequirements } from "@/lib/gais/compatibility";
import type { GaisFeatureType } from "@/lib/gais/contracts/feature-types";
import type { GaisGeoJsonFeature } from "@/lib/gais/geojson/converters";
import { humanizeGaisFeatureType } from "@/lib/gais/service/feature-mapper";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";
import { GaisCompatibilityPanel } from "@/components/gais/GaisCompatibilityPanel";

function formatDate(iso?: string): string {
  if (!iso) return "Unknown";
  try {
    return new Intl.DateTimeFormat("en-AU", {
      day: "numeric",
      month: "short",
      year: "numeric",
    }).format(new Date(iso));
  } catch {
    return "Unknown";
  }
}

export function GaisFeatureDetail({
  feature,
  onClose,
  compatibilityRequirements,
  useStoredProfile = false,
}: {
  feature: GaisGeoJsonFeature;
  onClose?: () => void;
  compatibilityRequirements?: AccessRequirements;
  useStoredProfile?: boolean;
}) {
  const props = feature.properties;
  const title =
    props.name ??
    humanizeGaisFeatureType(props.gaisFeatureType as GaisFeatureType);

  const isBarrier = props.gaisFeatureType === "TEMPORARY_BARRIER";

  return (
    <article className="gais-feature-detail min-w-[240px] max-w-[320px] text-sm text-[#0C1833]">
      <header>
        <h3 className="text-base font-bold leading-tight">{title}</h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#005B7F]">
          {humanizeGaisFeatureType(props.gaisFeatureType as GaisFeatureType)}
        </p>
      </header>

      <section className="mt-3" aria-labelledby="gais-what-we-know">
        <h4 id="gais-what-we-know" className="text-xs font-bold uppercase tracking-wide">
          What we know
        </h4>
        {props.knownAttributes.length ? (
          <dl className="mt-1 space-y-1">
            {props.knownAttributes.map((item) => (
              <div key={item.label} className="flex gap-2">
                <dt className="font-semibold">{item.label}:</dt>
                <dd>{item.value}</dd>
              </div>
            ))}
          </dl>
        ) : (
          <p className="mt-1 text-slate-600">Limited attribute data for this feature.</p>
        )}
        {props.unknownAttributes.length ? (
          <ul className="mt-2 space-y-0.5" aria-label="Unknown attributes">
            {props.unknownAttributes.map((label) => (
              <li key={label} className="text-xs text-slate-600">
                <span className="font-semibold">{label}:</span> Unknown
              </li>
            ))}
          </ul>
        ) : null}
      </section>

      <section className="mt-3" aria-labelledby="gais-evidence-heading">
        <h4 id="gais-evidence-heading" className="text-xs font-bold uppercase tracking-wide">
          Evidence
        </h4>
        <p className="mt-1">
          <span className="font-semibold">Source:</span>{" "}
          {props.gaisEvidenceState === "UNKNOWN"
            ? "Unknown"
            : GAIS_EVIDENCE_STATE_LABELS[props.gaisEvidenceState]}
        </p>
        <p className="mt-0.5 text-xs text-slate-600">
          When observed: {formatDate(props.observedAt)}
        </p>
        {props.confidence != null ? (
          <p className="mt-0.5 text-xs text-slate-600">
            Confidence: {Math.round(props.confidence * 100)}%
          </p>
        ) : null}
        {props.evidence.slice(0, 2).map((ev, i) => (
          <p key={i} className="mt-1 text-xs text-slate-600">
            {ev.sourceLabel ?? GAIS_EVIDENCE_STATE_LABELS[ev.sourceType]}
            {ev.observedAt ? ` · ${formatDate(ev.observedAt)}` : ""}
          </p>
        ))}
      </section>

      {isBarrier ? (
        <section className="mt-3 rounded-lg border border-amber-200 bg-amber-50 p-2 text-xs text-amber-950">
          <p>
            <span className="font-semibold">Reported:</span> {formatDate(props.observedAt)}
          </p>
          {props.validUntil ? (
            <p className="mt-1">
              <span className="font-semibold">Expected until:</span>{" "}
              {formatDate(props.validUntil)}
            </p>
          ) : (
            <p className="mt-1">Expiry time not recorded.</p>
          )}
          <p className="mt-1 text-amber-900">
            This condition may no longer apply after the expected end time.
          </p>
        </section>
      ) : null}

      <GaisCompatibilityPanel
        featureId={props.gaisFeatureId}
        placeId={props.placeId}
        requirements={compatibilityRequirements}
        useStoredProfile={useStoredProfile}
      />

      <p className="mt-3 text-xs text-slate-500" role="note">
        MapAble shows environmental facts and evidence — not a universal accessible/not
        accessible verdict.
      </p>

      {onClose ? (
        <button
          type="button"
          className={`mt-3 min-h-11 w-full rounded-lg border border-slate-300 px-3 text-xs font-semibold ${mapableCareFocusRing}`}
          onClick={onClose}
        >
          Close
        </button>
      ) : null}
    </article>
  );
}
