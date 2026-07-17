import type {
  DecisionImpact,
  GovernedDecisionStatus,
  Prisma,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

const DECISION_TRANSITIONS: Record<
  GovernedDecisionStatus,
  GovernedDecisionStatus[]
> = {
  proposed: ["pending", "issued", "withdrawn", "archived"],
  pending: ["issued", "withdrawn", "expired"],
  issued: ["challenged", "varied", "withdrawn", "expired", "archived"],
  challenged: ["under_review", "withdrawn"],
  under_review: ["upheld", "overturned", "remitted", "varied"],
  varied: ["issued", "archived"],
  withdrawn: ["archived"],
  upheld: ["archived"],
  overturned: ["archived"],
  remitted: ["pending", "issued"],
  expired: ["archived"],
  archived: [],
};

export type IssueDecisionRecordInput = {
  tenantId?: string;
  subjectUserId?: string;
  systemId?: string;
  systemVersionId?: string;
  impact: DecisionImpact;
  title: string;
  summary: string;
  decisionOwnerId: string;
  humanInvolved: boolean;
  systemInvolved: boolean;
  policyVersion: string;
  materialFacts?: Prisma.InputJsonValue;
  uncertaintyNotes?: string;
  notConsideredNotes?: string;
  effectOnPerson?: string;
  effectiveAt?: Date;
  expiresAt?: Date;
  correlationId?: string;
};

export function canTransitionDecision(
  from: GovernedDecisionStatus,
  to: GovernedDecisionStatus,
): boolean {
  return DECISION_TRANSITIONS[from].includes(to);
}

export async function issueDecisionRecord(input: IssueDecisionRecordInput) {
  return prisma.decisionRecord.create({
    data: {
      ...input,
      status: "issued",
      effectiveAt: input.effectiveAt ?? new Date(),
    },
  });
}

export async function transitionDecisionStatus(params: {
  decisionId: string;
  to: GovernedDecisionStatus;
  actorUserId: string;
  historyNote: string;
}) {
  const decision = await prisma.decisionRecord.findUnique({
    where: { id: params.decisionId },
  });
  if (!decision) throw new Error("DECISION_NOT_FOUND");
  if (!canTransitionDecision(decision.status, params.to))
    throw new Error("INVALID_DECISION_TRANSITION");
  if (params.historyNote.trim().length === 0)
    throw new Error("DECISION_HISTORY_NOTE_REQUIRED");

  const transitionNote = [
    decision.uncertaintyNotes,
    `[governance-status ${decision.status}->${params.to} by ${params.actorUserId} at ${new Date().toISOString()}] ${params.historyNote}`,
  ]
    .filter((note): note is string => Boolean(note))
    .join("\n");

  return prisma.decisionRecord.update({
    where: { id: params.decisionId },
    data: {
      status: params.to,
      uncertaintyNotes: transitionNote,
    },
  });
}
