import { afterEach, describe, expect, it } from "vitest";

import {
  assertSpatialProvisional,
  noSpatialHardwareAdapter,
  recordManualMeasurement,
  resetSpatialStore,
  selectSpatialAdapter,
  simulatorSpatialAdapter,
} from "@/lib/aura/spatial";

afterEach(() => {
  resetSpatialStore();
});

describe("Wave 6 — spatial lens", () => {
  it("no spatial hardware returns safe fallback", async () => {
    const cap = await noSpatialHardwareAdapter.detectAvailability();
    expect(cap.state).toBe("not_supported");
    await expect(noSpatialHardwareAdapter.startCapture({ purpose: "route_connectivity" })).rejects.toThrow(
      "AURA_SPATIAL_NOT_SUPPORTED",
    );
  });

  it("simulator capture is labelled simulated", async () => {
    const session = await simulatorSpatialAdapter.startCapture({
      purpose: "assessor_prefill",
    });
    const result = await simulatorSpatialAdapter.readCaptureResult(session.sessionId);
    expect(result.source).toBe("simulator");
    assertSpatialProvisional(result);
    expect(result.verified).toBe(false);
  });

  it("manual measurement path works", () => {
    const m = recordManualMeasurement({
      elementType: "doorway",
      value: 910,
      unit: "mm",
      method: "tape",
      calibrationStatus: "uncalibrated",
      mapperRole: "participant",
      observedAt: new Date().toISOString(),
      confidence: 0.6,
    });
    expect(m.assessorVerified).toBe(false);
  });

  it("capture cancellation works", async () => {
    const session = await simulatorSpatialAdapter.startCapture({
      purpose: "missing_measurements",
    });
    await simulatorSpatialAdapter.cancelCapture(session.sessionId);
    await expect(
      simulatorSpatialAdapter.readCaptureResult(session.sessionId),
    ).rejects.toThrow();
  });
});
