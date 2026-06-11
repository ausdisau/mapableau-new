import { describe, expect, it } from "vitest";

import { hasPermission } from "@/lib/auth/permissions";
import {
  assertNoAutoSensitiveAction,
  buildAiMeta,
  shouldEscalateToHumanReview,
} from "@/lib/coordinate/ai/escalation";
import { draftCommunication } from "@/lib/coordinate/ai/communication-drafter";
import { getCoordinateAIEngine } from "@/lib/coordinate/ai/engine";
import {
  CoordinateAccessError,
  resolveParticipantScope,
  resolveRoleView,
} from "@/lib/coordinate/access-service";
import {
  COORDINATE_AUDIT_ACTIONS,
  COORDINATE_REASSURANCE,
  HUMAN_REVIEW_CONFIDENCE_THRESHOLD,
} from "@/lib/coordinate/types";

describe("MapAble Coordinate permissions", () => {
  it("grants participant coordinate self-service", () => {
    expect(hasPermission("participant", "coordinate:participant")).toBe(true);
    expect(hasPermission("participant", "coordinate:portal")).toBe(false);
  });

  it("grants family member participant portal access", () => {
    expect(hasPermission("family_member", "coordinate:participant")).toBe(true);
  });

  it("grants support coordinator portal, review, and audit", () => {
    expect(hasPermission("support_coordinator", "coordinate:portal")).toBe(true);
    expect(hasPermission("support_coordinator", "coordinate:review")).toBe(true);
    expect(hasPermission("support_coordinator", "coordinate:audit:read")).toBe(
      true,
    );
  });

  it("grants plan manager review but not portal", () => {
    expect(hasPermission("plan_manager", "coordinate:review")).toBe(true);
    expect(hasPermission("plan_manager", "coordinate:portal")).toBe(false);
  });

  it("denies provider coordinate access", () => {
    expect(hasPermission("provider_admin", "coordinate:portal")).toBe(false);
    expect(hasPermission("provider_admin", "coordinate:participant")).toBe(
      false,
    );
  });
});

describe("Coordinate access helpers", () => {
  it("resolves role views", () => {
    expect(resolveRoleView("participant")).toBe("participant");
    expect(resolveRoleView("support_coordinator")).toBe("coordinator");
    expect(resolveRoleView("mapable_admin")).toBe("admin");
  });

  it("requires participantId for coordinator scope", () => {
    expect(() =>
      resolveParticipantScope({
        actorId: "coord-1",
        actorRole: "support_coordinator",
      }),
    ).toThrow(CoordinateAccessError);
  });

  it("uses requested participant for coordinators", () => {
    expect(
      resolveParticipantScope({
        actorId: "coord-1",
        actorRole: "support_coordinator",
        requestedParticipantId: "p-1",
      }),
    ).toBe("p-1");
  });
});

describe("Coordinate AI guardrails", () => {
  it("caps confidence at 0.7", () => {
    const meta = buildAiMeta({ confidence: 0.95, reason: "test" });
    expect(meta.confidence).toBe(0.7);
  });

  it("escalates low confidence below threshold", () => {
    const result = shouldEscalateToHumanReview({ confidence: 0.5 });
    expect(result.escalate).toBe(true);
    expect(result.taskType).toBe("low_confidence");
    expect(HUMAN_REVIEW_CONFIDENCE_THRESHOLD).toBe(0.65);
  });

  it("escalates conflict of interest", () => {
    const result = shouldEscalateToHumanReview({
      confidence: 0.9,
      conflictDetected: true,
    });
    expect(result.escalate).toBe(true);
    expect(result.taskType).toBe("conflict");
  });

  it("does not escalate high confidence without flags", () => {
    const result = shouldEscalateToHumanReview({ confidence: 0.68 });
    expect(result.escalate).toBe(false);
  });

  it("blocks automatic sensitive actions", () => {
    expect(() => assertNoAutoSensitiveAction("send_message")).toThrow(
      /Human approval required/,
    );
    expect(() => assertNoAutoSensitiveAction("book_appointment")).toThrow();
    expect(() => assertNoAutoSensitiveAction("share_plan")).toThrow();
    expect(() => assertNoAutoSensitiveAction("draft_summary")).not.toThrow();
  });

  it("exposes rules engine max confidence", () => {
    expect(getCoordinateAIEngine().maxConfidence).toBe(0.7);
  });

  it("includes approval disclaimer in communication drafts", () => {
    const draft = draftCommunication({
      participantName: "Alex",
      topic: "community access",
      channel: "email",
    });
    expect(draft.body.toLowerCase()).toContain("draft");
    expect(draft.body.toLowerCase()).toContain("automatically");
    expect(draft.plainLanguageBody.toLowerCase()).toContain("approve");
  });
});

describe("Coordinate reassurance and audit actions", () => {
  it("keeps required confirmation copy in reassurance constant", () => {
    expect(COORDINATE_REASSURANCE.toLowerCase()).toContain("approve");
    expect(COORDINATE_REASSURANCE.toLowerCase()).not.toContain("automatic");
  });

  it("defines audit actions for approve paths", () => {
    expect(COORDINATE_AUDIT_ACTIONS.DRAFT_APPROVED).toBe(
      "coordinate.draft.approved",
    );
    expect(COORDINATE_AUDIT_ACTIONS.REVIEW_APPROVED).toBe(
      "coordinate.review.approved",
    );
    expect(COORDINATE_AUDIT_ACTIONS.PLAN_SUMMARY_APPROVED).toBe(
      "coordinate.plan.summary_approved",
    );
  });
});
