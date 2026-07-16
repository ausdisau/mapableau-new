import { z } from "zod";

import { auraCounterfactualMutationSchema } from "../counterfactual";
import { assertLease, listActiveLeases } from "../leases";
import {
  assessPlanResilience,
  challengeMissionPlan,
  createOfflineVisitPack,
  getMissionAuditReplay,
  getMissionResponse,
  listCounterfactuals,
  renderOfflinePackHtml,
  runCounterfactual,
  stopAuraMission,
} from "../mission/service";
import { requireMission } from "../mission/store";
import { listWitness } from "../witness";

/**
 * AURA tools — no Prisma client is passed or closed over.
 * Tools call application services / in-memory mission store only.
 * Wave 2 tools are read/simulate only — no external writes.
 */
export type AuraToolContext = {
  missionId: string;
  userId: string;
  abortSignal?: AbortSignal;
};

function assertNotStopped(ctx: AuraToolContext) {
  const m = requireMission(ctx.missionId);
  if (m.stopState || m.status === "stopped") {
    throw new Error("AURA_MISSION_STOPPED");
  }
  if (ctx.abortSignal?.aborted) {
    throw new Error("AURA_MISSION_STOPPED");
  }
  return m;
}

export function createAuraTools(ctx: AuraToolContext) {
  return {
    readMissionContext: {
      description: "Read current mission context (leased).",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        return getMissionResponse(ctx.missionId);
      },
    },
    readMissionGraph: {
      description: "Read mission dependency graph.",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        const m = requireMission(ctx.missionId);
        return m.graph;
      },
    },
    listCapabilityLeases: {
      description: "List active capability leases for this mission.",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        return listActiveLeases(ctx.missionId).map((l) => ({
          capabilityId: l.capabilityId,
          module: l.module,
          authority: l.authority,
          expiresAt: l.expiresAt,
          revokedAt: l.revokedAt,
        }));
      },
    },
    stopMission: {
      description:
        "Stop AURA for this mission. Prefer the direct Stop UI; model may explain the result.",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.stop");
        return stopAuraMission(ctx.missionId, ctx.userId);
      },
    },
    verifyProofCarryingPlan: {
      description: "Return independent verifier result (cannot be overridden).",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "plan.verify");
        const m = requireMission(ctx.missionId);
        return m.verifier;
      },
    },
    challengeProofPlan: {
      description:
        "Bounded structured plan challenge (at most one automatic cycle per plan version).",
      inputSchema: z.object({}),
      execute: async () => {
        assertNotStopped(ctx);
        assertLease(ctx.missionId, "plan.challenge");
        return challengeMissionPlan(ctx.missionId);
      },
    },
    /** @deprecated Wave 1 name — aliases challengeProofPlan */
    challengePlan: {
      description: "One bounded advisory self-challenge cycle.",
      inputSchema: z.object({}),
      execute: async () => {
        assertNotStopped(ctx);
        assertLease(ctx.missionId, "plan.challenge");
        return challengeMissionPlan(ctx.missionId);
      },
    },
    runCounterfactual: {
      description:
        "Run a deterministic simulated counterfactual. Does not change real venue or mission state.",
      inputSchema: z.object({
        basePlanId: z.string(),
        mutation: auraCounterfactualMutationSchema,
      }),
      execute: async (input: {
        basePlanId: string;
        mutation: z.infer<typeof auraCounterfactualMutationSchema>;
      }) => {
        assertNotStopped(ctx);
        assertLease(ctx.missionId, "access.counterfactuals");
        return runCounterfactual(
          {
            missionId: ctx.missionId,
            basePlanId: input.basePlanId,
            mutation: input.mutation,
          },
          ctx.userId,
        );
      },
    },
    assessPlanResilience: {
      description:
        "Assess plan/environment resilience (not participant capability).",
      inputSchema: z.object({}),
      execute: async () => {
        assertNotStopped(ctx);
        assertLease(ctx.missionId, "access.build_route");
        return assessPlanResilience(ctx.missionId);
      },
    },
    readPlanVersions: {
      description: "Return immutable plan version summaries for this mission.",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        const m = requireMission(ctx.missionId);
        return {
          missionId: m.id,
          versions: m.planVersions,
          currentPlanId: m.plan?.id ?? null,
        };
      },
    },
    createOfflineVisitPack: {
      description:
        "Create a data-minimised offline Visit Pack snapshot (no external sharing).",
      inputSchema: z.object({
        includeOptional: z.array(z.string()).optional(),
      }),
      execute: async (input: { includeOptional?: string[] }) => {
        assertNotStopped(ctx);
        assertLease(ctx.missionId, "mission.read");
        const pack = createOfflineVisitPack({
          missionId: ctx.missionId,
          userId: ctx.userId,
          includeOptional: input.includeOptional,
        });
        return {
          pack,
          htmlPreviewBytes: renderOfflinePackHtml(pack).length,
          disclaimer:
            "Saved snapshot. Live conditions may change after generation time.",
        };
      },
    },
    readAuditReplay: {
      description:
        "Return redacted structured audit replay (no chain-of-thought).",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        return getMissionAuditReplay(ctx.missionId);
      },
    },
    listCounterfactualRuns: {
      description: "List simulated counterfactual results for this mission.",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        return listCounterfactuals(ctx.missionId);
      },
    },
    readAuditWitness: {
      description: "Read redacted witness/audit events for replay.",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        return listWitness(ctx.missionId);
      },
    },
  };
}

/** Static guarantee for tests: tool factory source must not import the ORM client. */
export const AURA_TOOLS_NO_PRISMA = true;
