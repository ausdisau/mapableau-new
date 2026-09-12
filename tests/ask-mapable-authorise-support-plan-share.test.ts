import { beforeEach, describe, expect, it, vi } from "vitest";

const { grantConsentMock } = vi.hoisted(() => ({
  grantConsentMock: vi.fn(),
}));

vi.mock("@/lib/consent/consent-service", () => ({
  grantConsent: grantConsentMock,
}));

import { authoriseSupportPlanShare } from "@/lib/ask-mapable/authorise-support-plan-share";

const NOW = new Date("2026-09-12T05:30:00.000Z");

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
      envelope: {
        envelopeId: "support-plan-share-123",
        recipientKind: "mapable_human",
        purpose: "ask_for_support",
        selectedFields: ["thingsICanTry", "communicationAccess"],
        expiresAt: "2026-09-12T06:30:00.000Z",
      },
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

  it("does not create Core consent for an unverified external recipient", async () => {
    const result = await authoriseSupportPlanShare({
      subjectUserId: "participant-1",
      actorUserId: "participant-1",
      now: NOW,
      envelope: {
        envelopeId: "support-plan-share-123",
        recipientKind: "external_service",
        purpose: "ask_for_support",
        selectedFields: ["communicationAccess"],
        expiresAt: "2026-09-12T06:30:00.000Z",
      },
    });

    expect(result).toEqual({
      ok: false,
      issues: ["UNSUPPORTED_RECIPIENT"],
    });
    expect(grantConsentMock).not.toHaveBeenCalled();
  });

  it("does not accept participant-authored support-plan text as persistence input", async () => {
    const envelope = {
      envelopeId: "support-plan-share-123",
      recipientKind: "mapable_human",
      purpose: "share_communication_access",
      selectedFields: ["communicationAccess"],
      expiresAt: "2026-09-12T06:30:00.000Z",
      sections: [{ label: "How I communicate", value: "SECRET AAC DETAIL" }],
    };

    await authoriseSupportPlanShare({
      subjectUserId: "participant-1",
      actorUserId: "participant-1",
      now: NOW,
      envelope,
    });

    expect(JSON.stringify(grantConsentMock.mock.calls)).not.toContain(
      "SECRET AAC DETAIL",
    );
    expect(JSON.stringify(grantConsentMock.mock.calls)).not.toContain(
      "sections",
    );
  });
});
