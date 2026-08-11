import { randomUUID } from "node:crypto";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  decisionPassportSchema,
  type DecisionPassport,
} from "@/lib/ai/platform/decision-passport/types";
import type { RankedProvider } from "@/lib/provider/finder/matching/rank";
import type { HardConstraintResult } from "@/lib/provider/finder/matching/hard-constraints";

export type ProjectDecisionPassportInput = {
  tenantId?: string | null;
  participantId: string;
  actorUserId: string;
  capabilityKey: string;
  requestedSummary: string;
  preferencesUsed: string[];
  constraintsUsed: string[];
  ranked: RankedProvider[];
  hardConstraints: HardConstraintResult;
  aiUsed: boolean;
  modelVersion?: string | null;
  promptVersion?: string | null;
  proposedActionType: string;
  envelopeId?: string | null;
  requiredApproverRole: string;
  providerFinderPath?: string;
};

/**
 * Participant-facing Decision Passport projection.
 * Does not write authority grants or act as a consent/capacity system.
 * Does not expose hidden chain-of-thought.
 */
export function projectDecisionPassport(
  input: ProjectDecisionPassportInput,
): DecisionPassport {
  const missing = new Set<string>();
  for (const item of input.ranked) {
    for (const m of item.missingData) missing.add(m);
  }
  if (input.hardConstraints.noMatch) {
    missing.add("no_eligible_providers_under_hard_constraints");
  }

  const passport = decisionPassportSchema.parse({
    id: randomUUID(),
    tenantId: input.tenantId ?? null,
    participantId: input.participantId,
    capabilityKey: input.capabilityKey,
    requestedSummary: input.requestedSummary,
    preferencesUsed: input.preferencesUsed,
    constraintsUsed: input.constraintsUsed,
    sourcesConsulted: [
      {
        id: "ndis_providers_directory",
        label: "NDIS provider directory (MapAble ingest)",
        kind: "approved_directory",
      },
    ],
    missingOrStaleInformation: [...missing],
    suggestedProviders: input.ranked.slice(0, 5).map((item) => ({
      sourceId: item.provider.source_id,
      name: item.provider.provider_name,
      reasons: item.factors
        .filter((f) => f.contribution > 0)
        .map((f) => f.note),
      score: Number(item.score.toFixed(4)),
    })),
    uncertaintyAndLimitations: [
      "Directory data may be incomplete or stale.",
      "Live availability is not verified in this pilot.",
      "AI commentary is optional and subordinate to deterministic matching.",
      ...(input.hardConstraints.noMatch
        ? [
            "No providers met hard constraints; constraints were not relaxed.",
          ]
        : []),
    ],
    aiInvolvement: {
      used: input.aiUsed,
      modelVersion: input.modelVersion ?? null,
      promptVersion: input.promptVersion ?? null,
      commentaryOptional: true,
    },
    proposedNextAction: {
      actionType: input.proposedActionType,
      envelopeId: input.envelopeId ?? null,
      summary: input.hardConstraints.noMatch
        ? "Escalate to a human coordinator for supported search."
        : "Create a service-request draft or transfer filters to Provider Finder.",
    },
    requiredApproverRole: input.requiredApproverRole,
    controls: {
      canCorrectFacts: true,
      canEditRankingWeights: true,
      canEditHardConstraints: true,
      canRejectSuggestion: true,
      canRequestAnotherOption: true,
      canWithdrawConsent: true,
      canRequestHumanReview: true,
      canContinueNonAi: true,
      nonAiPath: input.providerFinderPath ?? "/provider-finder",
    },
    createdAt: new Date().toISOString(),
  });

  return passport;
}

export async function auditDecisionPassportProjected(input: {
  passport: DecisionPassport;
  actorUserId: string;
}) {
  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.passport.participantId,
    action: "navigator.passport.projected",
    entityType: "DecisionPassport",
    entityId: input.passport.id,
    metadata: {
      suggestedCount: input.passport.suggestedProviders.length,
      noMatch:
        input.passport.missingOrStaleInformation.includes(
          "no_eligible_providers_under_hard_constraints",
        ),
    },
  });
}
