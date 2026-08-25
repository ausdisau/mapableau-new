import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  assignHumanOpsReview,
  buildOperatorContextFromRole,
  clearHumanOpsAudit,
  clearHumanOpsQueue,
  enqueueHumanOpsReview,
  formatReviewForParticipant,
  ingestMapAbleHumanReviewItem,
  listHumanOpsAuditForReview,
  rejectModelGeneratedSafeguardingDecision,
  requestHumanOpsInformation,
  resolveHumanOpsReview,
  HUMAN_OPS_A11Y,
} from "@/lib/ai/platform/human-operations";

function safeguardingOfficer(tenantId = "tenant-a") {
  return buildOperatorContextFromRole({
    operatorId: "sg-officer",
    primaryRole: "mapable_admin",
    tenantIds: [tenantId],
  });
}

describe("Human Ops lifecycle + safeguarding", () => {
  beforeEach(() => {
    clearHumanOpsQueue();
    clearHumanOpsAudit();
    process.env.MAPABLE_HUMAN_OPERATIONS_CONSOLE_ENABLED = "true";
  });
  afterEach(() => {
    clearHumanOpsQueue();
    clearHumanOpsAudit();
    delete process.env.MAPABLE_HUMAN_OPERATIONS_CONSOLE_ENABLED;
  });

  it("preserves evidence refs through ingest and resolve", () => {
    const item = ingestMapAbleHumanReviewItem({
      item: {
        id: "hr-1",
        category: "care_coordination",
        reason: "Needs coordinator",
        urgency: "routine",
        evidenceRefs: ["note:1", "plan:2"],
        continuationMessage: "A human will continue.",
        aiMayDecideReportability: false,
        aiMaySubstantiateAllegation: false,
      },
      participantId: "p1",
      tenantId: "tenant-a",
      missionId: "m1",
      requestedBy: "mission",
      source: "mission_runtime",
    });
    expect(item.evidenceRefs).toEqual(["note:1", "plan:2"]);

    const op = buildOperatorContextFromRole({
      operatorId: "op-1",
      primaryRole: "mapable_admin",
      tenantIds: ["tenant-a"],
    });
    const resolved = resolveHumanOpsReview({
      reviewId: item.reviewId,
      operator: op,
      resolution: "prepare_action_proposal",
      resolutionReason: "Prepared care request proposal for participant",
      evidenceRefsUsed: ["note:1"],
      decidedUnderAuthority: "care:manage:any",
      participantApprovalBypassed: false,
      nextStepsPrepared: ["action-proposal:draft-1"],
    });
    expect(resolved.ok).toBe(true);
    if (!resolved.ok) return;
    expect(resolved.item.preparedNextStepIds).toContain("action-proposal:draft-1");
    expect(resolved.item.resolution?.participantApprovalBypassed).toBe(false);
  });

  it("rejects unknown evidence refs", () => {
    const item = enqueueHumanOpsReview({
      participantId: "p1",
      tenantId: "tenant-a",
      category: "general_coordination",
      reasonCodes: ["x"],
      evidenceRefs: ["a"],
      requestedBy: "sys",
      source: "manual_intake",
      participantFacingReason: "Needs review.",
    });
    const op = buildOperatorContextFromRole({
      operatorId: "op-1",
      primaryRole: "mapable_admin",
      tenantIds: ["tenant-a"],
    });
    const result = resolveHumanOpsReview({
      reviewId: item.reviewId,
      operator: op,
      resolution: "continue_workflow",
      resolutionReason: "ok",
      evidenceRefsUsed: ["not-present"],
      decidedUnderAuthority: "support:manage:any",
      participantApprovalBypassed: false,
    });
    expect(result.ok).toBe(false);
    if (result.ok) return;
    expect(result.reason).toBe("UNKNOWN_EVIDENCE_REF");
  });

  it("human-only safeguarding — model-generated final decisions forbidden", () => {
    expect(
      rejectModelGeneratedSafeguardingDecision({
        category: "safeguarding",
        generatedByModel: true,
        resolution: "route_to_specialist_human",
      }).ok,
    ).toBe(false);

    const item = enqueueHumanOpsReview({
      participantId: "p1",
      tenantId: "tenant-a",
      category: "safeguarding",
      reasonCodes: ["allegation cue"],
      evidenceRefs: ["note:sg"],
      requestedBy: "gate",
      source: "safeguarding_gate",
      participantFacingReason: "Human safeguarding review required.",
    });
    expect(item.aiMayDecideReportability).toBe(false);
    expect(item.aiMaySubstantiateAllegation).toBe(false);
    expect(item.aiMayAuthoriseRestrictivePractice).toBe(false);
    expect(item.aiMayCloseIncidentOrComplaint).toBe(false);

    const op = safeguardingOfficer();
    const forbidden = resolveHumanOpsReview({
      reviewId: item.reviewId,
      operator: op,
      resolution: "close_coordination_only",
      resolutionReason: "attempt close",
      decidedUnderAuthority: "safeguards:manage",
      participantApprovalBypassed: false,
      generatedByModel: false,
    });
    // close_coordination_only is not in allowed safeguarding set
    expect(forbidden.ok).toBe(false);

    const allowed = resolveHumanOpsReview({
      reviewId: item.reviewId,
      operator: op,
      resolution: "route_to_specialist_human",
      resolutionReason: "Routed to safeguarding officer",
      decidedUnderAuthority: "safeguards:manage",
      participantApprovalBypassed: false,
      generatedByModel: false,
    });
    expect(allowed.ok).toBe(true);
  });

  it("operator cannot bypass participant approval", () => {
    const item = enqueueHumanOpsReview({
      participantId: "p1",
      tenantId: "tenant-a",
      category: "care_coordination",
      reasonCodes: ["need"],
      requestedBy: "sys",
      source: "mission_runtime",
      participantFacingReason: "Needs coordination.",
    });
    const op = buildOperatorContextFromRole({
      operatorId: "op-1",
      primaryRole: "mapable_admin",
      tenantIds: ["tenant-a"],
    });
    const result = resolveHumanOpsReview({
      reviewId: item.reviewId,
      operator: op,
      resolution: "prepare_action_proposal",
      resolutionReason: "Prepared only",
      decidedUnderAuthority: "care:manage:any",
      participantApprovalBypassed: false,
      nextStepsPrepared: ["proposal:1"],
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.item.resolution?.participantApprovalBypassed).toBe(false);
  });

  it("records audit trail across assign → request info → resolve", () => {
    const item = enqueueHumanOpsReview({
      participantId: "p1",
      tenantId: "tenant-a",
      category: "general_coordination",
      reasonCodes: ["need"],
      requestedBy: "sys",
      source: "manual_intake",
      participantFacingReason: "Needs help.",
    });
    const op = buildOperatorContextFromRole({
      operatorId: "op-1",
      primaryRole: "mapable_admin",
      tenantIds: ["tenant-a"],
    });
    expect(assignHumanOpsReview({
      reviewId: item.reviewId,
      operator: op,
      assigneeId: "op-1",
    }).ok).toBe(true);
    expect(requestHumanOpsInformation({
      reviewId: item.reviewId,
      operator: op,
      informationRequested: "Please confirm preferred time window",
    }).ok).toBe(true);
    expect(resolveHumanOpsReview({
      reviewId: item.reviewId,
      operator: op,
      resolution: "continue_workflow",
      resolutionReason: "Info received; continue",
      decidedUnderAuthority: "support:manage:any",
      participantApprovalBypassed: false,
    }).ok).toBe(true);

    const audit = listHumanOpsAuditForReview(item.reviewId);
    expect(audit.map((a) => a.action)).toEqual(
      expect.arrayContaining([
        "enqueued",
        "assigned",
        "request_information",
        "resolved",
      ]),
    );
  });

  it("participant visibility excludes internal investigative detail", () => {
    const item = enqueueHumanOpsReview({
      participantId: "p1",
      tenantId: "tenant-a",
      category: "safeguarding",
      reasonCodes: ["internal investigative code XYZ"],
      evidenceRefs: ["sensitive-note"],
      requestedBy: "gate",
      source: "safeguarding_gate",
      participantFacingReason: "An authorised human will continue this workflow.",
    });
    item.internalNotes.push("CONFIDENTIAL investigator note");
    const view = formatReviewForParticipant(item);
    expect(view.protectedInternalDetailExcluded).toBe(true);
    expect(JSON.stringify(view)).not.toContain("CONFIDENTIAL");
    expect(JSON.stringify(view)).not.toContain("investigative code");
    expect(view.handlingTeam).toMatch(/Safeguarding/i);
    expect(view.informationUsed[0]).toMatch(/held securely/i);
  });

  it("documents accessible keyboard workflow notes", () => {
    expect(HUMAN_OPS_A11Y.keyboardHints.length).toBeGreaterThanOrEqual(3);
    expect(HUMAN_OPS_A11Y.queueTableCaption).toMatch(/Tab|Enter/i);
    expect(HUMAN_OPS_A11Y.resolveFormLabel).toMatch(/does not execute/i);
  });
});
