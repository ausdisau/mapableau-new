/**
 * Wave 11 — Continuity Case Service.
 *
 * A ContinuityCase is a PROJECTION over Case for service-continuity events.
 * It links to a general Case only when the tenant explicitly wants unified
 * casework; otherwise it stays a stand-alone continuity case.
 *
 * Cases MUST be tenant + participant scoped. Coordinator filter WORKS. The
 * lifecycle is a strict state machine.
 */

import type {
  ContinuityCase,
  ContinuityCaseCategory,
  ContinuityCasePriority,
  ContinuityCaseStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export const CONTINUITY_CASE_TRANSITIONS: Record<ContinuityCaseStatus, ContinuityCaseStatus[]> = {
  open: ["triage", "planning", "abandoned", "closed"],
  triage: ["planning", "abandoned", "closed"],
  planning: ["awaiting_approval", "in_recovery", "abandoned", "closed"],
  awaiting_approval: ["in_recovery", "planning", "abandoned", "closed"],
  in_recovery: ["monitoring", "planning", "resolved", "abandoned", "closed"],
  monitoring: ["resolved", "in_recovery", "closed"],
  resolved: ["closed"],
  closed: [],
  abandoned: [],
};

export function canTransitionContinuityCase(
  from: ContinuityCaseStatus,
  to: ContinuityCaseStatus
): boolean {
  return CONTINUITY_CASE_TRANSITIONS[from]?.includes(to) ?? false;
}

export function isTerminalContinuityCase(status: ContinuityCaseStatus): boolean {
  switch (status) {
    case "closed":
    case "abandoned":
    case "resolved":
      return true;
    case "open":
    case "triage":
    case "planning":
    case "awaiting_approval":
    case "in_recovery":
    case "monitoring":
      return false;
    default: {
      const _exhaustive: never = status;
      throw new Error(`Unhandled continuity case status: ${_exhaustive}`);
    }
  }
}

export interface OpenOrExtendCaseInput {
  organisationId?: string | null;
  participantId: string;
  category: ContinuityCaseCategory;
  title: string;
  summary?: string;
  priority?: ContinuityCasePriority;
  openedById: string;
  coordinatorId?: string | null;
  linkedCaseId?: string | null;
  contextJson?: Record<string, unknown> | null;
  goalsPreservedJson?: Record<string, unknown> | null;
  signalIds?: string[];
}

/**
 * Open a new continuity case, or extend an existing open case for the same
 * (participantId, category) tuple. Signals are added as originating signals.
 */
export async function openOrExtendContinuityCase(input: OpenOrExtendCaseInput): Promise<ContinuityCase> {
  if (!input.participantId) {
    throw new Error("CONTINUITY_CASE_MISSING_PARTICIPANT");
  }

  const existing = await prisma.continuityCase.findFirst({
    where: {
      participantId: input.participantId,
      category: input.category,
      status: { notIn: ["closed", "resolved", "abandoned"] },
      ...(input.organisationId ? { organisationId: input.organisationId } : {}),
    },
    orderBy: { openedAt: "desc" },
  });

  if (existing) {
    if (input.signalIds && input.signalIds.length > 0) {
      await prisma.continuityCase.update({
        where: { id: existing.id },
        data: {
          originatingSignals: {
            connect: input.signalIds.map((id) => ({ id })),
          },
        },
      });
    }
    return existing;
  }

  return prisma.continuityCase.create({
    data: {
      organisationId: input.organisationId ?? null,
      participantId: input.participantId,
      category: input.category,
      title: input.title,
      summary: input.summary,
      priority: input.priority ?? "medium",
      openedById: input.openedById,
      coordinatorId: input.coordinatorId ?? null,
      linkedCaseId: input.linkedCaseId ?? null,
      contextJson: asJson(input.contextJson ?? undefined),
      goalsPreservedJson: asJson(input.goalsPreservedJson ?? undefined),
      originatingSignals:
        input.signalIds && input.signalIds.length > 0
          ? { connect: input.signalIds.map((id) => ({ id })) }
          : undefined,
    },
  });
}

export interface ListContinuityCasesParams {
  organisationId: string;
  participantId?: string;
  coordinatorId?: string;
  category?: ContinuityCaseCategory;
  status?: ContinuityCaseStatus | ContinuityCaseStatus[];
  limit?: number;
  cursorId?: string;
}

export async function listContinuityCases(params: ListContinuityCasesParams) {
  if (!params.organisationId) {
    throw new Error("CONTINUITY_CASE_QUERY_UNSCOPED");
  }
  const take = Math.min(Math.max(params.limit ?? 50, 1), 200);
  const statusFilter = Array.isArray(params.status)
    ? { in: params.status }
    : params.status
      ? { equals: params.status }
      : { notIn: ["closed", "abandoned"] as ContinuityCaseStatus[] };

  return prisma.continuityCase.findMany({
    where: {
      organisationId: params.organisationId,
      ...(params.participantId ? { participantId: params.participantId } : {}),
      ...(params.coordinatorId ? { coordinatorId: params.coordinatorId } : {}),
      ...(params.category ? { category: params.category } : {}),
      status: statusFilter,
    },
    orderBy: [{ openedAt: "desc" }, { id: "desc" }],
    take,
    ...(params.cursorId ? { cursor: { id: params.cursorId }, skip: 1 } : {}),
  });
}

export interface TransitionCaseInput {
  caseId: string;
  toStatus: ContinuityCaseStatus;
  actorUserId: string;
  narrative?: string;
}

export async function transitionContinuityCase(input: TransitionCaseInput): Promise<ContinuityCase> {
  const existing = await prisma.continuityCase.findUnique({ where: { id: input.caseId } });
  if (!existing) throw new Error("CONTINUITY_CASE_NOT_FOUND");
  if (!canTransitionContinuityCase(existing.status, input.toStatus)) {
    throw new Error(
      `CONTINUITY_CASE_INVALID_TRANSITION_${existing.status}_TO_${input.toStatus}`
    );
  }
  const closing = input.toStatus === "closed" || input.toStatus === "abandoned";
  return prisma.continuityCase.update({
    where: { id: existing.id },
    data: {
      status: input.toStatus,
      closedById: closing ? input.actorUserId : existing.closedById,
      closedAt: closing ? new Date() : existing.closedAt,
    },
  });
}
