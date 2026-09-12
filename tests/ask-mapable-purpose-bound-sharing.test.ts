import { describe, expect, it } from "vitest";

import {
  buildPurposeBoundShareEnvelope,
  getPurposeBoundShareEnvelopeStatus,
  revokePurposeBoundShareEnvelope,
} from "@/lib/ask-mapable/purpose-bound-sharing";
import {
  buildConsentedSupportSummary,
  normaliseParticipantSupportPlan,
} from "@/lib/ask-mapable/participant-support-plan";

function supportSummary() {
  const plan = normaliseParticipantSupportPlan({
    thingsICanTry: "Move somewhere quieter.",
    peopleIChoose: "Alex",
    communicationAccess: "Please give me extra time to use AAC.",
  });

  const summary = buildConsentedSupportSummary({
    plan,
    selectedFields: ["thingsICanTry", "communicationAccess"],
  });

  if (!summary) throw new Error("Expected selected support summary");
  return summary;
}

describe("purpose-bound support-plan sharing", () => {
  it("binds an envelope to an exact recipient, purpose, selected fields and expiry", () => {
    const result = buildPurposeBoundShareEnvelope({
      envelopeId: "share-1",
      summary: supportSummary(),
      recipientKind: "chosen_person",
      recipientLabel: "Alex",
      purpose: "ask_for_support",
      expiryPreset: "one_hour",
      now: new Date("2026-09-10T12:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected a valid share envelope");

    expect(result.envelope).toMatchObject({
      id: "share-1",
      recipient: { kind: "chosen_person", label: "Alex" },
      purpose: "ask_for_support",
      selectedFields: ["thingsICanTry", "communicationAccess"],
      createdAt: "2026-09-10T12:00:00.000Z",
      expiresAt: "2026-09-10T13:00:00.000Z",
      status: "PREPARED",
      deliveryState: "NOT_SENT",
      sent: false,
      transmissionAuthorised: false,
      externalAcceptanceConfirmed: false,
      consentRecordId: null,
      revokedAt: null,
    });
    expect(result.envelope.sections).toEqual([
      { label: "Things I can try", value: "Move somewhere quieter." },
      { label: "How I communicate", value: "Please give me extra time to use AAC." },
    ]);
    expect(JSON.stringify(result.envelope)).not.toContain("peopleIChoose");
  });

  it("rejects preparation without an exact recipient label", () => {
    const result = buildPurposeBoundShareEnvelope({
      envelopeId: "share-2",
      summary: supportSummary(),
      recipientKind: "external_service",
      recipientLabel: "   ",
      purpose: "coordinate_follow_up",
      expiryPreset: "one_day",
      now: new Date("2026-09-10T12:00:00.000Z"),
    });

    expect(result).toEqual({
      ok: false,
      issues: ["RECIPIENT_REQUIRED"],
    });
  });

  it("never treats preparation as consent to transmit", () => {
    const result = buildPurposeBoundShareEnvelope({
      envelopeId: "share-3",
      summary: supportSummary(),
      recipientKind: "mapable_human",
      recipientLabel: "MapAble support team",
      purpose: "share_communication_access",
      expiryPreset: "seven_days",
      now: new Date("2026-09-10T12:00:00.000Z"),
    });

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("Expected a valid share envelope");

    expect(result.envelope.transmissionAuthorised).toBe(false);
    expect(result.envelope.sent).toBe(false);
    expect(result.envelope.deliveryState).toBe("NOT_SENT");
    expect(result.envelope.externalAcceptanceConfirmed).toBe(false);
    expect(result.envelope.consentRecordId).toBeNull();
  });

  it("expires automatically at the envelope deadline", () => {
    const result = buildPurposeBoundShareEnvelope({
      envelopeId: "share-4",
      summary: supportSummary(),
      recipientKind: "chosen_person",
      recipientLabel: "Alex",
      purpose: "ask_for_support",
      expiryPreset: "one_hour",
      now: new Date("2026-09-10T12:00:00.000Z"),
    });

    if (!result.ok) throw new Error("Expected a valid share envelope");

    expect(
      getPurposeBoundShareEnvelopeStatus(
        result.envelope,
        new Date("2026-09-10T12:59:59.000Z"),
      ),
    ).toBe("PREPARED");
    expect(
      getPurposeBoundShareEnvelopeStatus(
        result.envelope,
        new Date("2026-09-10T13:00:00.000Z"),
      ),
    ).toBe("EXPIRED");
  });

  it("supports explicit revocation without implying deletion or external recall", () => {
    const result = buildPurposeBoundShareEnvelope({
      envelopeId: "share-5",
      summary: supportSummary(),
      recipientKind: "chosen_person",
      recipientLabel: "Alex",
      purpose: "ask_for_support",
      expiryPreset: "one_day",
      now: new Date("2026-09-10T12:00:00.000Z"),
    });

    if (!result.ok) throw new Error("Expected a valid share envelope");

    const revoked = revokePurposeBoundShareEnvelope(
      result.envelope,
      new Date("2026-09-10T12:10:00.000Z"),
    );

    expect(revoked.status).toBe("REVOKED");
    expect(revoked.revokedAt).toBe("2026-09-10T12:10:00.000Z");
    expect(revoked.sent).toBe(false);
    expect(revoked.transmissionAuthorised).toBe(false);
    expect(revoked.externalAcceptanceConfirmed).toBe(false);
  });
});
