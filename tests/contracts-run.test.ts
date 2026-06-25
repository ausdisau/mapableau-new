import { describe, expect, it } from "vitest";

import { hashEvidence, hashEvidenceObject } from "@/lib/contracts/hash";
import { runContractsForTrigger } from "@/lib/contracts/runContracts";
import { loadContractsByTrigger } from "@/lib/contracts/contracts";

describe("contract runner", () => {
  it("hashes evidence deterministically", () => {
    expect(hashEvidence("hello")).toBe(hashEvidence("hello"));
    expect(hashEvidence("hello")).not.toBe(hashEvidence("world"));
  });

  it("hashes objects deterministically", () => {
    expect(hashEvidenceObject({ a: 1 })).toBe(hashEvidenceObject({ a: 1 }));
  });

  it("blocks when service summary not confirmed", () => {
    const result = runContractsForTrigger(loadContractsByTrigger("before_service_start"), {
      participantConfirmedSummary: false,
      pricingWithinLimit: true,
    });
    expect(result.overall).not.toBe("proceed");
    expect(result.evaluations.length).toBeGreaterThan(0);
  });

  it("proceeds when context satisfies contracts", () => {
    const result = runContractsForTrigger(loadContractsByTrigger("before_service_start"), {
      participantConfirmedSummary: true,
      pricingWithinLimit: true,
      actorType: "participant",
      actorRef: "test",
    });
    expect(result.overall).toBe("proceed");
  });
});
