import { tool } from "@openai/agents";
import { z } from "zod";

import {
  hardConstraintsSchema,
  rankingWeightsSchema,
} from "@/lib/ai/navigator/matching/types";

import type { MapAbleAgentsContext } from "./contracts";
import {
  proposeHumanEscalationDraft,
  runExistingNavigatorSearch,
} from "./mapable-adapter";
import { assertDomainEnabled, assertNotPermanentlyProhibited } from "./policy";

function failClosedDomain(domain: string): never {
  throw new Error(`MAPABLE_AGENT_DOMAIN_NOT_WIRED:${domain}`);
}

/**
 * Live Access slice: delegates to runNavigatorProviderSearchTurn after gates.
 */
export const navigatorProviderSearchTool = tool({
  name: "navigator_provider_search",
  description:
    "Run the existing MapAble Navigator provider-search turn. Returns options that may fit the participant's preferences; never books, assigns, or pays.",
  parameters: z.object({
    goalText: z.string().max(2000).optional(),
    interpretationConfirmed: z.boolean(),
    hardConstraints: hardConstraintsSchema,
    rankingWeights: rankingWeightsSchema.optional(),
    structuredFilters: z
      .object({
        q: z.string().max(500).optional(),
        location: z.string().max(200).optional(),
        service: z.string().max(200).optional(),
        access: z.string().max(200).optional(),
        provider: z.string().max(200).optional(),
        state: z.string().max(10).optional(),
        postcode: z.string().max(12).optional(),
      })
      .strict()
      .optional(),
    permittedFields: z.array(z.string().min(1).max(80)).max(40).optional(),
    humanHelpRequested: z.boolean().optional(),
    saveDraft: z.boolean().optional(),
    transferFilters: z.boolean().optional(),
  }),
  execute: async (args, runContext) => {
    const context = runContext?.context as MapAbleAgentsContext | undefined;
    if (!context) {
      throw new Error("MAPABLE_AGENT_CONTEXT_MISSING");
    }
    assertDomainEnabled(context, "access");
    assertNotPermanentlyProhibited("book_or_cancel_service");
    assertNotPermanentlyProhibited("assign_worker_or_driver");
    assertNotPermanentlyProhibited("auto_assign_worker");

    const result = await runExistingNavigatorSearch(context, {
      goalText: args.goalText,
      interpretationConfirmed: args.interpretationConfirmed,
      hardConstraints: args.hardConstraints,
      rankingWeights: args.rankingWeights,
      structuredFilters: args.structuredFilters,
      permittedFields: args.permittedFields,
      humanHelpRequested: args.humanHelpRequested,
      saveDraft: args.saveDraft,
      transferFilters: args.transferFilters,
    });

    return {
      status: result.status,
      interpretation: result.interpretation,
      matchSummary:
        result.match == null
          ? null
          : {
              candidateCount: result.match.shortlist?.length ?? 0,
              // Prefer participant-language: options that may fit preferences
              language: "options_that_may_fit_preferences",
            },
      draftEnvelopeId: result.draftEnvelopeId,
      transferEnvelopeId: result.transferEnvelopeId,
      passportId: result.passportId,
      reason: "reason" in result ? result.reason : undefined,
    };
  },
});

export const proposeHumanEscalationDraftTool = tool({
  name: "propose_human_escalation_draft",
  description:
    "Prepare a human-review draft only. Does not make findings, contact anyone, or submit reports.",
  parameters: z.object({
    reason: z.string().min(1).max(500),
    note: z.string().max(500).optional(),
  }),
  execute: async (args, runContext) => {
    const context = runContext?.context as MapAbleAgentsContext | undefined;
    if (!context) {
      throw new Error("MAPABLE_AGENT_CONTEXT_MISSING");
    }
    return proposeHumanEscalationDraft(context, args);
  },
});

export const careReadOnlyTool = tool({
  name: "care_read_only",
  description:
    "Care specialist placeholder — fail-closed until Care domain gates are wired.",
  parameters: z.object({
    query: z.string().max(500).optional(),
  }),
  execute: async (_args, runContext) => {
    const context = runContext?.context as MapAbleAgentsContext | undefined;
    if (context) assertDomainEnabled(context, "care");
    failClosedDomain("care");
  },
});

export const transportReadOnlyTool = tool({
  name: "transport_read_only",
  description:
    "Transport specialist placeholder — fail-closed; link requirements only in Care spine.",
  parameters: z.object({
    query: z.string().max(500).optional(),
  }),
  execute: async (_args, runContext) => {
    const context = runContext?.context as MapAbleAgentsContext | undefined;
    if (context) assertDomainEnabled(context, "transport");
    failClosedDomain("transport");
  },
});

export const jobsReadOnlyTool = tool({
  name: "jobs_read_only",
  description: "Jobs specialist placeholder — fail-closed.",
  parameters: z.object({
    query: z.string().max(500).optional(),
  }),
  execute: async (_args, runContext) => {
    const context = runContext?.context as MapAbleAgentsContext | undefined;
    if (context) assertDomainEnabled(context, "jobs");
    failClosedDomain("jobs");
  },
});

export const safeguardingReadOnlyTool = tool({
  name: "safeguarding_read_only",
  description:
    "Safeguarding specialist placeholder — draft/human-review only; never makes findings.",
  parameters: z.object({
    query: z.string().max(500).optional(),
  }),
  execute: async (_args, runContext) => {
    const context = runContext?.context as MapAbleAgentsContext | undefined;
    if (context) assertDomainEnabled(context, "safeguarding");
    failClosedDomain("safeguarding");
  },
});

export const complianceReadOnlyTool = tool({
  name: "compliance_read_only",
  description: "Compliance specialist placeholder — read/draft only; fail-closed.",
  parameters: z.object({
    query: z.string().max(500).optional(),
  }),
  execute: async (_args, runContext) => {
    const context = runContext?.context as MapAbleAgentsContext | undefined;
    if (context) assertDomainEnabled(context, "compliance");
    failClosedDomain("compliance");
  },
});
