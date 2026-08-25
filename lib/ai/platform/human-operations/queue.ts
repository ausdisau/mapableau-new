/**
 * In-memory human review queue (Prompt 08).
 * Prefer matching prior prompts; durable model → Prompt 08A (not this change).
 */

import { randomUUID } from "node:crypto";

import { appendHumanOpsAudit } from "./audit";
import { CATEGORY_REQUIRED_ROLE_LABEL } from "./rbac";
import type {
  HumanOpsEnqueueInput,
  HumanOpsPriority,
  HumanOpsQueueFilter,
  HumanOpsReviewItem,
  IngestHumanReviewItemInput,
} from "./types";
import { HUMAN_OPS_CATEGORIES } from "./types";

const queue = new Map<string, HumanOpsReviewItem>();

function nowIso(): string {
  return new Date().toISOString();
}

function defaultHandlingTeam(category: HumanOpsReviewItem["category"]): string {
  switch (category) {
    case "safeguarding":
      return "Safeguarding team";
    case "financial_review":
      return "Finance review team";
    case "transport_continuity":
      return "Transport continuity team";
    case "care_coordination":
      return "Care coordination team";
    case "employment_disclosure_review":
      return "Employment disclosure reviewers";
    case "credential_exception":
      return "Credential verification team";
    case "access_evidence":
      return "Access evidence reviewers";
    case "authority_review":
      return "Authority & compliance reviewers";
    case "general_coordination":
      return "Coordination team";
    default: {
      const _exhaustive: never = category;
      return _exhaustive;
    }
  }
}

function defaultWhatHappensNext(
  category: HumanOpsReviewItem["category"],
): string {
  if (category === "safeguarding") {
    return "An authorised safeguarding officer will continue this workflow. Automated AI processing has stopped.";
  }
  return "An authorised operator will review and may ask for information or prepare next steps for your approval.";
}

function coerceCategory(raw: string): HumanOpsReviewItem["category"] {
  if ((HUMAN_OPS_CATEGORIES as readonly string[]).includes(raw)) {
    return raw as HumanOpsReviewItem["category"];
  }
  if (raw.includes("safeguard")) return "safeguarding";
  if (raw.includes("transport")) return "transport_continuity";
  if (raw.includes("finance") || raw.includes("invoice")) return "financial_review";
  if (raw.includes("disclosure") || raw.includes("employment")) {
    return "employment_disclosure_review";
  }
  if (raw.includes("access") || raw.includes("evidence")) return "access_evidence";
  if (raw.includes("care")) return "care_coordination";
  if (raw.includes("credential")) return "credential_exception";
  if (raw.includes("authority")) return "authority_review";
  return "general_coordination";
}

function urgencyToPriority(
  urgency: "routine" | "urgent" | undefined,
  category: HumanOpsReviewItem["category"],
): HumanOpsPriority {
  if (category === "safeguarding") return "critical";
  if (urgency === "urgent") return "urgent";
  return "attention";
}

export function enqueueHumanOpsReview(
  input: HumanOpsEnqueueInput,
): HumanOpsReviewItem {
  const createdAt = nowIso();
  const category = input.category;
  const item: HumanOpsReviewItem = {
    reviewId: randomUUID(),
    missionId: input.missionId ?? null,
    participantId: input.participantId,
    tenantId: input.tenantId,
    category,
    priority:
      input.priority ??
      (category === "safeguarding" ? "critical" : "attention"),
    reasonCodes: [...input.reasonCodes],
    evidenceRefs: [...(input.evidenceRefs ?? [])],
    requestedBy: input.requestedBy,
    requiredRole: CATEGORY_REQUIRED_ROLE_LABEL[category],
    status: "queued",
    assignedTo: null,
    createdAt,
    updatedAt: createdAt,
    dueAt: input.dueAt ?? null,
    resolution: null,
    resolutionReason: null,
    auditRefs: [],
    source: input.source,
    sourceReviewItemId: input.sourceReviewItemId ?? null,
    internalNotes: [],
    participantFacingReason: input.participantFacingReason,
    handlingTeam: input.handlingTeam ?? defaultHandlingTeam(category),
    whatHappensNext: defaultWhatHappensNext(category),
    preparedNextStepIds: [],
    proposalReviewState: "human_review_required",
    aiMayDecideReportability: false,
    aiMaySubstantiateAllegation: false,
    aiMayAuthoriseRestrictivePractice: false,
    aiMayCloseIncidentOrComplaint: false,
  };

  queue.set(item.reviewId, item);
  const audit = appendHumanOpsAudit({
    reviewId: item.reviewId,
    actorId: input.requestedBy,
    action: "enqueued",
    tenantId: item.tenantId,
    detail: {
      category: item.category,
      source: item.source,
      missionId: item.missionId,
      priority: item.priority,
    },
  });
  item.auditRefs.push(audit.auditId);
  queue.set(item.reviewId, item);
  return item;
}

