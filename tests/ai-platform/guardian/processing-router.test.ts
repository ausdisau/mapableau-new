import { afterEach, describe, expect, it } from "vitest";

import { routeProcessing } from "@/lib/ai/platform/guardian/processing-router";

function clearGuardianEnv() {
  delete process.env.MAPABLE_GUARDIAN_ENABLED;
  delete process.env.MAPABLE_GUARDIAN_PROCESSOR_ROUTING_ENABLED;
  delete process.env.MAPABLE_GUARDIAN_PRIVATE_INFERENCE_ENABLED;
  delete process.env.MAPABLE_GUARDIAN_EXTERNAL_PROCESSING_ENABLED;
  delete process.env.MAPABLE_GUARDIAN_MODEL_INFERENCE_ENABLED;
}

function enablePrivateRouting() {
  process.env.MAPABLE_GUARDIAN_ENABLED = "true";
  process.env.MAPABLE_GUARDIAN_PROCESSOR_ROUTING_ENABLED = "true";
  process.env.MAPABLE_GUARDIAN_PRIVATE_INFERENCE_ENABLED = "true";
  process.env.MAPABLE_GUARDIAN_EXTERNAL_PROCESSING_ENABLED = "false";
  process.env.MAPABLE_GUARDIAN_MODEL_INFERENCE_ENABLED = "false";
}

describe("Guardian processing router", () => {
  afterEach(() => {
    clearGuardianEnv();
  });

  it("never routes D3 to APPROVED_EXTERNAL by default", () => {
    enablePrivateRouting();
    const r = routeProcessing({
      sensitivity: "D3_SENSITIVE",
      dataClasses: ["safeguarding"],
      purpose: "safeguarding_classification",
      privateInferenceAvailable: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.zone).not.toBe("APPROVED_EXTERNAL");
    expect(["DEVICE_EDGE", "MAPABLE_PRIVATE"]).toContain(r.zone);
  });

  it("keeps D4 off general-purpose models (deterministic only)", () => {
    enablePrivateRouting();
    const r = routeProcessing({
      sensitivity: "D4_RESTRICTED",
      dataClasses: ["financial"],
      purpose: "worker_readiness_policy_check",
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.modelProcessingAllowed).toBe(false);
    expect(r.provider.processorType).toBe("deterministic_only");
  });

  it("rejects useCloudModel bypass attempts", () => {
    enablePrivateRouting();
    const r = routeProcessing({
      sensitivity: "D3_SENSITIVE",
      dataClasses: ["health_sensitive"],
      purpose: "support_request_analysis",
      privateInferenceAvailable: false,
      useCloudModel: true,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reasonCodes).toContain("CLOUD_BYPASS_REJECTED");
    expect(r.reasonCodes).toContain("PRIVATE_FAILOVER_NO_CLOUD");
    expect(r.fallback).toBe("human_review");
  });

  it("does not silently cloud-fallback when private is unavailable", () => {
    enablePrivateRouting();
    process.env.MAPABLE_GUARDIAN_EXTERNAL_PROCESSING_ENABLED = "true";
    const r = routeProcessing({
      sensitivity: "D3_SENSITIVE",
      dataClasses: ["safeguarding"],
      purpose: "safeguarding_classification",
      privateInferenceAvailable: false,
      deviceEdgeAvailable: false,
    });
    expect(r.ok).toBe(false);
    if (r.ok) return;
    expect(r.reasonCodes).toContain("PRIVATE_FAILOVER_NO_CLOUD");
    expect(r.zone).toBeUndefined();
  });
});
