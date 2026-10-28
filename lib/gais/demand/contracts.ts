import type { GaisBounds } from "@/lib/gais/contracts/bounds";

export type GaisDemandContextLabel =
  | "smaller"
  | "established"
  | "large"
  | "large_and_growing";

export type GaisDemandEvidence = {
  sourceOrganisation: "National Disability Insurance Agency";
  sourceUrl: string;
  geography: "SA3 2016";
  observedAt: string;
  claimState: "verified_public_source";
  limitations: string[];
};

export type GaisDemandRegionMetric = {
  regionCode: string;
  regionName: string;
  state: string;
  participantCount: number | null;
  participantCountSuppressed: boolean;
  previousYearParticipantCount: number | null;
  previousObservedAt: string | null;
  yoyGrowthPercent: number | null;
  contextLabel: GaisDemandContextLabel;
  strategyIndex: number | null;
  growthAvailable: boolean;
  observedAt: string;
  evidence: GaisDemandEvidence;
};

export type GaisDemandPolygonGeometry = {
  type: "Polygon";
  coordinates: number[][][];
};

export type GaisDemandMultiPolygonGeometry = {
  type: "MultiPolygon";
  coordinates: number[][][][];
};

export type GaisDemandGeometry =
  | GaisDemandPolygonGeometry
  | GaisDemandMultiPolygonGeometry;

export type GaisDemandRegionProperties = GaisDemandRegionMetric & {
  strategyClaimState: "exploratory";
};

export type GaisDemandRegionFeature = {
  type: "Feature";
  id?: string | number;
  geometry: GaisDemandGeometry;
  properties: GaisDemandRegionProperties;
};

export type GaisDemandFeatureCollection = {
  type: "FeatureCollection";
  features: GaisDemandRegionFeature[];
  meta: {
    claimState: "in_development";
    strategyClaimState: "exploratory";
    evidenceScope: "public_regional_aggregate_ndia_sa3";
    geography: "SA3 2016";
    generatedAt: string;
    sources: {
      ndia: string;
      abs: string;
    };
    limitations: string[];
  };
};

export type GaisDemandServiceDeps = {
  fetchImpl?: typeof fetch;
  now?: () => Date;
};

export type GaisDemandBounds = Pick<
  GaisBounds,
  "minLat" | "minLng" | "maxLat" | "maxLng"
>;
