"use client";

import type { PublicRegionalDemandFeature } from "@/lib/gais/regional-demand/public-serializer";

const LABELS: Record<string, string> = {
  participantScale: "Participant scale",
  growth: "Recent growth",
  providerScarcity: "Provider availability context",
  marketConcentration: "Market concentration",
  paymentIntensity: "Payment intensity",
  accessNeed: "Access and assistance context",
};

function formatValue(value: number, unit: string): string {
  if (unit === "participants") {
    return `${new Intl.NumberFormat("en-AU").format(value)} participants`;
  }
  return `${new Intl.NumberFormat("en-AU", {
    maximumFractionDigits: 2,
  }).format(value)} ${unit}`;
}

export function GaisRegionalDemandSummary({
  feature,
}: {
  feature: PublicRegionalDemandFeature;
}) {
  const { properties } = feature;
  const evidence = properties.indicators.flatMap((indicator) => indicator.evidence);
  const publishers = Array.from(new Set(evidence.map((item) => item.publisher)));
  const caveats = Array.from(
    new Set(
      evidence
        .map((item) => item.caveat)
        .filter((value): value is string => Boolean(value)),
    ),
  );

  return (
    <article className="min-w-[260px] max-w-[360px] text-sm text-[#0C1833]">
      <header>
        <h3 className="text-base font-bold leading-tight">
          {properties.regionName}
        </h3>
        <p className="mt-1 text-xs font-semibold uppercase tracking-wide text-[#005B7F]">
          Regional service context · {properties.regionLevel}
        </p>
      </header>

      <section className="mt-3" aria-labelledby={`regional-signals-${feature.id}`}>
        <h4
          id={`regional-signals-${feature.id}`}
          className="text-xs font-bold uppercase tracking-wide"
        >
          Regional indicators
        </h4>
        <dl className="mt-1 space-y-2">
          {properties.indicators.map((indicator) => (
            <div key={indicator.key}>
              <dt className="font-semibold">
                {LABELS[indicator.key] ?? indicator.key}
              </dt>
              <dd>{formatValue(indicator.rawValue, indicator.unit)}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="mt-3" aria-labelledby={`regional-evidence-${feature.id}`}>
        <h4
          id={`regional-evidence-${feature.id}`}
          className="text-xs font-bold uppercase tracking-wide"
        >
          Evidence context
        </h4>
        <p className="mt-1">
          {Math.round(properties.publicSummary.evidenceCoverage * 100)}% evidence coverage
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Data period: {properties.publicSummary.dataAsOf.join(", ") || "Unknown"}
        </p>
        <p className="mt-1 text-xs text-slate-600">
          Source: {publishers.join(", ") || "Unknown"}
        </p>
        {caveats.map((caveat) => (
          <p key={caveat} className="mt-1 text-xs text-slate-600">
            {caveat}
          </p>
        ))}
      </section>

      <p className="mt-3 text-xs text-slate-500" role="note">
        Regional statistics provide context only. They do not prove individual
        service availability or suitability.
      </p>
    </article>
  );
}
