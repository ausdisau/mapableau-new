import type { GaisPolygon } from "@/lib/gais/contracts/geometry";

export type GaisRegionLevel = "SA3" | "SA2" | "LGA";

export type GaisDemandIndicatorKey =
  | "participantScale"
  | "growth"
  | "providerScarcity"
  | "marketConcentration"
  | "paymentIntensity"
  | "accessNeed";

export type GaisDemandLicenceState =
  | "approved_public_reuse"
  | "permission_required"
  | "unknown";

export type GaisDemandConfidence = "high" | "medium" | "low";

export type GaisDemandEvidence = {
  sourceId: string;
  publisher: string;
  sourceUrl: string;
  referencePeriod: string;
  retrievedAt: string;
  observedAt?: string;
  licenceState: GaisDemandLicenceState;
  confidence: GaisDemandConfidence;
  caveat?: string;
};

export type GaisDemandIndicator = {
  key: GaisDemandIndicatorKey;
  rawValue: number;
  unit: string;
  normalizedValue?: number;
  comparisonScope?: string;
  evidence: GaisDemandEvidence[];
};

export type RegionalStrategyResult = {
  strategyScore: number | null;
  scoreAvailability: "available" | "insufficient_data";
  weightCoverage: number;
  weightsVersion: string;
};

export type GaisRegionalDemandFeature = {
  id: string;
  regionCode: string;
  regionName: string;
  regionLevel: GaisRegionLevel;
  geometry: GaisPolygon;
  indicators: GaisDemandIndicator[];
  publicSummary: {
    evidenceCoverage: number;
    dataAsOf: string[];
  };
  internalStrategy?: RegionalStrategyResult;
};

export type RegionalDemandObservation = {
  regionCode: string;
  regionLevel: GaisRegionLevel;
  indicatorKey: GaisDemandIndicatorKey;
  rawValue: number;
  unit: string;
  evidence: GaisDemandEvidence;
};

export interface RegionalDemandSourceAdapter {
  sourceId: string;
  fetchObservations(): Promise<RegionalDemandObservation[]>;
}
