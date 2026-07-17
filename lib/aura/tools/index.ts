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
import {
  AURA_FORBIDDEN_EXECUTION_TOOLS,
  cancelAuraProposal,
  createAuraActionProposal,
  getProposal,
  listProposalVersions,
  listProposalsForMission,
  runProposalShadowEvaluation,
  verifyAuraActionProposal,
  type AuraProposalActionType,
} from "../proposals";
import { listWitness } from "../witness";

/**
 * AURA tools — no Prisma client is passed or closed over.
 * Wave 3: proposal tools only — no execution / delivery tools.
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

function propose(
  ctx: AuraToolContext,
  actionType: AuraProposalActionType,
  extra: Record<string, unknown> = {},
) {
  assertNotStopped(ctx);
  assertLease(ctx.missionId, "proposal.create");
  const proposal = createAuraActionProposal({
    missionId: ctx.missionId,
    userId: ctx.userId,
    actionType,
    recipientLabel: extra.recipientLabel as string | undefined,
    questions: extra.questions as string[] | undefined,
    payload: extra.payload as Record<string, unknown> | undefined,
  });
  const verification = verifyAuraActionProposal(proposal.id);
  return {
    proposal,
    verification,
    notice:
      "Proposal only. No message, booking, report, notification or other external action was performed.",
  };
}

export function createAuraTools(ctx: AuraToolContext) {
  const tools = {
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
    proposeVenueVerification: {
      description:
        "Create a venue verification proposal. Does not deliver a message.",
      inputSchema: z.object({
        recipientLabel: z.string().optional(),
        questions: z.array(z.string()).optional(),
      }),
      execute: async (input: {
        recipientLabel?: string;
        questions?: string[];
      }) => propose(ctx, "venue_verification_request", input),
    },
    proposeVisitPlanShare: {
      description: "Create a Visit Plan sharing proposal. Does not share it.",
      inputSchema: z.object({ recipientLabel: z.string().optional() }),
      execute: async (input: { recipientLabel?: string }) =>
        propose(ctx, "visit_plan_share", input),
    },
    proposeSupporterNotification: {
      description:
        "Create a supporter notification proposal. Does not notify anyone.",
      inputSchema: z.object({
        recipientLabel: z.string().optional(),
        messageSummary: z.string().optional(),
      }),
      execute: async (input: {
        recipientLabel?: string;
        messageSummary?: string;
      }) =>
        propose(ctx, "supporter_notification", {
          recipientLabel: input.recipientLabel,
          payload: { messageSummary: input.messageSummary },
        }),
    },
    proposeTransportRequest: {
      description:
        "Create an accessible transport request proposal. Does not create a trip.",
      inputSchema: z.object({
        pickup: z.string().optional(),
        timeWindow: z.string().optional(),
      }),
      execute: async (input: { pickup?: string; timeWindow?: string }) =>
        propose(ctx, "transport_request", {
          payload: {
            pickup: input.pickup,
            timeWindow: input.timeWindow,
          },
        }),
    },
    proposeBarrierReport: {
      description:
        "Create a barrier report proposal. Does not publish or submit it.",
      inputSchema: z.object({ description: z.string().optional() }),
      execute: async (input: { description?: string }) =>
        propose(ctx, "barrier_report", {
          payload: { description: input.description },
        }),
    },
    verifyActionProposal: {
      description: "Run the deterministic proposal verifier (shadow only).",
      inputSchema: z.object({ proposalId: z.string() }),
      execute: async (input: { proposalId: string }) => {
        assertLease(ctx.missionId, "proposal.verify");
        const p = getProposal(input.proposalId);
        if (!p || p.missionId !== ctx.missionId) {
          throw new Error("AURA_PROPOSAL_NOT_FOUND");
        }
        return verifyAuraActionProposal(input.proposalId);
      },
    },
    readActionProposal: {
      description: "Return a participant-owned proposal.",
      inputSchema: z.object({ proposalId: z.string() }),
      execute: async (input: { proposalId: string }) => {
        assertLease(ctx.missionId, "mission.read");
        const p = getProposal(input.proposalId);
        if (!p || p.missionId !== ctx.missionId) {
          throw new Error("AURA_PROPOSAL_NOT_FOUND");
        }
        return p;
      },
    },
    listActionProposals: {
      description: "List proposals for this mission.",
      inputSchema: z.object({}),
      execute: async () => {
        assertLease(ctx.missionId, "mission.read");
        return listProposalsForMission(ctx.missionId);
      },
    },
    listProposalVersions: {
      description: "Return immutable proposal version summaries.",
      inputSchema: z.object({ proposalId: z.string() }),
      execute: async (input: { proposalId: string }) => {
        assertLease(ctx.missionId, "mission.read");
        return listProposalVersions(input.proposalId);
      },
    },
    runProposalShadowEvaluation: {
      description:
        "Run shadow evaluation after participant acceptance. Performs no external action.",
      inputSchema: z.object({
        proposalId: z.string(),
        reviewId: z.string(),
      }),
      execute: async (input: { proposalId: string; reviewId: string }) => {
        assertNotStopped(ctx);
        assertLease(ctx.missionId, "proposal.shadow");
        return runProposalShadowEvaluation({
          proposalId: input.proposalId,
          userId: ctx.userId,
          reviewId: input.reviewId,
        });
      },
    },
    cancelActionProposal: {
      description:
        "Cancel the proposal only. Does not cancel real MapAble records.",
      inputSchema: z.object({ proposalId: z.string() }),
      execute: async (input: { proposalId: string }) => {
        assertLease(ctx.missionId, "proposal.create");
        return cancelAuraProposal({
          proposalId: input.proposalId,
          userId: ctx.userId,
        });
      },
    },
  };

  for (const name of AURA_FORBIDDEN_EXECUTION_TOOLS) {
    if (name in tools) {
      throw new Error(`AURA_EXECUTION_TOOL_REGISTERED:${name}`);
    }
  }

  return tools;
}

/** Static guarantee for tests: tool factory source must not import the ORM client. */
export const AURA_TOOLS_NO_PRISMA = true;
