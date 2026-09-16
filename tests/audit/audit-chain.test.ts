import { describe, expect, it } from "vitest";

import {
  AUDIT_CHAIN_VERSION,
  auditChainKey,
  canonicalSerialize,
  computeAuditChainAssignments,
  hashAuditEvent,
  verifyAuditEventChains,
  type AuditEventChainRow,
} from "@/lib/audit/audit-chain";

function event(overrides: Partial<AuditEventChainRow> = {}): AuditEventChainRow {
  return {
    id: "evt-1",
    actorUserId: "user-1",
    actorRole: null,
    action: "consent.granted",
    entityType: "ConsentRecord",
    entityId: "consent-1",
    participantId: "participant-1",
    organisationId: "org-a",
    metadata: { z: 2, a: { y: true, x: "value" } },
    ipAddress: "203.0.113.10",
    userAgent: "test-agent",
    createdAt: new Date("2026-09-17T00:00:00.000Z"),
    chainKey: null,
    chainPosition: null,
    previousHash: null,
    currentHash: null,
    ...overrides,
  };
}

describe("audit chain canonicalization", () => {
  it("sorts object keys recursively while preserving array order", () => {
    expect(
      canonicalSerialize({
        z: 3,
        a: { z: "last", a: [3, { b: 2, a: 1 }] },
        m: false,
      }),
    ).toBe(
      '{"a":{"a":[3,{"a":1,"b":2}],"z":"last"},"m":false,"z":3}',
    );
  });

  it("normalizes dates and rejects values that JSON cannot represent safely", () => {
    expect(canonicalSerialize({ at: new Date("2026-09-17T00:00:00Z") })).toBe(
      '{"at":"2026-09-17T00:00:00.000Z"}',
    );
    expect(() => canonicalSerialize({ unsafe: Number.NaN })).toThrow(
      /non-finite/i,
    );
    expect(() => canonicalSerialize({ unsafe: BigInt(1) })).toThrow(
      /bigint/i,
    );
  });

  it("uses separate organisation chains and one null-organisation system chain", () => {
    expect(AUDIT_CHAIN_VERSION).toBe("audit-event-v1");
    expect(auditChainKey("org-a")).toBe("audit-event-v1:org:org-a");
    expect(auditChainKey("org-b")).toBe("audit-event-v1:org:org-b");
    expect(auditChainKey(null)).toBe("audit-event-v1:system");
    expect(auditChainKey(undefined)).toBe("audit-event-v1:system");
  });

  it("produces the same hash for semantically identical metadata with different key order", () => {
    const base = event();
    const first = hashAuditEvent({
      chainKey: auditChainKey(base.organisationId),
      chainPosition: 1n,
      previousHash: null,
      event: base,
    });
    const second = hashAuditEvent({
      chainKey: auditChainKey(base.organisationId),
      chainPosition: 1n,
      previousHash: null,
      event: event({ metadata: { a: { x: "value", y: true }, z: 2 } }),
    });
    expect(first).toBe(second);
    expect(first).toMatch(/^[a-f0-9]{64}$/);
  });
});

describe("deterministic full-history backfill", () => {
  it("chains each organisation independently and orders ties by event id", () => {
    const at = new Date("2026-09-17T01:00:00.000Z");
    const rows = [
      event({ id: "org-a-b", createdAt: at, organisationId: "org-a" }),
      event({ id: "system-2", createdAt: new Date(at.getTime() + 2), organisationId: null }),
      event({ id: "org-b-1", createdAt: at, organisationId: "org-b" }),
      event({ id: "system-1", createdAt: new Date(at.getTime() + 1), organisationId: null }),
      event({ id: "org-a-a", createdAt: at, organisationId: "org-a" }),
    ];

    const assignments = computeAuditChainAssignments(rows);
    const byId = new Map(assignments.map((row) => [row.id, row]));

    expect(byId.get("org-a-a")?.chainPosition).toBe(1n);
    expect(byId.get("org-a-a")?.previousHash).toBeNull();
    expect(byId.get("org-a-b")?.chainPosition).toBe(2n);
    expect(byId.get("org-a-b")?.previousHash).toBe(
      byId.get("org-a-a")?.currentHash,
    );

    expect(byId.get("org-b-1")?.chainPosition).toBe(1n);
    expect(byId.get("org-b-1")?.previousHash).toBeNull();

    expect(byId.get("system-1")?.chainKey).toBe("audit-event-v1:system");
    expect(byId.get("system-1")?.chainPosition).toBe(1n);
    expect(byId.get("system-2")?.chainPosition).toBe(2n);
    expect(byId.get("system-2")?.previousHash).toBe(
      byId.get("system-1")?.currentHash,
    );
  });

  it("is deterministic regardless of input row order", () => {
    const rows = [
      event({ id: "a", createdAt: new Date("2026-01-01T00:00:00Z") }),
      event({ id: "b", createdAt: new Date("2026-01-02T00:00:00Z") }),
      event({ id: "c", createdAt: new Date("2026-01-03T00:00:00Z") }),
    ];
    expect(computeAuditChainAssignments(rows)).toEqual(
      computeAuditChainAssignments([...rows].reverse()),
    );
  });
});

describe("audit chain verification", () => {
  it("accepts a complete deterministic backfill and rejects payload tampering", () => {
    const source = [
      event({ id: "a", createdAt: new Date("2026-01-01T00:00:00Z") }),
      event({ id: "b", createdAt: new Date("2026-01-02T00:00:00Z") }),
    ];
    const assignments = computeAuditChainAssignments(source);
    const assigned = source.map((row) => ({
      ...row,
      ...assignments.find((assignment) => assignment.id === row.id)!,
    }));

    expect(verifyAuditEventChains(assigned)).toEqual({
      valid: true,
      errors: [],
      chainCount: 1,
      eventCount: 2,
    });

    const tampered = assigned.map((row) =>
      row.id === "a" ? { ...row, action: "consent.revoked" } : row,
    );
    const verification = verifyAuditEventChains(tampered);
    expect(verification.valid).toBe(false);
    expect(verification.errors.some((error) => error.eventId === "a")).toBe(
      true,
    );
  });

  it("rejects an event that points at the wrong predecessor", () => {
    const source = [
      event({ id: "a", createdAt: new Date("2026-01-01T00:00:00Z") }),
      event({ id: "b", createdAt: new Date("2026-01-02T00:00:00Z") }),
    ];
    const assignments = computeAuditChainAssignments(source);
    const assigned = source.map((row) => ({
      ...row,
      ...assignments.find((assignment) => assignment.id === row.id)!,
    }));
    assigned[1] = { ...assigned[1], previousHash: "0".repeat(64) };

    const verification = verifyAuditEventChains(assigned);
    expect(verification.valid).toBe(false);
    expect(
      verification.errors.some((error) => error.code === "PREVIOUS_HASH_MISMATCH"),
    ).toBe(true);
  });
});
