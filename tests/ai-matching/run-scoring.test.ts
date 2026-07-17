import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/prisma", () => {
  const state: {
    modelVersion: null | { id: string; provider: string; active: boolean };
    careRequest: {
      id: string;
      assignedOrganisationId: string | null;
      participantId: string;
    } | null;
    matchCandidates: Array<{
      id: string;
      score: number;
      scoreExplanation: string;
      candidateOrganisationId: string | null;
    }>;
    aiMatchRun: null | { id: string; careRequestId: string; status: string };
    createdAiCandidates: Array<{ aiScore: number; combinedScore: number }>;
    createdExplanations: Array<{ audience: string; technicalDetail?: string }>;
  } = {
    modelVersion: null,
    careRequest: {
      id: "cr_1",
      assignedOrganisationId: "org_a",
      participantId: "u_participant",
    },
    matchCandidates: [
      {
        id: "mc_1",
        score: 0.9,
        scoreExplanation: "High similarity.",
        candidateOrganisationId: "org_a",
      },
    ],
    aiMatchRun: null,
    createdAiCandidates: [],
    createdExplanations: [],
  };
  const prisma = {
    __state: state,
    careRequest: {
      findUnique: vi.fn(async () => state.careRequest),
    },
    matchingModelVersion: {
      findFirst: vi.fn(async () => state.modelVersion),
    },
    aiMatchRun: {
      create: vi.fn(async ({ data }: never) => {
        const d = data as { careRequestId: string; status: string };
        state.aiMatchRun = {
          id: "run_1",
          careRequestId: d.careRequestId,
          status: d.status,
        };
        return state.aiMatchRun;
      }),
      update: vi.fn(async () => ({})),
    },
    matchCandidate: {
      findMany: vi.fn(async () => state.matchCandidates),
    },
    aiMatchCandidate: {
      create: vi.fn(async ({ data }: never) => {
        const d = data as { aiScore: number; combinedScore: number };
        state.createdAiCandidates.push({
          aiScore: d.aiScore,
          combinedScore: d.combinedScore,
        });
        return { id: `aic_${state.createdAiCandidates.length}` };
      }),
    },
    aiMatchExplanation: {
      createMany: vi.fn(async ({ data }: never) => {
        for (const e of data as Array<{ audience: string; technicalDetail?: string }>) {
          state.createdExplanations.push(e);
        }
        return { count: (data as unknown[]).length };
      }),
    },
  };
  return { prisma };
});

vi.mock("@/lib/matching/matching-service", () => ({
  runCareWorkerMatch: vi.fn(async () => ({
    run: { id: "rule_run_1" },
  })),
}));

vi.mock("@/lib/fairness/fairness-check-service", () => ({
  runFairnessCheck: vi.fn(async () => ({ id: "fc_1" })),
}));

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
import { runAiCareMatch } from "@/lib/ai-matching/ai-match-service";

const testState = (prisma as unknown as { __state: {
  modelVersion: null | { id: string; provider: string; active: boolean };
  createdAiCandidates: Array<{ aiScore: number; combinedScore: number }>;
  createdExplanations: Array<{ audience: string; technicalDetail?: string }>;
} }).__state;

beforeEach(() => {
  testState.modelVersion = null;
  testState.createdAiCandidates = [];
  testState.createdExplanations = [];
});

describe("runAiCareMatch scoring", () => {
  it("does not fabricate independent AI score from rule score when no model is registered", async () => {
    await runAiCareMatch("cr_1", "u_admin");
    expect(testState.createdAiCandidates.length).toBe(1);
    // No model => aiScore MUST be 0, and combined MUST equal the rule score.
    expect(testState.createdAiCandidates[0].aiScore).toBe(0);
    expect(testState.createdAiCandidates[0].combinedScore).toBeCloseTo(0.9, 5);
  });

  it("technical explanation labels absence of independent commentary", async () => {
    await runAiCareMatch("cr_1", "u_admin");
    const adminExplain = testState.createdExplanations.find(
      (e) => e.audience === "admin"
    );
    expect(adminExplain?.technicalDetail).toContain("Rule score");
    expect(adminExplain?.technicalDetail).toContain(
      "No independent model commentary"
    );
  });

  it("labels no independent commentary when active model is disabled provider", async () => {
    testState.modelVersion = {
      id: "mv_1",
      provider: "disabled",
      active: true,
    };
    await runAiCareMatch("cr_1", "u_admin");
    expect(testState.createdAiCandidates[0].aiScore).toBe(0);
  });
});
