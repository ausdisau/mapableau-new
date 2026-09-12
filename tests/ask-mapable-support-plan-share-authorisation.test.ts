import { describe, expect, it } from "vitest";

import type { PurposeBoundShareEnvelope } from "@/lib/ask-mapable/purpose-bound-sharing";
import { buildSupportPlanShareAuthorisationConsent } from "@/lib/ask-mapable/support-plan-share-authorisation";

const NOW = new Date("2026-09-12T05:30:00.000Z");

function validEnvelope(
  overrides: Partial<PurposeBoundShareEnvelope> = {},
): PurposeBoundShareEnvelope {
  return {
    id: "support-plan-share-123",
    recipient: { kind: "mapable_human", label: "MapAble human support" },
    purpose: "ask_for_support",
    selectedFields: ["thingsICanTry", "communicationAccess"],
    sections: [
      { label: "Things I can try", value: "PRIVATE SUPPORT PLAN TEXT" },
      { label: "How I communicate", value: "PRIVATE AAC DETAIL" },
    ],
    createdAt: "2026-09-12T05:20:00.000Z",
    expiresAt: "2026-09-12T06:30:00.000Z",
    status: "PREPARED",
    revokedAt: null,
    deliveryState: "NOT_SENT",
    sent: false,
    transmissionAuthorised: false,
    externalAcceptanceConfirmed: false,
    consentRecordId: null,
    ...overrides,
  };
}

describe("support-plan sharing authorisation", () => {
  it("builds one-time platform consent from a live prepared envelope", () => {
    const result = buildSupportPlanShareAuthorisationConsent(
      validEnvelope(),
      NOW,
    );

    expect(result).toEqual({
      ok: true,
      consent: {
        scope: "support_profile.read",
        purpose: "support_plan:ask_for_support",
        shareMode: "once",
        recipientType: "platform",
        dataScope: ["thingsICanTry", "communicationAccess"],
        sourceAction:
          "support_plan.share.mapable_human:support-plan-share-123",
        expiryDate: new Date("2026-09-12T06:30:00.000Z"),
        recordDisclosureOnGrant: false,
      },
      authorisation: {
        envelopeId: "support-plan-share-123",
        recipientKind: "mapable_human",
        purpose: "ask_for_support",
        selectedFields: ["thingsICanTry", "communicationAccess"],
        expiresAt: "2026-09-12T06:30:00.000Z",
        transmissionAuthorised: true,
        deliveryState: "NOT_SENT",
        sent: false,
        externalAcceptanceConfirmed: false,
      },
    });
  });

  it("never carries support-plan free text into the consent metadata", () => {
    const result = buildSupportPlanShareAuthorisationConsent(
      validEnvelope(),
      NOW,
    );

    expect(JSON.stringify(result)).not.toContain("PRIVATE SUPPORT PLAN TEXT");
    expect(JSON.stringify(result)).not.toContain("PRIVATE AAC DETAIL");
    expect(JSON.stringify(result)).not.toContain("sections");
  });

  it("rejects a revoked prepared envelope", () => {
    const result = buildSupportPlanShareAuthorisationConsent(
      validEnvelope({
        status: "REVOKED",
        revokedAt: "2026-09-12T05:25:00.000Z",
      }),
      NOW,
    );

    expect(result).toEqual({ ok: false, issues: ["REVOKED"] });
  });

  it("rejects a typed external recipient because a label is not a verified identity", () => {
    const result = buildSupportPlanShareAuthorisationConsent(
      validEnvelope({
        recipient: { kind: "external_service", label: "Typed service label" },
      }),
      NOW,
    );

    expect(result).toEqual({
      ok: false,
      issues: ["UNSUPPORTED_RECIPIENT"],
    });
  });

  it("rejects expired authorisation attempts", () => {
    const result = buildSupportPlanShareAuthorisationConsent(
      validEnvelope({ expiresAt: "2026-09-12T05:29:59.000Z" }),
      NOW,
    );

    expect(result).toEqual({ ok: false, issues: ["EXPIRED"] });
  });

  it("rejects an expiry more than seven days away", () => {
    const result = buildSupportPlanShareAuthorisationConsent(
      validEnvelope({ expiresAt: "2026-09-20T05:30:00.000Z" }),
      NOW,
    );

    expect(result).toEqual({ ok: false, issues: ["EXPIRY_TOO_LONG"] });
  });

  it("rejects unknown or empty selected fields instead of broadening consent", () => {
    const unknown = buildSupportPlanShareAuthorisationConsent(
      validEnvelope({
        selectedFields: ["communicationAccess", "diagnosis"] as unknown as PurposeBoundShareEnvelope["selectedFields"],
      }),
      NOW,
    );
    const empty = buildSupportPlanShareAuthorisationConsent(
      validEnvelope({ selectedFields: [] }),
      NOW,
    );

    expect(unknown).toEqual({ ok: false, issues: ["INVALID_FIELDS"] });
    expect(empty).toEqual({ ok: false, issues: ["FIELDS_REQUIRED"] });
  });

  it("rejects unknown purposes rather than accepting arbitrary disclosure reasons", () => {
    const result = buildSupportPlanShareAuthorisationConsent(
      validEnvelope({
        purpose: "anything_goes" as PurposeBoundShareEnvelope["purpose"],
      }),
      NOW,
    );

    expect(result).toEqual({ ok: false, issues: ["INVALID_PURPOSE"] });
  });
});
