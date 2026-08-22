"use client";

import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";
import type { GaisFeatureType } from "@/lib/gais/contracts/feature-types";
import type { GaisGeoJsonFeature } from "@/lib/gais/geojson/converters";
import { humanizeGaisFeatureType } from "@/lib/gais/service/feature-mapper";
import { mapableInteractiveFocusRing } from "@/lib/marketing/mapable-care-tokens";

import { GaisFeatureDetail } from "./GaisFeatureDetail";

export function GaisFeatureListPanel({
  features,
  selectedId,
  onSelect,
  loading,
  error,
  meta,
}: {
  features: GaisGeoJsonFeature[];
  selectedId?: string;
  onSelect: (id: string | undefined) => void;
  loading?: boolean;
  error?: string | null;
  meta?: { claimState: string; evidenceScope: string } | null;
}) {
  const barriers = features.filter(
    (f) => f.properties.gaisFeatureType === "TEMPORARY_BARRIER",
  );
  const other = features.filter(
    (f) => f.properties.gaisFeatureType !== "TEMPORARY_BARRIER",
  );

  return (
    <section
      aria-labelledby="gais-list-heading"
      className="rounded-2xl border border-slate-200 bg-white p-4"
    >
      <h2 id="gais-list-heading" className="text-lg font-bold">
        Accessibility information
      </h2>
      <p className="mt-1 text-xs text-slate-600" role="note">
        Text alternative to map symbols. Being developed —{" "}
        {meta?.evidenceScope?.replace(/_/g, " ") ?? "published place evidence"}.
      </p>

      {loading ? (
        <p className="mt-3 text-sm text-slate-600" role="status">
          Loading accessibility information…
        </p>
      ) : null}
      {error ? (
        <p className="mt-3 text-sm text-rose-800" role="alert">
          {error}
        </p>
      ) : null}

      {!loading && !features.length && !error ? (
        <p className="mt-3 text-sm text-slate-600">
          No GAIS features in this map area yet. Pan the map or zoom out to search a wider
          area.
        </p>
      ) : null}

      {barriers.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-amber-900">
            Current access conditions
          </h3>
          <p className="mt-1 text-xs text-slate-600">
            From map layer data — see Access Conditions API for full temporal events.
          </p>
          <ul className="mt-2 space-y-2" aria-label="Temporary accessibility conditions">
            {barriers.map((feature) => (
              <GaisListItem
                key={feature.id}
                feature={feature}
                isSelected={selectedId === feature.id}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {other.length ? (
        <div className="mt-4">
          <h3 className="text-sm font-bold uppercase tracking-wide text-[#005B7F]">
            Places and features
          </h3>
          <ul className="mt-2 space-y-2" aria-label="Accessibility features">
            {other.map((feature) => (
              <GaisListItem
                key={feature.id}
                feature={feature}
                isSelected={selectedId === feature.id}
                onSelect={onSelect}
              />
            ))}
          </ul>
        </div>
      ) : null}

      {selectedId ? (
        <div className="mt-4 border-t border-slate-200 pt-4">
          {(() => {
            const selected = features.find((f) => f.id === selectedId);
            if (!selected) return null;
            return (
              <GaisFeatureDetail
                feature={selected}
                onClose={() => onSelect(undefined)}
              />
            );
          })()}
        </div>
      ) : null}
    </section>
  );
}

function GaisListItem({
  feature,
  isSelected,
  onSelect,
}: {
  feature: GaisGeoJsonFeature;
  isSelected: boolean;
  onSelect: (id: string | undefined) => void;
}) {
  const props = feature.properties;
  const title =
    props.name ??
    humanizeGaisFeatureType(props.gaisFeatureType as GaisFeatureType);
  const evidenceLabel =
    props.gaisEvidenceState === "UNKNOWN"
      ? "Unknown"
      : GAIS_EVIDENCE_STATE_LABELS[props.gaisEvidenceState];

  return (
    <li>
      <button
        type="button"
        className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${isSelected ? "border-[#005B7F] bg-[#F6FBFC]" : "border-slate-200 bg-white"} ${mapableInteractiveFocusRing}`}
        aria-pressed={isSelected}
        onClick={() => onSelect(isSelected ? undefined : feature.id)}
      >
        <span className="font-semibold">{title}</span>
        <span className="mt-0.5 block text-xs text-slate-600">
          {humanizeGaisFeatureType(props.gaisFeatureType as GaisFeatureType)} ·{" "}
          {evidenceLabel}
        </span>
        {props.unknownAttributes.length ? (
          <span className="mt-0.5 block text-xs text-slate-500">
            Unknown: {props.unknownAttributes.slice(0, 2).join(", ")}
            {props.unknownAttributes.length > 2 ? "…" : ""}
          </span>
        ) : null}
      </button>
    </li>
  );
}
