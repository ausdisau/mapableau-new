import { describe, expect, it } from "vitest";

import { projectDecisionPassport } from "@/lib/ai/platform/decision-passport/project";
import type { NdisProviderSearchRow } from "@/lib/ingestion/ndis-providers-search";

const provider: NdisProviderSearchRow = {
  source_id: "src-1",
  provider_name: "River Supports",
  suburb: "Newcastle",
  state: "NSW",
  postcode: "2300",
  latitude: null,
  longitude: null,
  phone: null,
  email: null,
  website: null,
  services: ["Assistance with Daily Life"],
  registration_groups: [],
  updated_at: new Date(),
};

describe("Decision Passport projection", () => {
  it("exposes correction, opt-out and human-support controls without chain-of-thought", () => {
    const passport = projectDecisionPassport({
      tenantId: "tenant-a",
      participantId: "participant-1",
      actorUserId: "participant-1",
      capabilityKey: "navigator.provider_search_pilot",
      requestedSummary: "Wheelchair accessible personal care in Newcastle",
      preferencesUsed: ["access:wheelchair"],
      constraintsUsed: ["state:NSW", "hard_access:wheelchair"],
      ranked: [
        {
          provider,
          score: 0.8,
          factors: [
            {
              key: "accessibilityEvidence",
              contribution: 0.2,
              note: "Access keyword hits: 1",
            },
          ],
          missingData: ["live_availability"],
        },
      ],
      hardConstraints: {
        eligible: [provider],
        rejected: [],
        noMatch: false,
        constraintsNotRelaxed: true,
      },
      aiUsed: false,
      proposedActionType: "create_care_request_draft",
      requiredApproverRole: "participant",
    });

    expect(passport.controls.canContinueNonAi).toBe(true);
    expect(passport.controls.canWithdrawConsent).toBe(true);
    expect(passport.controls.canRequestHumanReview).toBe(true);
    expect(passport.missingOrStaleInformation).toContain("live_availability");
    expect(passport.aiInvolvement.commentaryOptional).toBe(true);
    expect(JSON.stringify(passport)).not.toMatch(/chain.of.thought/i);
  });

  it("discloses no-match without relaxing constraints", () => {
    const passport = projectDecisionPassport({
      participantId: "participant-1",
      actorUserId: "participant-1",
      capabilityKey: "navigator.provider_search_pilot",
      requestedSummary: "Auslan support worker",
      preferencesUsed: [],
      constraintsUsed: ["hard_access:auslan"],
      ranked: [],
      hardConstraints: {
        eligible: [],
        rejected: [{ sourceId: "x", reasons: ["access_or_communication_requirement"] }],
        noMatch: true,
        constraintsNotRelaxed: true,
      },
      aiUsed: false,
      proposedActionType: "open_human_escalation",
      requiredApproverRole: "participant",
    });

    expect(passport.suggestedProviders).toHaveLength(0);
    expect(passport.missingOrStaleInformation).toContain(
      "no_eligible_providers_under_hard_constraints",
    );
    expect(passport.proposedNextAction.actionType).toBe("open_human_escalation");
  });
});
