import { describe, expect, it } from "vitest";

import {
  assertPersistableMemory,
  compareMemoryAuthority,
  interpretNoResponse,
  isWithinDataClass,
} from "@/lib/dc-lmf/policy";

describe("DC-LMF policy", () => {
  it("treats no response as unknown without an explicit communication contract", () => {
    expect(interpretNoResponse({})).toEqual({
      status: "unknown",
      meaning: null,
    });
  });

  it("uses an explicit communication-contract meaning when one exists", () => {
    expect(
      interpretNoResponse({ communicationContractMeaning: "WAIT" }),
    ).toEqual({ status: "known", meaning: "WAIT" });
  });

  it("ranks current direct self report above model inference", () => {
    const direct = {
      sourceType: "self_report" as const,
      observedAt: "2026-09-20T08:00:00.000Z",
    };
    const inferred = {
      sourceType: "model_inference" as const,
      observedAt: "2026-09-20T09:00:00.000Z",
    };
    expect([direct, inferred].sort(compareMemoryAuthority)[0]).toBe(direct);
  });

  it("blocks raw health-related and local-only persistent payloads", () => {
    expect(() =>
      assertPersistableMemory({
        dataClass: "health_related",
        payload: { diagnosis: "synthetic" },
        payloadRef: null,
        sourceType: "self_report",
        scope: "persistent",
      }),
    ).toThrow("DC_LMF_VAULT_REFERENCE_REQUIRED");

    expect(() =>
      assertPersistableMemory({
        dataClass: "local_only",
        payload: "private",
        payloadRef: null,
        sourceType: "self_report",
        scope: "persistent",
      }),
    ).toThrow("DC_LMF_VAULT_REFERENCE_REQUIRED");
  });

  it("prevents model inference becoming persistent authority", () => {
    expect(() =>
      assertPersistableMemory({
        dataClass: "person_private",
        payload: { state: "possible frustration" },
        payloadRef: null,
        sourceType: "model_inference",
        scope: "persistent",
      }),
    ).toThrow("DC_LMF_MODEL_INFERENCE_NOT_PERSISTENT_AUTHORITY");
  });

  it("enforces maximum disclosure data class", () => {
    expect(isWithinDataClass("person_private", "person_private")).toBe(true);
    expect(isWithinDataClass("health_related", "person_private")).toBe(false);
  });
});
