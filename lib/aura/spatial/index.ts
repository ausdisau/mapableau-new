import { randomUUID } from "crypto";

import { auraFlags } from "../feature-flags";
import type { AuraPocketCapabilityState } from "../pocket/types";
import type {
  AuraManualMeasurement,
  AuraSpatialCaptureAdapter,
  AuraSpatialCaptureRequest,
  AuraSpatialCaptureResult,
  AuraSpatialCaptureSession,
} from "./types";

const sessions = new Map<string, AuraSpatialCaptureResult>();
const measurements = new Map<string, AuraManualMeasurement>();

export function resetSpatialStore(): void {
  sessions.clear();
  measurements.clear();
}

export const simulatorSpatialAdapter: AuraSpatialCaptureAdapter = {
  adapterId: "aura-spatial-simulator",
  platform: "simulator",
  async detectAvailability(): Promise<AuraPocketCapabilityState> {
    return {
      capability: "spatial_capture",
      state: auraFlags.spatialLensEnabled ? "available_with_limits" : "disabled_by_policy",
      provider: "deterministic",
      localProcessing: true,
      networkRequired: false,
      sensitiveInputAllowed: false,
      limitations: ["Simulator output labelled simulated; not assessor verification"],
      checkedAt: new Date().toISOString(),
    };
  },
  async startCapture(input: AuraSpatialCaptureRequest): Promise<AuraSpatialCaptureSession> {
    const sessionId = randomUUID();
    const result: AuraSpatialCaptureResult = {
      sessionId,
      source: "simulator",
      candidateSpaces: [
        { id: "space-reception", label: "Reception area", level: "G", provisional: true },
        { id: "space-corridor-west", label: "Western corridor", level: "G", provisional: true },
      ],
      candidateElements: [
        { id: "el-ent-b", type: "entrance", label: "Entrance B doorway", provisional: true },
        { id: "el-lift-west", type: "lift", label: "Western lift", provisional: true },
      ],
      calibration: { state: "not_calibrated" },
      limitations: [
        "Simulated spatial capture — provisional only",
        "Not assessor verification",
        "Doorway width not measured",
      ],
      verified: false,
      assessorVerified: false,
      capturedAt: new Date().toISOString(),
    };
    sessions.set(sessionId, result);
    void input;
    return { sessionId, status: "active", startedAt: result.capturedAt };
  },
  async readCaptureResult(sessionId: string): Promise<AuraSpatialCaptureResult> {
    const r = sessions.get(sessionId);
    if (!r) throw new Error("AURA_SPATIAL_SESSION_NOT_FOUND");
    return r;
  },
  async cancelCapture(sessionId: string): Promise<void> {
    sessions.delete(sessionId);
  },
};

export const noSpatialHardwareAdapter: AuraSpatialCaptureAdapter = {
  adapterId: "aura-spatial-none",
  platform: "browser",
  async detectAvailability(): Promise<AuraPocketCapabilityState> {
    return {
      capability: "spatial_capture",
      state: "not_supported",
      provider: "none",
      localProcessing: true,
      networkRequired: false,
      sensitiveInputAllowed: false,
      limitations: ["No spatial hardware; manual measurement path available"],
      checkedAt: new Date().toISOString(),
    };
  },
  async startCapture(): Promise<AuraSpatialCaptureSession> {
    throw new Error("AURA_SPATIAL_NOT_SUPPORTED");
  },
  async readCaptureResult(): Promise<AuraSpatialCaptureResult> {
    throw new Error("AURA_SPATIAL_NOT_SUPPORTED");
  },
  async cancelCapture(): Promise<void> {
    /* noop */
  },
};

export function selectSpatialAdapter(input?: {
  nativeSpatialAvailable?: boolean;
}): AuraSpatialCaptureAdapter {
  if (input?.nativeSpatialAvailable && auraFlags.nativeBridgesEnabled) {
    return simulatorSpatialAdapter;
  }
  if (auraFlags.spatialLensEnabled) {
    return simulatorSpatialAdapter;
  }
  return noSpatialHardwareAdapter;
}

export function recordManualMeasurement(input: Omit<AuraManualMeasurement, "id" | "assessorVerified" | "reviewerState"> & {
  reviewerState?: AuraManualMeasurement["reviewerState"];
}): AuraManualMeasurement {
  const m: AuraManualMeasurement = {
    ...input,
    id: randomUUID(),
    assessorVerified: false,
    reviewerState: input.reviewerState ?? "pending",
  };
  measurements.set(m.id, m);
  return m;
}

export function listManualMeasurements(missionId?: string): AuraManualMeasurement[] {
  return [...measurements.values()];
}

export function assertSpatialProvisional(result: AuraSpatialCaptureResult): void {
  if (result.verified !== false || result.assessorVerified !== false) {
    throw new Error("AURA_SPATIAL_VERIFICATION_VIOLATION");
  }
}
