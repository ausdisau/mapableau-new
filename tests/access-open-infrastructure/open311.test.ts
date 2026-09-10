import { afterEach, describe, expect, it } from "vitest";

import {
  __resetCivicDraftsForTests,
  confirmCivicSubmission,
  createCivicIssueDraft,
  applyExternalResolutionFeedback,
} from "@/lib/access/civic/draft";
import {
  submitOpen311ServiceRequest,
} from "@/lib/integrations/access/open311/adapter";

describe("open311 draft-first", () => {
  afterEach(() => {
    delete process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED;
    delete process.env.MAPABLE_OPEN311_ENABLED;
    __resetCivicDraftsForTests();
  });

  it("creates draft without submitting", () => {
    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_OPEN311_ENABLED = "true";

    const draft = createCivicIssueDraft({
      serviceCode: "sidewalk",
      description: "Broken kerb ramp",
      lat: -33.87,
      lng: 151.21,
      actorRef: "actor-1",
    });
    expect(draft.status).toBe("draft");
    expect(draft.confirmationToken).toBeTruthy();
  });

  it("refuses autonomous open311 submit", async () => {
    await expect(
      submitOpen311ServiceRequest(
        { service_code: "x", description: "test" },
        { explicitHumanConfirmation: false },
      ),
    ).rejects.toThrow(/human confirmation required/i);
  });

  it("requires human confirmation for civic submit", () => {
    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_OPEN311_ENABLED = "true";

    const draft = createCivicIssueDraft({
      serviceCode: "sidewalk",
      description: "Issue",
      actorRef: "actor-1",
    });
    const submitted = confirmCivicSubmission({
      draftId: draft.draftId,
      confirmationToken: draft.confirmationToken!,
      actorRef: "actor-1",
      humanConfirmed: true,
    });
    expect(submitted.status).toBe("submitted");
  });

  it("external resolved needs community verification", () => {
    process.env.MAPABLE_OPEN_INFRASTRUCTURE_ENABLED = "true";
    process.env.MAPABLE_OPEN311_ENABLED = "true";

    const draft = createCivicIssueDraft({
      serviceCode: "sidewalk",
      description: "Issue",
      actorRef: "actor-1",
    });
    const updated = applyExternalResolutionFeedback(draft.draftId, "ext-99");
    expect(updated.status).toBe("needs_community_verification");
  });
});
