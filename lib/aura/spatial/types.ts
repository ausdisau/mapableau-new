import type { AuraPocketCapabilityState } from "../pocket/types";

export type AuraSpatialCaptureRequest = {
  missionId?: string;
  placeId?: string;
  purpose: "assessor_prefill" | "route_connectivity" | "missing_measurements";
};

export type AuraSpatialCaptureSession = {
  sessionId: string;
  status: "active" | "completed" | "cancelled";
  startedAt: string;
};

export type AuraSpatialSpaceCandidate = {
  id: string;
  label: string;
  level?: string;
  provisional: true;
};

export type AuraSpatialElementCandidate = {
  id: string;
  type: string;
  label: string;
  provisional: true;
};

export type AuraSpatialCaptureResult = {
  sessionId: string;
  source: "roomplan" | "native_spatial_api" | "manual" | "simulator";
  rawAssetReference?: string;
  candidateSpaces: AuraSpatialSpaceCandidate[];
  candidateElements: AuraSpatialElementCandidate[];
  calibration: {
    state: "platform_reported" | "user_reference" | "not_calibrated";
    method?: string;
  };
  limitations: string[];
  verified: false;
  assessorVerified: false;
  capturedAt: string;
};

export interface AuraSpatialCaptureAdapter {
  readonly adapterId: string;
  readonly platform: string;
  detectAvailability(): Promise<AuraPocketCapabilityState>;
  startCapture(
    input: AuraSpatialCaptureRequest,
  ): Promise<AuraSpatialCaptureSession>;
  readCaptureResult(sessionId: string): Promise<AuraSpatialCaptureResult>;
  cancelCapture(sessionId: string): Promise<void>;
}

export type AuraManualMeasurement = {
  id: string;
  elementType: string;
  value: number;
  unit: string;
  method: "tape" | "laser" | "participant_estimate" | "community_mapper";
  instrument?: string;
  calibrationStatus: "calibrated" | "uncalibrated" | "unknown";
  mapperRole: "participant" | "community_mapper" | "assessor";
  photographRef?: string;
  observedAt: string;
  confidence: number;
  reviewerState: "pending" | "accepted" | "rejected";
  assessorVerified: false;
};
