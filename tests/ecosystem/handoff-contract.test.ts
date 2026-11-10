import { describe, expect, it } from "vitest";

import { createReadOnlyHandoffDraft } from "@/lib/ecosystem/handoff-contract";

describe("MapAble One review-only service handoff", () => {
  it("returns an explicitly non-executing cross-service draft", () => {
    const result = createReadOnlyHandoffDraft({
      sourceService: "challenges",
      destinationService: "transport",
      intent: "prepare-request",
      sourceRecord: {
        sourceType: "challenge",
        recordId: "example:1",
        provenance: "observed-unverified",
      },
    });
    expect(result.acceptedForPreview).toBe(true);
    if (!result.acceptedForPreview) return;
    expect(result.draft).toMatchObject({
      contractVersion: "1",
      sourceService: "challenges",
      destinationService: "transport",
      participantConfirmationRequired: true,
      sharedParticipantData: false,
      externalActionPermitted: false,
      bookingPermitted: false,
      paymentPermitted: false,
      auditEventNeededBeforeActivation: true,
    });
  });

  it("does not allow same-service or malformed record handoffs", () => {
    expect(
      createReadOnlyHandoffDraft({
        sourceService: "care",
        destinationService: "care",
        intent: "explore",
      }).acceptedForPreview,
    ).toBe(false);
    expect(
      createReadOnlyHandoffDraft({
        sourceService: "challenges",
        destinationService: "transport",
        intent: "explore",
        sourceRecord: {
          sourceType: "challenge",
          recordId: "../private-data",
          provenance: "unknown",
        },
      }).acceptedForPreview,
    ).toBe(false);
  });

  it("preserves provenance distinctions rather than upgrading synthetic data", () => {
    const result = createReadOnlyHandoffDraft({
      sourceService: "challenges",
      destinationService: "day",
      intent: "compare",
      sourceRecord: {
        sourceType: "observation",
        recordId: "demo:01",
        provenance: "synthetic",
      },
    });
    expect(result.acceptedForPreview).toBe(true);
    if (!result.acceptedForPreview) return;
    expect(result.draft.sourceRecord?.provenance).toBe("synthetic");
  });
});
