import { describe, expect, it } from "vitest";

import { apiScopeToPurposeCode, prmsScopeToPurposeCode } from "@/lib/rights-os/adapters/consent-record-adapter";

describe("consent-record adapter", () => {
  it("maps API scopes to purpose codes", () => {
    expect(apiScopeToPurposeCode("transport.accessibility_share")).toBe(
      "transport.driver_handover"
    );
    expect(apiScopeToPurposeCode("engagement.read_delegate")).toBe(
      "supporter.notify_change"
    );
  });

  it("maps PRMS scopes to purpose codes", () => {
    expect(prmsScopeToPurposeCode("transport_sharing")).toBe(
      "transport.driver_handover"
    );
    expect(prmsScopeToPurposeCode("employment_adjustments")).toBe(
      "jobs.request_adjustment"
    );
  });

  it("routes sensitive PRMS scopes to human review", () => {
    expect(prmsScopeToPurposeCode("medical_documents")).toBe("human_review_required");
    expect(prmsScopeToPurposeCode("emergency_disclosure")).toBe("human_review_required");
  });
});

describe("programme enforcement flags", () => {
  it("maps programmes to registered purposes", async () => {
    const { PROGRAMME_PURPOSE_MAP } = await import(
      "@/lib/rights-os/enforcement/enforcement-service"
    );
    expect(PROGRAMME_PURPOSE_MAP.access).toContain("access.verify_venue");
    expect(PROGRAMME_PURPOSE_MAP.transport).toContain("transport.driver_handover");
    expect(PROGRAMME_PURPOSE_MAP.jobs).toContain("jobs.request_adjustment");
  });

  it("does not enforce any programme in shadow mode", async () => {
    const { shouldEnforcePurpose } = await import("@/lib/rights-os/config");
    expect(shouldEnforcePurpose("access")).toBe(false);
    expect(shouldEnforcePurpose("transport")).toBe(false);
    expect(shouldEnforcePurpose("partners")).toBe(false);
  });
});

describe("enforcement service", () => {
  it("does not enforce in shadow mode", async () => {
    const { enforcePurposeIfEnabled } = await import(
      "@/lib/rights-os/enforcement/enforcement-service"
    );

    const result = await enforcePurposeIfEnabled({
      programme: "access",
      input: {
        requestId: "enforce-test",
        requester: { actorId: "a1", actorType: "venue_staff" },
        recipient: { displayName: "Venue" },
        subjectUserId: "p1",
        purposeCode: "access.verify_venue",
        requestedOperations: ["read"],
        requestedFields: ["diagnosis"],
        sourceAssets: [],
        context: {},
        requestedAt: new Date().toISOString(),
        onwardSharingRequested: false,
      },
    });

    expect(result.enforced).toBe(false);
    expect(result.allowed).toBe(true);
  });
});

describe("duty receipt disclaimer", () => {
  it("states attestation limitations", async () => {
    const { DUTY_RECEIPT_DISCLAIMER } = await import(
      "@/lib/rights-os/duties/duty-service"
    );
    expect(DUTY_RECEIPT_DISCLAIMER).toMatch(/not independent proof/i);
  });
});

describe("vault encryption roundtrip", () => {
  it("encrypts and decrypts payload", async () => {
    const { encryptVaultPayload, decryptVaultPayload } = await import(
      "@/lib/rights-os/vault/vault-service"
    );
    const plaintext = JSON.stringify({ arrival_time: "09:00" });
    const encrypted = encryptVaultPayload(plaintext);
    expect(encrypted).not.toContain("09:00");
    expect(decryptVaultPayload(encrypted)).toBe(plaintext);
  });
});
