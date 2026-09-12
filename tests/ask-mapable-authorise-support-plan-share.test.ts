import { beforeEach, describe, expect, it, vi } from "vitest";

const { grantConsentMock } = vi.hoisted(() => ({
  grantConsentMock: vi.fn(),
}));

vi.mock("@/lib/consent/consent-service", () => ({
  grantConsent: grantConsentMock,
}));

import { authoriseSupportPlanShare } from "@/lib/ask-mapable/authorise-support-plan-share";
import type { PurposeBoundShareEnvelope } from "@/lib/ask-mapable/purpose-bound-sharing";

const NOW = new Date("2026-09-12T05:30:00.000Z");

function envelope(
  overrides: Partial<PurposeBoundShareEnvelope> = {},
): PurposeBoundShareEnvelope {
  return {
    id: "support-plan-share-123",
    recipient: { kind: "mapable_human", label: "MapAble human support" },
    purpose: "ask_for_support",
    selectedFields: ["thingsICanTry", "communicationAccess"],
    sections: [
      { label: "Things I can try", value: "SECRET SUPPORT PLAN DETAIL" },
      { label: "How I communicate", value: "SECRET AAC DETAIL" },
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

beforeEach(() => {
  vi.clearAllMocks();
  grantConsentMock.mockResolvedValue({ id: "consent-share-123" });
});

describe("authoriseSupportPlanShare", () => {
  it("binds one-time Core consent to the exact prepared envelope without sending", async () => {
    const result = await authoriseSupportPlanShare({
      subjectUserId: "participant-1",
      actorUserId: "participant-1",
      now: NOW,
      envelope: envelope(),
    });

    expect(grantConsentMock).toHaveBeenCalledWith({
      subjectUserId: "participant-1",
      createdById: "participant-1",
      scope: "support_profile.read",
      purpose: "support_plan:ask_for_support",
      shareMode: "once",
      recipientType: "platform",
      dataScope: ["thingsICanTry", "communicationAccess"],
      sourceAction:
        "support_plan.share.mapable_human:support-plan-share-123",
      expiryDate: new Date("2026-09-12T06:30:00.000Z"),
      recordDisclosureOnGrant: false,
    });

    expect(result).toEqual({
      ok: true,
      consentRecordId: "consent-share-123",
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

  it("does not create Core consent for a revoked prepared envelope", async () => {
    const result = await authoriseSupportPlanShare({
      subjectUserId: "participant-1",
      actorUserId: "participant-1",
      now: NOW,
      envelope: envelope({
        status: "REVOKED",
        revokedAt: "2026-09-12T05:25:00.000Z",
      }),
    });

    expect(result).toEqual({ ok: false, issues: ["REVOKED"] });
    expect(grantConsentMock).not.toHaveBeenCalled();
  });

  it("does not create Core consent for an unverified external recipient", async () => {
    const result = await authoriseSupportPlanShare({
      subjectUserId: "participant-1",
      actorUserId: "participant-1",
      now: NOW,
      envelope: envelope({
        recipient: { kind: "external_service", label: "Typed service label" },
      }),
    });

    expect(result).toEqual({
      ok: false,
      issues: ["UNSUPPORTED_RECIPIENT"],
    });
    expect(grantConsentMock).not.toHaveBeenCalled();
  });

  it("strips participant-authored support-plan text from persistence input", async () => {
    await authoriseSupportPlanShare({
      subjectUserId: "participant-1",
      actorUserId: "participant-1",
      now: NOW,
      envelope: envelope({ purpose: "share_communication_access" }),
    });

    expect(JSON.stringify(grantConsentMock.mock.calls)).not.toContain(
      "SECRET SUPPORT PLAN DETAIL",
    );
    expect(JSON.stringify(grantConsentMock.mock.calls)).not.toContain(
      "SECRET AAC DETAIL",
    );
    expect(JSON.stringify(grantConsentMock.mock.calls)).not.toContain(
      "sections",
    );
  });
});
