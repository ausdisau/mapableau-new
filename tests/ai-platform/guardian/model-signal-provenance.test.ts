import { describe, expect, it } from "vitest";

import { evaluateGuardian } from "@/lib/ai/platform/guardian/guardian-service";
import type { GuardianModelSignal } from "@/lib/ai/platform/guardian/contracts";

describe("Guardian model signal provenance", () => {
  it("accepts model_inference signals with possible_* types", async () => {
    process.env.MAPABLE_GUARDIAN_ENABLED = "true";
    const signal: GuardianModelSignal = {
      signalId: "s1",
      signalType: "possible_boundary_violation",
      capabilityKey: "guardian.content_safety",
      provenance: "model_inference",
      generatedAt: new Date().toISOString(),
      limitations: ["inference_only"],
    };

    const result = await evaluateGuardian({
      purpose: "content_safety_screening",
      actorId: "u1",
      dataClasses: ["operational"],
      authorityGranted: true,
      modelSignals: [signal],
      writeAudit: false,
    });

    expect(result.decision.modelSignals[0]?.provenance).toBe("model_inference");
    expect(result.decision.modelSignals[0]?.signalType).toBe(
      "possible_boundary_violation"
    );
    delete process.env.MAPABLE_GUARDIAN_ENABLED;
  });

  it("rejects signals that are not model_inference", async () => {
    await expect(
      evaluateGuardian({
        purpose: "content_safety_screening",
        actorId: "u1",
        dataClasses: ["operational"],
        modelSignals: [
          {
            signalId: "bad",
            signalType: "possible_neglect",
            capabilityKey: "x",
            // @ts-expect-error intentional invalid provenance
            provenance: "confirmed_fact",
            generatedAt: new Date().toISOString(),
          },
        ],
        writeAudit: false,
      })
    ).rejects.toThrow(/PROVENANCE/);
  });

  it("rejects forbidden decision-like signal types", async () => {
    await expect(
      evaluateGuardian({
        purpose: "content_safety_screening",
        actorId: "u1",
        dataClasses: ["operational"],
        modelSignals: [
          {
            signalId: "bad2",
            signalType: "REPORTABLE",
            capabilityKey: "x",
            provenance: "model_inference",
            generatedAt: new Date().toISOString(),
          },
        ],
        writeAudit: false,
      })
    ).rejects.toThrow(/FORBIDDEN/);
  });
});
