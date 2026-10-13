import type { AccessProvenanceStatus } from "@/lib/access/infrastructure/domains";

export type LocalAccessGuideEvidenceState = AccessProvenanceStatus;

export type LocalAccessGuideAssetKind =
  | "library"
  | "civic_building"
  | "park"
  | "playground"
  | "aquatic_facility"
  | "public_toilet"
  | "accessible_parking"
  | "footpath"
  | "crossing"
  | "kerb_ramp"
  | "transport_stop"
  | "priority_route"
  | "other";

export type LocalAccessGuideAsset = {
  id: string;
  placeId?: string | null;
  name: string;
  kind: LocalAccessGuideAssetKind;
  locality: string;
  latitude?: number | null;
  longitude?: number | null;
  evidenceState: LocalAccessGuideEvidenceState;
  sourceLabel: string;
  observedAt?: string | null;
  summary: string;
  auditRequired: boolean;
  barrierSeverity?: "critical" | "high" | "medium" | "low" | null;
};

export type LocalAccessGuideMetric = {
  id: string;
  label: string;
  value: number;
  denominator?: number | null;
  unit?: "count" | "percent";
};

export type LocalAccessGuide = {
  id: string;
  jurisdiction: "NSW";
  region: "Greater Sydney";
  lgaSlug: string;
  lgaName: string;
  title: string;
  description: string;
  productionClaim: "pilot" | "verified_public";
  generatedAt: string;
  evidenceNotice: string;
  localities: string[];
  assets: LocalAccessGuideAsset[];
  metrics: LocalAccessGuideMetric[];
};
