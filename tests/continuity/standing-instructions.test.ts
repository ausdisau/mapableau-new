import { describe, expect, it } from "vitest";

import {
  AURA_PROHIBITED_ACTION_SLUGS,
  assertInstructionAuthoredByHuman,
  containsProhibitedAction,
  evaluateStandingInstruction,
} from "@/lib/continuity/profile/standing-instruction-service";

function baseInstruction(overrides: Partial<any> = {}) {
  return {
    id: "inst-1",
    profileId: "prof-1",
    scope: "care",
    status: "active",
    title: "Reschedule care preference",
    instructionsJson: {
      allowedActionSlugs: ["continuity.draft_recovery_plan"],
      requiresParticipantConfirmationAtExecution: true,
    },
    effectiveFrom: new Date("2026-01-01T00:00:00.000Z"),
    effectiveTo: null,
    createdById: "u-1",
    approvedById: null,
    approvedAt: null,
    revokedById: null,
    revokedAt: null,
    lastCheckedAt: null,
    createdAt: new Date(),
    updatedAt: new Date(),
    ...overrides,
  } as any;
}

describe("standing instruction evaluation", () => {
  it("authorises an in-allowlist action for an active instruction", () => {
    const r = evaluateStandingInstruction({
      instruction: baseInstruction(),
      actionSlug: "continuity.draft_recovery_plan",
      now: new Date("2026-06-01T00:00:00.000Z"),
    });
    expect(r.authorised).toBe(true);
  });

  it("refuses when instruction is not active", () => {
    const r = evaluateStandingInstruction({
      instruction: baseInstruction({ status: "draft" }),
      actionSlug: "continuity.draft_recovery_plan",
    });
    expect(r.authorised).toBe(false);
    expect(r.reason).toBe("not_active");
  });

  it("refuses when instruction has expired (effectiveTo in the past)", () => {
    const r = evaluateStandingInstruction({
      instruction: baseInstruction({ effectiveTo: new Date("2020-01-01") }),
      actionSlug: "continuity.draft_recovery_plan",
      now: new Date("2026-06-01"),
    });
    expect(r.authorised).toBe(false);
    expect(r.reason).toBe("expired");
  });

  it("refuses actions not in the allow-list", () => {
    const r = evaluateStandingInstruction({
      instruction: baseInstruction(),
      actionSlug: "continuity.escalate_to_human",
      now: new Date("2026-06-01"),
    });
    expect(r.authorised).toBe(false);
    expect(r.reason).toBe("not_in_allowlist");
  });

  it("refuses aura-prohibited actions even if listed in allow-list", () => {
    const inst = baseInstruction({
      instructionsJson: {
        allowedActionSlugs: ["billing.approve_invoice"],
      },
    });
    const r = evaluateStandingInstruction({
      instruction: inst,
      actionSlug: "billing.approve_invoice",
      now: new Date("2026-06-01"),
    });
    expect(r.authorised).toBe(false);
    expect(r.reason).toMatch(/aura_prohibited/);
  });

  it("refuses emergency dispatch even if allow-listed", () => {
    const inst = baseInstruction({
      instructionsJson: { allowedActionSlugs: ["emergency.contact_000"] },
    });
    const r = evaluateStandingInstruction({
      instruction: inst,
      actionSlug: "emergency.contact_000",
    });
    expect(r.authorised).toBe(false);
    expect(r.reason).toMatch(/aura_prohibited/);
  });

  it("participant profile prohibition wins over allow-list", () => {
    const inst = baseInstruction();
    const r = evaluateStandingInstruction({
      instruction: inst,
      actionSlug: "continuity.draft_recovery_plan",
      profile: {
        prohibitedActionsJson: ["continuity.draft_recovery_plan"],
      } as any,
      now: new Date("2026-06-01"),
    });
    expect(r.authorised).toBe(false);
    expect(r.reason).toBe("participant_prohibited");
  });

  it("assertInstructionAuthoredByHuman refuses non-human sources", () => {
    expect(() => assertInstructionAuthoredByHuman("participant_self")).not.toThrow();
    // @ts-expect-error deliberate wrong value
    expect(() => assertInstructionAuthoredByHuman("system_suggested")).toThrow();
  });

  it("containsProhibitedAction detects AURA prohibitions", () => {
    expect(containsProhibitedAction(["billing.approve_invoice"])).toBe("billing.approve_invoice");
    expect(containsProhibitedAction(["continuity.draft_recovery_plan"])).toBeNull();
  });

  it("AURA_PROHIBITED_ACTION_SLUGS includes emergency and financial", () => {
    expect(AURA_PROHIBITED_ACTION_SLUGS.has("emergency.contact_000")).toBe(true);
    expect(AURA_PROHIBITED_ACTION_SLUGS.has("billing.approve_invoice")).toBe(true);
  });
});
