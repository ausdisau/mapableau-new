import { describe, expect, it } from "vitest";

import type { AuthorityGrant, ProposedAction } from "@mapable/contracts";
import { decideProposedAction } from "@mapable/intelligence-kernel";

const NOW = new Date("2026-09-14T03:00:00.000Z");
const ACTION = "transport.rebook.prepare";

function makeAction(
  input: Record<string, unknown> = {},
  overrides: Partial<ProposedAction> = {},
): ProposedAction {
  return {
    id: "autonomy-test-action",
    capability: "transport.rebook.prepare",
    domain: "transport",
    purpose: "rebook participant-approved transport",
    participantId: "participant-1",
    operation: ACTION,
    input,
    evidence: [],
    uncertainty: [],
    reversibility: "reversible",
    autonomyLevel: 2,
    confirmationRequired: false,
    expiresAt: "2026-09-14T04:00:00.000Z",
    ...overrides,
  };
}

function makeAuthority(
  autonomyPolicy: Record<string, unknown>,
  overrides: Partial<AuthorityGrant> = {},
): AuthorityGrant {
  return {
    schemaVersion: "1.0",
    id: "authority-1",
    actorId: "participant-1",
    principalId: "participant-1",
    tenantId: "tenant-1",
    domain: "transport",
    permittedActions: [ACTION],
    autonomyCeiling: 2,
    constraints: { autonomyPolicy },
    jurisdiction: "AU",
    issuedAt: "2026-09-14T02:00:00.000Z",
    expiresAt: "2026-09-14T05:00:00.000Z",
    revokedAt: null,
    ...overrides,
  };
}

function standingPolicy(overrides: Record<string, unknown> = {}) {
  return {
    version: "1",
    defaultPosture: "PREPARE_THEN_CONFIRM",
    preparationClass: "ORDINARY",
    standingAuthority: {
      enabled: true,
      action: ACTION,
      purpose: "rebook participant-approved transport",
      providerRef: "provider-a",
      dataScopes: ["transport.booking"],
      maxAmountMinorUnits: 7500,
      currency: "AUD",
      maxScheduleShiftMinutes: 20,
      expiresAt: "2026-09-14T04:00:00.000Z",
    },
    ...overrides,
  };
}

function decide(action: ProposedAction, authority: AuthorityGrant) {
  return decideProposedAction({
    action,
    authority,
    capabilityEnabled: true,
    evidenceComplete: true,
    now: NOW,
  });
}

