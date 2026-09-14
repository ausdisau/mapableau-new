import { afterEach, describe, expect, it } from "vitest";

import { sentinelEventEnvelopeSchema } from "@/lib/ai/platform/sentinel/contracts";
import { sentinelConfig } from "@/lib/config/sentinel";

describe("Sentinel contracts", () => {
  afterEach(() => {
    delete process.env.MAPABLE_SENTINEL_ENABLED;
    delete process.env.MAPABLE_SENTINEL_TEMPORAL_ENABLED;
    delete process.env.MAPABLE_SENTINEL_KILL_SWITCH;
  });

  it("keeps Sentinel disabled by default", () => {
    expect(sentinelConfig.enabled).toBe(false);
    expect(sentinelConfig.temporalEnabled).toBe(false);
  });

  it("accepts a reference-only transport event envelope", () => {
    const result = sentinelEventEnvelopeSchema.parse({
      eventId: "550e8400-e29b-41d4-a716-446655440000",
      schemaVersion: 1,
      domain: "transport",
      eventType: "transport.assignment.proposed",
      tenantId: "tenant-1",
      subjectRef: "TransportTrip:trip-1",
      participantRef: "Participant:pseudo-1",
      actorRef: "User:user-1",
      purpose: "transport_assignment_supervision",
      authorityRef: "AuthorityDecision:auth-1",
      consentRefs: ["ConsentReceipt:consent-1"],
      dataClasses: ["operational", "participant_pii"],
      evidenceRefs: ["TransportVerification:v-1"],
      occurredAt: "2026-09-14T00:00:00.000Z",
      source: "transport",
    });

    expect(result.domain).toBe("transport");
    expect(result.payloadRef).toBeUndefined();
  });

  it("rejects an unsupported domain", () => {
    expect(() =>
      sentinelEventEnvelopeSchema.parse({
        eventId: "550e8400-e29b-41d4-a716-446655440000",
        schemaVersion: 1,
        domain: "payments",
        eventType: "payment.approved",
        tenantId: "tenant-1",
        subjectRef: "Payment:p-1",
        actorRef: "User:user-1",
        purpose: "unsupported",
        consentRefs: [],
        dataClasses: ["financial"],
        evidenceRefs: [],
        occurredAt: "2026-09-14T00:00:00.000Z",
        source: "payments",
      }),
    ).toThrow();
  });
});
