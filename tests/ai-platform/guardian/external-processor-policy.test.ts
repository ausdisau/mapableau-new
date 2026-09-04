import { afterEach, describe, expect, it } from "vitest";

import { routeProcessing } from "@/lib/ai/platform/guardian/processing-router";
import {
  listApprovedProcessingProviders,
  listProcessingProviders,
} from "@/lib/ai/platform/guardian/providers/registry";
import { selectEligibleProviders } from "@/lib/ai/platform/guardian/providers/policy";

describe("Guardian external processor policy", () => {
  afterEach(() => {
    delete process.env.MAPABLE_GUARDIAN_ENABLED;
    delete process.env.MAPABLE_GUARDIAN_PROCESSOR_ROUTING_ENABLED;
    delete process.env.MAPABLE_GUARDIAN_EXTERNAL_PROCESSING_ENABLED;
    delete process.env.MAPABLE_GUARDIAN_PRIVATE_INFERENCE_ENABLED;
  });

  it("seeds providers without secrets fields", () => {
    for (const p of listProcessingProviders()) {
      expect(p).not.toHaveProperty("apiKey");
      expect(p).not.toHaveProperty("secret");
      expect(p.killSwitchKey).toBeTruthy();
    }
    expect(listApprovedProcessingProviders().length).toBeGreaterThan(0);
  });

  it("has no APPROVED_EXTERNAL seed provider by default (fail closed)", () => {
    const external = selectEligibleProviders({
      zone: "APPROVED_EXTERNAL",
      sensitivity: "D0_PUBLIC",
      dataClasses: ["public"],
      purpose: "plain_language_explanation",
    });
    expect(external.length).toBe(0);
  });

  it("does not enable external routing when flag is off", () => {
    process.env.MAPABLE_GUARDIAN_ENABLED = "true";
    process.env.MAPABLE_GUARDIAN_PROCESSOR_ROUTING_ENABLED = "true";
    process.env.MAPABLE_GUARDIAN_EXTERNAL_PROCESSING_ENABLED = "false";
    process.env.MAPABLE_GUARDIAN_PRIVATE_INFERENCE_ENABLED = "true";

    const r = routeProcessing({
      sensitivity: "D0_PUBLIC",
      dataClasses: ["public"],
      purpose: "plain_language_explanation",
      privateInferenceAvailable: true,
    });
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.zone).not.toBe("APPROVED_EXTERNAL");
  });
});
