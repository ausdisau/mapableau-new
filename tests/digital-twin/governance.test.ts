import { describe, expect, it } from "vitest";

import {
  createAttestation,
  createAuditEvent,
  hashEvidencePayload,
  redactSensitiveFields,
  resetGovernanceStoreForTests,
} from "@/lib/digital-twin/governance";

describe("digital twin governance", () => {
  it("redacts sensitive fields", () => {
    const redacted = redactSensitiveFields({
      summary: "Public info",
      emergencyNotes: "Private note",
      ownerUserId: "user-123",
    });
    expect(redacted.summary).toBe("Public info");
    expect(redacted.emergencyNotes).toBe("[REDACTED]");
    expect(redacted.ownerUserId).toBe("[REDACTED]");
  });

  it("hashes evidence payloads deterministically", () => {
    const a = hashEvidencePayload({ b: 2, a: 1 });
    const b = hashEvidencePayload({ a: 1, b: 2 });
    expect(a).toBe(b);
    expect(a).toMatch(/^[a-f0-9]{64}$/);
  });

  it("creates audit events and attestations", () => {
    resetGovernanceStoreForTests();
    const event = createAuditEvent({
      eventType: "place_created",
      entityType: "TwinPlace",
      entityId: "test-place",
    });
    expect(event.id).toBeTruthy();

    const attestation = createAttestation({
      entityType: "TwinEvidence",
      entityId: "ev-1",
      payload: { width: 920 },
      attestedBy: "demo-assessor",
    });
    expect(attestation.payloadHash).toBeTruthy();
  });
});
