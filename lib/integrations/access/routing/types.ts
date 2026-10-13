import type {
  MobilityRoutingConstraints,
  RouteObjective,
  RoutePlanResult,
} from "@/lib/access/navigate/types";

export type AccessibleRouteRequest = {
  fromNodeId: string;
  toNodeId: string;
  constraints: MobilityRoutingConstraints;
  objectives?: RouteObjective[];
};

export type RouteEvidenceSegmentSummary = {
  segmentId: string;
  known: boolean;
  verified: boolean;
  confidence: number;
  warnings: string[];
};

export type RouteEvidenceSummary = {
  providerId: string;
  /** Never SAFE — only assessed / unknown / caution. */
  accessAssessment: "assessed" | "unknown" | "caution";
  unknownSegmentCount: number;
  lowConfidenceSegmentCount: number;
  segmentSummaries: RouteEvidenceSegmentSummary[];
  warnings: string[];
  /** Explicit: not a safety guarantee. */
  safetyClaim: "none";
};

export type AccessibleRouteResult = {
  plan: RoutePlanResult;
  evidenceSummary: RouteEvidenceSummary;
};

export interface AccessibleRouteProvider {
  readonly providerId: string;
  isEnabled(): boolean;
  planRoute(request: AccessibleRouteRequest): Promise<AccessibleRouteResult>;
}
