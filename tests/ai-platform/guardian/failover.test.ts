import { afterEach, describe, expect, it } from "vitest";

import { routeProcessing } from "@/lib/ai/platform/guardian/processing-router";

describe("Guardian failover", () => {
  afterEach(() => {
    delete process.env.MAPABLE_GUARDIAN_ENABLED;
    delete process.env.MAPABLE_GUARDIAN_PROCESSOR_ROUTING_ENABLED;
    delete process.env.MAPABLE_GUARDIAN_PRIVATE_INFERENCE_ENABLED;
    delete process.env.MAPABLE_GUARDIAN_EXTERNAL_PROCESSING_ENABLED;
  });

  it("private outage does not select APPROVED_EXTERNAL for D2/D3", () => {
    process.env.MAPABLE_GUARDIAN_ENABLED = "true";
    process.env.MAPABLE_GUARDIAN_PROCESSOR_ROUTING_ENABLED = "true";
    process.env.MAPABLE_GUARDIAN_PRIVATE_INFERENCE_ENABLED = "true";
    process.env.MAPABLE_GUARDIAN_EXTERNAL_PROCESSING_ENABLED = "true";

    for (const sensitivity of ["D2_PERSONAL", "D3_SENSITIVE"] as const) {
      const r = routeProcessing({
        sensitivity,
        dataClasses:
          sensitivity === "D3_SENSITIVE"
            ? ["health_sensitive"]
            : ["participant_pii"],
        purpose: "support_request_analysis",
        privateInferenceAvailable: false,
        useCloudModel: true,
      });
      expect(r.ok).toBe(false);
      if (r.ok) return;
      expect(r.reasonCodes).toContain("PRIVATE_FAILOVER_NO_CLOUD");
    }
  });
});
