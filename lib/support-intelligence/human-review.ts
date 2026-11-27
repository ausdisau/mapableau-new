import { auditSupportIntelligence } from "@/lib/support-intelligence/audit";
import type { HumanReviewReason } from "@/lib/support-intelligence/types";

export type HumanReviewTicket = {
  id: string;
  reasons: HumanReviewReason[];
  entityType: string;
  entityId: string;
  status: "queued" | "in_review" | "resolved";
  createdAt: string;
  notes?: string;
};

const memoryQueue: HumanReviewTicket[] = [];

export function enqueueHumanReview(input: {
  reasons: HumanReviewReason[];
  entityType: string;
  entityId: string;
  actorUserId?: string | null;
  notes?: string;
}): HumanReviewTicket {
  const ticket: HumanReviewTicket = {
    id: `hr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    reasons: input.reasons,
    entityType: input.entityType,
    entityId: input.entityId,
    status: "queued",
    createdAt: new Date().toISOString(),
    notes: input.notes,
  };
  memoryQueue.push(ticket);
  void auditSupportIntelligence({
    action: "support_intel.human_review.created",
    actorUserId: input.actorUserId,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: { ticketId: ticket.id, reasons: input.reasons },
  });
  return ticket;
}

export function listHumanReviewTickets(): HumanReviewTicket[] {
  return [...memoryQueue];
}

export function clearHumanReviewTicketsForTests(): void {
  memoryQueue.length = 0;
}
