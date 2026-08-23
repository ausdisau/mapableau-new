import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => undefined),
}));

vi.mock("@/lib/consent/consent-receipt-service", () => ({
  createConsentReceipt: vi.fn(async () => ({ id: "receipt-1" })),
}));

vi.mock("@/lib/authority/participant-authority-service", () => ({
  hasParticipantAuthority: vi.fn(async () => false),
}));

import type { NavigatorProviderSearchTurnInput } from "@/lib/ai/navigator/orchestrator";

const runNavigatorMock = vi.hoisted(() =>
  vi.fn(async (_input: NavigatorProviderSearchTurnInput) => ({
    status: "matched",
    interpretation: { modelAssisted: false, awaitingConfirmation: false },
    match: { status: "eligible_shortlist", shortlist: [] },
    draftEnvelopeId: null,
    transferEnvelopeId: null,
    passportId: null,
  })),
);

vi.mock("@/lib/ai/navigator/orchestrator", () => ({
  runNavigatorProviderSearchTurn: runNavigatorMock,
}));

vi.mock("@/lib/ai/navigator/gates", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/ai/navigator/gates")>();
  return {
    ...actual,
    assertNavigatorCapability: vi.fn(async () => ({
      allowed: true,
      capability: { toolAllowlist: ["ndis_provider_hard_filter"] },
    })),
  };
});

vi.mock("@/lib/prisma", () => ({
  prisma: {
    consentRecord: {
      findMany: vi.fn(async () => [
        {
          id: "consent-1",
          status: "active",
          purpose: "navigator.provider_search",
          scope: "profile_read",
          dataScope: ["*"],
          sourceAction: "match",
          createdAt: new Date(),
          expiryDate: null,
        },
      ]),
    },
  },
}));

import {
  ALL_AGENTS_SDK_TOOL_NAMES,
  buildDefaultRunContext,
  executeAccessProviderSearchTool,
} from "@/lib/ai/platform/agents-sdk";

describe("Agents SDK Navigator bridge", () => {
  beforeEach(() => {
    process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED = "true";
    process.env.MAPABLE_NAVIGATOR_PILOT_MATCHING = "true";
    runNavigatorMock.mockClear();
  });

  afterEach(() => {
    delete process.env.MAPABLE_NAVIGATOR_AGENTS_SDK_ENABLED;
    delete process.env.MAPABLE_NAVIGATOR_PILOT_ENABLED;
    delete process.env.MAPABLE_NAVIGATOR_PILOT_MATCHING;
  });

  it("access_provider_search delegates to runNavigatorProviderSearchTurn", async () => {
    const ctx = buildDefaultRunContext({
      tenantId: "t1",
      participantId: "p1",
      actorUserId: "p1",
      toolAllowlist: [...ALL_AGENTS_SDK_TOOL_NAMES],
    });

    await executeAccessProviderSearchTool(ctx, {
      hardConstraints: {
        requiredServices: [],
        exclusions: [],
        communicationRequirements: [],
        accessibilityRequirements: [],
        credentialRequirements: [],
        nonNegotiableKeys: [],
      },
      interpretationConfirmed: true,
      goalText: "occupational therapy near me",
    });

    expect(runNavigatorMock).toHaveBeenCalledTimes(1);
    const firstCall = runNavigatorMock.mock.calls[0]![0]!;
    expect(firstCall.tenantId).toBe("t1");
    expect(firstCall.goalText).toBe("occupational therapy near me");
  });
});
