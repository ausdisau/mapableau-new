import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => {
  const state: {
    candidate: null | {
      id: string;
      aiMatchRunId: string;
      status: string;
      aiMatchRun: { careRequestId: string | null; id: string; status: string };
    };
    updateArgs?: unknown;
    runUpdateArgs?: unknown;
    fairness: Array<{
      fairnessCheck: { aiMatchRunId: string };
      decision: string;
      createdAt: Date;
    }>;
    careRequest: null | {
      id: string;
      assignedOrganisationId: string | null;
      createdById: string | null;
      participantId: string;
    };
  } = {
    candidate: null,
    fairness: [],
    careRequest: null,
  };
  const prisma = {
    __state: state,
    aiMatchCandidate: {
      findUnique: vi.fn(async () => state.candidate),
      update: vi.fn(async ({ where, data }: never) => {
        state.updateArgs = { where, data };
        if (state.candidate) state.candidate.status = "accepted";
        return { ...state.candidate };
      }),
    },
    aiMatchRun: {
      update: vi.fn(async ({ where, data }: never) => {
        state.runUpdateArgs = { where, data };
        return { id: "run_1" };
      }),
    },
    fairnessReview: {
      findFirst: vi.fn(async ({ where }: never) => {
        const w = where as {
          decision?: string;
          fairnessCheck: { aiMatchRunId: string };
        };
        return (
          state.fairness.find(
            (r) =>
              r.fairnessCheck.aiMatchRunId === w.fairnessCheck.aiMatchRunId &&
              (!w.decision || r.decision === w.decision)
          ) ?? null
        );
      }),
    },
    careRequest: {
      findUnique: vi.fn(async () => state.careRequest),
    },
    $transaction: vi.fn(async (ops: Promise<unknown>[]) => {
      return Promise.all(ops);
    }),
  };
  return { prisma };
});

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn(async () => ({ id: "ae_1" })),
}));

vi.mock("@/lib/config/phase5", () => ({
  phase5Config: {
    aiMatchingEnabled: true,
    aiMatchingRequireHumanReview: true,
    fairnessChecksEnabled: true,
  },
}));

import { prisma } from "@/lib/prisma";
import {
  acceptAiCandidate,
  AiMatchAcceptError,
} from "@/lib/ai-matching/ai-match-service";

const testState = (prisma as unknown as { __state: {
  candidate: null | {
    id: string;
    aiMatchRunId: string;
    status: string;
    aiMatchRun: { careRequestId: string | null; id: string; status: string };
  };
  fairness: Array<{
    fairnessCheck: { aiMatchRunId: string };
    decision: string;
    createdAt: Date;
  }>;
  careRequest: null | {
    id: string;
    assignedOrganisationId: string | null;
    createdById: string | null;
    participantId: string;
  };
} }).__state;

beforeEach(() => {
  testState.candidate = {
    id: "cand_1",
    aiMatchRunId: "run_1",
    status: "generated",
    aiMatchRun: { id: "run_1", careRequestId: "cr_1", status: "generated" },
  };
  testState.fairness = [];
  testState.careRequest = {
    id: "cr_1",
    assignedOrganisationId: "org_a",
    createdById: "u_admin",
    participantId: "u_participant",
  };
});

describe("acceptAiCandidate", () => {
  it("throws NOT_FOUND when candidate missing", async () => {
    testState.candidate = null;
    await expect(acceptAiCandidate("cand_x", "u1")).rejects.toBeInstanceOf(
      AiMatchAcceptError
    );
  });

  it("throws FAIRNESS_REVIEW_REQUIRED when no approved review exists", async () => {
    testState.fairness = [
      {
        fairnessCheck: { aiMatchRunId: "run_1" },
        decision: "needs_more_review",
        createdAt: new Date(),
      },
    ];
    await expect(acceptAiCandidate("cand_1", "u1")).rejects.toThrow(
      /FAIRNESS_REVIEW_REQUIRED/
    );
  });

  it("leaves candidate unchanged when fairness review is missing", async () => {
    await expect(acceptAiCandidate("cand_1", "u1")).rejects.toThrow(
      /FAIRNESS_REVIEW_REQUIRED/
    );
    expect(testState.candidate?.status).toBe("generated");
  });

  it("blocks tenant mismatch when actorOrganisationId is different", async () => {
    testState.fairness = [
      {
        fairnessCheck: { aiMatchRunId: "run_1" },
        decision: "approved",
        createdAt: new Date(),
      },
    ];
    await expect(
      acceptAiCandidate("cand_1", "u1", { actorOrganisationId: "org_b" })
    ).rejects.toMatchObject({ code: "TENANT_MISMATCH" });
    expect(testState.candidate?.status).toBe("generated");
  });

  it("accepts when approved fairness review exists and tenant matches", async () => {
    testState.fairness = [
      {
        fairnessCheck: { aiMatchRunId: "run_1" },
        decision: "approved",
        createdAt: new Date(),
      },
    ];
    const result = await acceptAiCandidate("cand_1", "u1", {
      actorOrganisationId: "org_a",
    });
    expect(result).toBeDefined();
    expect(testState.candidate?.status).toBe("accepted");
  });

  it("returns existing candidate if already accepted (idempotent)", async () => {
    testState.candidate = {
      id: "cand_1",
      aiMatchRunId: "run_1",
      status: "accepted",
      aiMatchRun: { id: "run_1", careRequestId: "cr_1", status: "accepted" },
    };
    const result = await acceptAiCandidate("cand_1", "u1");
    expect(result).toBeDefined();
  });
});
