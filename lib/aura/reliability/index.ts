import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";

export type AccessServiceIndicator =
  | "accessible_entrance_uptime"
  | "lift_uptime"
  | "automatic_door_availability"
  | "accessible_toilet_availability"
  | "hearing_loop_availability"
  | "caption_system_availability"
  | "accessible_vehicle_confirmation"
  | "live_feed_freshness"
  | "incident_acknowledgement"
  | "temporary_route_publication"
  | "restoration_time"
  | "assistance_request_response"
  | "verified_alternative_availability";

export type ReliabilityState =
  | "available"
  | "unavailable"
  | "degraded"
  | "scheduled_maintenance"
  | "unknown"
  | "telemetry_unavailable"
  | "disputed"
  | "unverified";

export type AccessReliabilityWindow = {
  id: string;
  placeId: string;
  elementId: string;
  indicator: AccessServiceIndicator;
  period: "current" | "7d" | "30d" | "90d" | "12m" | "event" | "operating_hours";
  availabilityPercent: number | null;
  unplannedInterruptions: number;
  medianRestorationMinutes: number | null;
  alternativeAvailableCount: number;
  alternativeTotal: number;
  telemetryCoveragePercent: number;
  missingDataCountedAsUptime: false;
  methodology: string;
  sourceCoverage: string[];
  missingData: string[];
  scheduledExclusions: string[];
  confidence: number;
  lastUpdated: string;
  paidPlanInfluenced: false;
  personalFitScore: never | null;
};

export type AccessServiceCommitment = {
  id: string;
  organisationId: string;
  scope: string;
  indicator: AccessServiceIndicator;
  target: string;
  effectiveDate: string;
  expiry: string;
  exclusions: string[];
  evidenceSource: string;
  breachMethod: string;
  explanation: string;
  remediationPath: string;
  legalComplianceBadge: false;
  version: number;
};

const windows = new Map<string, AccessReliabilityWindow>();
const commitments = new Map<string, AccessServiceCommitment>();

export function resetReliabilityStore(): void {
  windows.clear();
  commitments.clear();
}

export function recordReliabilityWindow(
  input: Omit<
    AccessReliabilityWindow,
    "id" | "missingDataCountedAsUptime" | "paidPlanInfluenced" | "personalFitScore"
  >,
): AccessReliabilityWindow {
  if (
    !auraFlags.accessReliabilityEnabled &&
    process.env.NODE_ENV !== "test" &&
    process.env.MAPABLE_AURA_DEMO !== "true"
  ) {
    throw new Error("MAPABLE_ACCESS_RELIABILITY_DISABLED");
  }
  if (input.telemetryCoveragePercent < 100 && input.availabilityPercent === 100) {
    throw new Error("AURA_RELIABILITY_MISSING_TELEMETRY_AS_UPTIME");
  }
  const window: AccessReliabilityWindow = {
    ...input,
    id: randomUUID(),
    missingDataCountedAsUptime: false,
    paidPlanInfluenced: false,
    personalFitScore: null,
  };
  windows.set(window.id, window);
  return window;
}

export function publishServiceCommitment(
  input: Omit<AccessServiceCommitment, "id" | "legalComplianceBadge" | "version">,
): AccessServiceCommitment {
  if (
    !auraFlags.serviceCommitmentsEnabled &&
    process.env.NODE_ENV !== "test"
  ) {
    throw new Error("MAPABLE_ACCESS_SERVICE_COMMITMENTS_DISABLED");
  }
  const commitment: AccessServiceCommitment = {
    ...input,
    id: randomUUID(),
    legalComplianceBadge: false,
    version: 1,
  };
  commitments.set(commitment.id, commitment);
  return commitment;
}

export function listReliabilityWindows(placeId: string): AccessReliabilityWindow[] {
  return [...windows.values()].filter((w) => w.placeId === placeId);
}

export function getPublicReliabilityCard(placeId: string, elementId: string) {
  const relevant = [...windows.values()].filter(
    (w) => w.placeId === placeId && w.elementId === elementId,
  );
  return relevant.map((w) => ({
    indicator: w.indicator,
    period: w.period,
    availabilityPercent: w.availabilityPercent,
    unplannedInterruptions: w.unplannedInterruptions,
    medianRestorationMinutes: w.medianRestorationMinutes,
    telemetryCoveragePercent: w.telemetryCoveragePercent,
    methodology: w.methodology,
    lastUpdated: w.lastUpdated,
    missingDataCountedAsUptime: w.missingDataCountedAsUptime,
  }));
}

export {
  evaluateWave9ReleaseGate,
  setWave9ReleaseGatePassed,
  assertWave9GateForWave10,
} from "./release-gate";
