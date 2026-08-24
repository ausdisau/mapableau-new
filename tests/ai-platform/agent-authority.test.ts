import { describe, expect, it } from "vitest";

import {
  assertParticipantApprovalBinding,
  authorityCeilingToCareOsDisplayLabel,
  compareAuthorityCeiling,
  minAuthority,
  requireMapAbleAgent,
} from "@/lib/ai/platform/agents";
import type { ProposalApprovalBinding } from "@/lib/ai/platform/human-review/contracts";

describe("MapAble agent authority", () => {
  it("maps AuthorityCeiling to CareOS display labels only", () => {
    expect(authorityCeilingToCareOsDisplayLabel("READ_ONLY_EXPLAIN")).toBe(
      "L0_INFORMATION"
    );
    expect(authorityCeilingToCareOsDisplayLabel("DRAFT_ONLY")).toBe("L1_DRAFT");
    expect(
      authorityCeilingToCareOsDisplayLabel("SUGGEST_WITH_HUMAN_REVIEW")
    ).toBe("L2_RECOMMEND");
    expect(
      authorityCeilingToCareOsDisplayLabel("SUGGEST_WITH_PARTICIPANT_APPROVAL")
    ).toBe("L2_RECOMMEND");
    expect(
      authorityCeilingToCareOsDisplayLabel("DETERMINISTIC_EXECUTE_VIA_SERVICE")
    ).toBe("L3_CONFIRMED_ACTION");
    expect(
      authorityCeilingToCareOsDisplayLabel("NO_OPERATIONAL_AUTHORITY")
    ).toBe("PROHIBITED");
  });

  it("computes minAuthority toward the stricter ceiling", () => {
    expect(
      minAuthority(
        "DETERMINISTIC_EXECUTE_VIA_SERVICE",
        "READ_ONLY_EXPLAIN",
        "DRAFT_ONLY"
      )
    ).toBe("READ_ONLY_EXPLAIN");
    expect(
      compareAuthorityCeiling("DRAFT_ONLY", "READ_ONLY_EXPLAIN")
    ).toBeGreaterThan(0);
  });

  it("prevents participant authority from inferring consent", () => {
    const agent = requireMapAbleAgent("participant_authority");
    expect(agent.authorityCeiling).toBe("NO_OPERATIONAL_AUTHORITY");
    expect(agent.prohibitedActions).toEqual(
      expect.arrayContaining([
        "infer_consent_from_behaviour",
        "infer_capacity_from_communication_style",
        "alter_consent",
      ])
    );
  });

  it("prevents support agent from assigning workers", () => {
    const agent = requireMapAbleAgent("support_participation");
    expect(agent.prohibitedActions).toContain("assign_support_worker");
    expect(agent.prohibitedActions).toContain("accept_service_agreement");
  });

  it("prevents access agent from confirming transport", () => {
    const agent = requireMapAbleAgent("access_mobility");
    expect(agent.prohibitedActions).toContain("confirm_transport");
  });

  it("prevents finance agent from approving or paying invoices", () => {
    const agent = requireMapAbleAgent("finance_administration");
    expect(agent.prohibitedActions).toEqual(
      expect.arrayContaining([
        "approve_ndis_claim",
        "approve_or_pay_invoice",
        "alter_funding_route",
      ])
    );
  });

  it("requires valid participant approval binding for matching capabilities", () => {
    const incomplete = assertParticipantApprovalBinding({
      capabilityKey: "matching.care_rules",
      binding: null,
    });
    expect(incomplete.ok).toBe(false);

    const binding: ProposalApprovalBinding = {
      proposalHash: "abc",
      actorId: "participant-1",
      actorAuthority: "participant",
      purpose: "accept_match_suggestion",
      timestamp: new Date().toISOString(),
      expiresAt: null,
      dataDisclosed: ["match_rank"],
      proposedAction: "accept_ai_match_overlay",
      revision: 1,
    };
    const complete = assertParticipantApprovalBinding({
      capabilityKey: "matching.care_rules",
      binding,
    });
    expect(complete.ok).toBe(true);
  });

  it("keeps mission orchestrator below execute authority", () => {
    const orch = requireMapAbleAgent("mission_orchestrator");
    expect(
      compareAuthorityCeiling(
        orch.authorityCeiling,
        "DETERMINISTIC_EXECUTE_VIA_SERVICE"
      )
    ).toBeLessThan(0);
  });
});