export function ingestMapAbleHumanReviewItem(
  input: IngestHumanReviewItemInput,
): HumanOpsReviewItem {
  const category = coerceCategory(input.item.category);
  return enqueueHumanOpsReview({
    participantId: input.participantId,
    tenantId: input.tenantId,
    missionId: input.missionId ?? null,
    category,
    priority: urgencyToPriority(input.item.urgency, category),
    reasonCodes: [input.item.reason],
    evidenceRefs: input.item.evidenceRefs,
    requestedBy: input.requestedBy,
    source: input.source,
    sourceReviewItemId: input.item.id,
    participantFacingReason: input.item.continuationMessage,
  });
}

export function ingestMissionHumanReviewItems(input: {
  missionId: string;
  participantId: string;
  tenantId: string;
  requestedBy: string;
  items: IngestHumanReviewItemInput["item"][];
  source?: IngestHumanReviewItemInput["source"];
}): HumanOpsReviewItem[] {
  const created: HumanOpsReviewItem[] = [];
  for (const item of input.items) {
    const existing = findBySourceReviewItemId(item.id);
    if (existing) {
      created.push(existing);
      continue;
    }
    created.push(
      ingestMapAbleHumanReviewItem({
        item,
        participantId: input.participantId,
        tenantId: input.tenantId,
        missionId: input.missionId,
        requestedBy: input.requestedBy,
        source:
          item.category === "safeguarding"
            ? "safeguarding_gate"
            : (input.source ?? "mission_runtime"),
      }),
    );
  }
  return created;
}

function matchesFilter(
  item: HumanOpsReviewItem,
  filter: HumanOpsQueueFilter,
): boolean {
  if (filter.missionId && item.missionId !== filter.missionId) return false;
  if (filter.participantId && item.participantId !== filter.participantId) {
    return false;
  }
  if (filter.assignedTo !== undefined && item.assignedTo !== filter.assignedTo) {
    return false;
  }
  if (filter.status) {
    const statuses = Array.isArray(filter.status) ? filter.status : [filter.status];
    if (!statuses.includes(item.status)) return false;
  }
  if (filter.category) {
    const categories = Array.isArray(filter.category)
      ? filter.category
      : [filter.category];
    if (!categories.includes(item.category)) return false;
  }
  if (filter.priority) {
    const priorities = Array.isArray(filter.priority)
      ? filter.priority
      : [filter.priority];
    if (!priorities.includes(item.priority)) return false;
  }
  return true;
}

export function listHumanOpsQueue(
  filter: HumanOpsQueueFilter = {},
): HumanOpsReviewItem[] {
  return [...queue.values()]
    .filter((item) => matchesFilter(item, filter))
    .sort((a, b) => {
      const priorityRank: Record<HumanOpsPriority, number> = {
        critical: 0,
        urgent: 1,
        attention: 2,
        routine: 3,
      };
      const pr = priorityRank[a.priority] - priorityRank[b.priority];
      if (pr !== 0) return pr;
      return a.createdAt.localeCompare(b.createdAt);
    });
}

export function getHumanOpsReview(reviewId: string): HumanOpsReviewItem | null {
  return queue.get(reviewId) ?? null;
}

export function saveHumanOpsReview(item: HumanOpsReviewItem): void {
  queue.set(item.reviewId, { ...item, updatedAt: nowIso() });
}

export function findBySourceReviewItemId(
  sourceReviewItemId: string,
): HumanOpsReviewItem | null {
  for (const item of queue.values()) {
    if (item.sourceReviewItemId === sourceReviewItemId) return item;
  }
  return null;
}

export function listHumanOpsForParticipant(
  participantId: string,
): HumanOpsReviewItem[] {
  return listHumanOpsQueue({ participantId });
}

export function clearHumanOpsQueue(): void {
  queue.clear();
}