describe("participant autonomy policy v1", () => {
  it("requires participant confirmation before guarded preparation", () => {
    const authority = makeAuthority({
      version: "1",
      defaultPosture: "PREPARE_THEN_CONFIRM",
      preparationClass: "GUARDED",
    });

    expect(decide(makeAction(), authority)).toEqual(
      expect.objectContaining({
        decision: "REQUIRE_PARTICIPANT_CONFIRMATION",
        reasonCodes: expect.arrayContaining(["AUTONOMY_GUARDED_PREPARATION"]),
      }),
    );
  });

  it("allows ordinary preparation when a valid standing authority envelope still matches", () => {
    const authority = makeAuthority(standingPolicy());
    const action = makeAction({
      providerRef: "provider-a",
      dataScopes: ["transport.booking"],
      amountMinorUnits: 6500,
      currency: "AUD",
      scheduleShiftMinutes: 10,
    });

    expect(decide(action, authority)).toEqual(
      expect.objectContaining({ decision: "ALLOW_DRAFT" }),
    );
  });

  it("falls back to participant confirmation when standing authority has expired", () => {
    const authority = makeAuthority(
      standingPolicy({
        standingAuthority: {
          ...standingPolicy().standingAuthority,
          expiresAt: "2026-09-14T02:59:59.000Z",
        },
      }),
    );

    expect(decide(makeAction({ providerRef: "provider-a" }), authority)).toEqual(
      expect.objectContaining({
        decision: "REQUIRE_PARTICIPANT_CONFIRMATION",
        reasonCodes: expect.arrayContaining(["AUTONOMY_STANDING_AUTHORITY_EXPIRED"]),
      }),
    );
  });

  it.each([
    ["provider identity", { providerRef: "provider-b" }, "AUTONOMY_PROVIDER_CHANGED"],
    [
      "data scope",
      { providerRef: "provider-a", dataScopes: ["transport.booking", "health.summary"] },
      "AUTONOMY_DATA_SCOPE_CHANGED",
    ],
  ])("invalidates standing authority when %s changes", (_label, input, reasonCode) => {
    const authority = makeAuthority(standingPolicy());

    expect(decide(makeAction(input), authority)).toEqual(
      expect.objectContaining({
        decision: "REQUIRE_PARTICIPANT_CONFIRMATION",
        reasonCodes: expect.arrayContaining([reasonCode]),
      }),
    );
  });

  it("keeps a participant-approved amount and schedule change inside standing authority tolerances", () => {
    const authority = makeAuthority(standingPolicy());
    const action = makeAction({
      providerRef: "provider-a",
      dataScopes: ["transport.booking"],
      amountMinorUnits: 7500,
      currency: "AUD",
      scheduleShiftMinutes: 20,
    });

    expect(decide(action, authority).decision).toBe("ALLOW_DRAFT");
  });

  it.each([
    ["amount", { amountMinorUnits: 7501, currency: "AUD" }, "AUTONOMY_AMOUNT_TOLERANCE_EXCEEDED"],
    [
      "schedule",
      { amountMinorUnits: 6500, currency: "AUD", scheduleShiftMinutes: 21 },
      "AUTONOMY_SCHEDULE_TOLERANCE_EXCEEDED",
    ],
  ])("requires confirmation when %s leaves the participant-approved tolerance", (_label, change, reasonCode) => {
    const authority = makeAuthority(standingPolicy());
    const action = makeAction({
      providerRef: "provider-a",
      dataScopes: ["transport.booking"],
      ...change,
    });

    expect(decide(action, authority)).toEqual(
      expect.objectContaining({
        decision: "REQUIRE_PARTICIPANT_CONFIRMATION",
        reasonCodes: expect.arrayContaining([reasonCode]),
      }),
    );
  });

  it("routes prohibited AI authority to accountable human review", () => {
    const authority = makeAuthority({
      version: "1",
      defaultPosture: "PREPARE_THEN_CONFIRM",
      preparationClass: "PROHIBITED_AI_AUTHORITY",
    });

    expect(decide(makeAction(), authority)).toEqual(
      expect.objectContaining({
        decision: "REQUIRE_HUMAN_REVIEW",
        reasonCodes: expect.arrayContaining(["AUTONOMY_AI_AUTHORITY_PROHIBITED"]),
      }),
    );
  });

  it("never becomes more permissive when policy constraints tighten", () => {
    const rank = {
      REQUIRE_HUMAN_REVIEW: 0,
      REQUIRE_PARTICIPANT_CONFIRMATION: 1,
      ALLOW_DRAFT: 2,
    } as const;

    const permissive = decide(
      makeAction({
        providerRef: "provider-a",
        dataScopes: ["transport.booking"],
        amountMinorUnits: 6500,
        currency: "AUD",
        scheduleShiftMinutes: 10,
      }),
      makeAuthority(standingPolicy()),
    ).decision;

    const tightened = [
      decide(
        makeAction({ providerRef: "provider-b" }),
        makeAuthority(standingPolicy()),
      ).decision,
      decide(
        makeAction({ providerRef: "provider-a", amountMinorUnits: 8000, currency: "AUD" }),
        makeAuthority(standingPolicy()),
      ).decision,
      decide(
        makeAction(),
        makeAuthority({
          version: "1",
          defaultPosture: "PREPARE_THEN_CONFIRM",
          preparationClass: "GUARDED",
        }),
      ).decision,
      decide(
        makeAction(),
        makeAuthority({
          version: "1",
          defaultPosture: "PREPARE_THEN_CONFIRM",
          preparationClass: "PROHIBITED_AI_AUTHORITY",
        }),
      ).decision,
    ];

    expect(rank[permissive as keyof typeof rank]).toBe(2);
    for (const decision of tightened) {
      expect(rank[decision as keyof typeof rank]).toBeLessThanOrEqual(
        rank[permissive as keyof typeof rank],
      );
    }
  });
});
