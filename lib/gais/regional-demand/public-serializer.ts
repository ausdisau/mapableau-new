import type {
  GaisDemandIndicator,
  GaisRegionalDemandFeature,
} from "@/lib/gais/regional-demand/contracts";

export type PublicRegionalDemandFeature = {
  type: "Feature";
  id: string;
  geometry: GaisRegionalDemandFeature["geometry"];
  properties: {
    regionCode: string;
    regionName: string;
    regionLevel: GaisRegionalDemandFeature["regionLevel"];
    indicators: GaisDemandIndicator[];
    publicSummary: GaisRegionalDemandFeature["publicSummary"];
  };
};

export type PublicRegionalDemandFeatureCollection = {
  type: "FeatureCollection";
  features: PublicRegionalDemandFeature[];
  meta: {
    claimState: "in_development";
    evidenceScope: "regional_demand_public_context";
    internalStrategyScoreExposed: false;
    comparisonScope: "national_sa3";
    liveNationalRouting: false;
    generatedAt: string;
    featureCount: number;
  };
};

function approvedIndicator(
  indicator: GaisDemandIndicator,
): GaisDemandIndicator | null {
  const evidence = indicator.evidence.filter(
    (item) => item.licenceState === "approved_public_reuse",
  );
  if (!evidence.length) return null;
  return { ...indicator, evidence };
}

export function toPublicRegionalDemandFeature(
  feature: GaisRegionalDemandFeature,
): PublicRegionalDemandFeature | null {
  const indicators = feature.indicators
    .map(approvedIndicator)
    .filter((item): item is GaisDemandIndicator => item !== null);

  if (!indicators.length) return null;

  const dataAsOf = Array.from(
    new Set(
      indicators.flatMap((indicator) =>
        indicator.evidence.map((evidence) => evidence.referencePeriod),
      ),
    ),
  ).sort();

  return {
    type: "Feature",
    id: feature.id,
    geometry: feature.geometry,
    properties: {
      regionCode: feature.regionCode,
      regionName: feature.regionName,
      regionLevel: feature.regionLevel,
      indicators,
      publicSummary: {
        evidenceCoverage:
          feature.indicators.length === 0
            ? 0
            : indicators.length / feature.indicators.length,
        dataAsOf,
      },
    },
  };
}

export function toPublicRegionalDemandFeatureCollection(
  features: GaisRegionalDemandFeature[],
): PublicRegionalDemandFeatureCollection {
  const publicFeatures = features
    .map(toPublicRegionalDemandFeature)
    .filter((feature): feature is PublicRegionalDemandFeature => feature !== null);

  return {
    type: "FeatureCollection",
    features: publicFeatures,
    meta: {
      claimState: "in_development",
      evidenceScope: "regional_demand_public_context",
      internalStrategyScoreExposed: false,
      comparisonScope: "national_sa3",
      liveNationalRouting: false,
      generatedAt: new Date().toISOString(),
      featureCount: publicFeatures.length,
    },
  };
}
