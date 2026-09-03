"use client";

import Link from "next/link";

import { GAIS_EVIDENCE_STATE_LABELS } from "@/lib/gais/contracts/evidence";
import type { GaisArrivalFeature, GaisDestinationResolution } from "@/lib/gais/destination";
import { mapableCareFocusRing } from "@/lib/marketing/mapable-care-tokens";

function evidenceSourceLabel(feature: GaisArrivalFeature): string {
  const primary = feature.evidence[0];
  if (!primary || primary.sourceType === "UNKNOWN") {
    return "Accessibility evidence: unknown";
  }
  return `Source: ${primary.sourceLabel ?? GAIS_EVIDENCE_STATE_LABELS[primary.sourceType]}`;
}

function ArrivalFeatureCard({
  feature,
  mapHref,
}: {
  feature: GaisArrivalFeature;
  mapHref?: string;
}) {
  const hasGeometry = feature.geometry != null;
  const accessibilityUnknown = feature.unknowns.includes("accessibilityEvidence");

  return (
    <li className="rounded-xl border border-slate-200 bg-white px-4 py-3">
      <p className="font-semibold text-[#0C1833]">{feature.label}</p>
      {accessibilityUnknown ? (
        <p className="mt-1 text-sm text-slate-600">Accessibility evidence: unknown</p>
      ) : (
        <p className="mt-1 text-sm text-slate-600">{evidenceSourceLabel(feature)}</p>
      )}
      {feature.description ? (
        <p className="mt-1 text-sm text-slate-700">{feature.description}</p>
      ) : null}
      {!hasGeometry ? (
        <p className="mt-1 text-xs text-slate-500">Location coordinates: unknown</p>
      ) : null}
      {hasGeometry && mapHref ? (
        <Link
          href={mapHref}
          className={`mt-2 inline-flex min-h-10 items-center rounded-lg border border-slate-300 px-3 text-xs font-semibold text-[#005B7F] ${mapableCareFocusRing}`}
        >
          Show on map
        </Link>
      ) : null}
    </li>
  );
}

export function AccessDestinationArrival({
  destination,
}: {
  destination: GaisDestinationResolution;
}) {
  const mapBase = `/access?placeId=${encodeURIComponent(destination.place.placeId)}`;

  return (
    <section aria-labelledby="arrival-heading" className="space-y-3">
      <h2 id="arrival-heading" className="text-lg font-semibold">
        Arrival
      </h2>
      <p className="text-sm text-muted-foreground" role="note">
        Recorded arrival information for this place. Not indoor navigation. Missing
        coordinates stay unknown — MapAble does not invent entrance locations.
      </p>

      <ul className="space-y-2" aria-label="Arrival features">
        {destination.knownEntrances.map((feature) => (
          <ArrivalFeatureCard
            key={feature.id}
            feature={feature}
            mapHref={feature.geometry ? mapBase : undefined}
          />
        ))}
        {destination.knownDropOffPoints.map((feature) => (
          <ArrivalFeatureCard
            key={feature.id}
            feature={feature}
            mapHref={feature.geometry ? mapBase : undefined}
          />
        ))}
        {destination.otherArrivalFeatures.map((feature) => (
          <ArrivalFeatureCard
            key={feature.id}
            feature={feature}
            mapHref={feature.geometry ? mapBase : undefined}
          />
        ))}
      </ul>

      {destination.unknowns.length ? (
        <div>
          <h3 className="text-sm font-semibold text-slate-700">Unknown for arrival</h3>
          <ul className="mt-1 list-disc pl-5 text-sm text-slate-600">
            {destination.unknowns.map((item) => (
              <li key={item}>{item.replace(/([A-Z])/g, " $1").toLowerCase().trim()}</li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
