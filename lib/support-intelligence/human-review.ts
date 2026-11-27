import { prisma } from "@/lib/prisma";
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

/** In-memory mirror for unit tests when Prisma is unavailable. */
const memoryQueue: HumanReviewTicket[] = [];

function toTicket(row: {
  id: string;
  reasons: string[];
  entityType: string;
  entityId: string;
  status: string;
  createdAt: Date;
  notes: string | null;
}): HumanReviewTicket {
  return {
    id: row.id,
    reasons: row.reasons as HumanReviewReason[],
    entityType: row.entityType,
    entityId: row.entityId,
    status: row.status as HumanReviewTicket["status"],
    createdAt: row.createdAt.toISOString(),
    notes: row.notes ?? undefined,
  };
}

/**
 * Persist human-review tickets to Postgres before treating them as queued.
 * Falls back to memory only when the DB write fails (tests / degraded).
 */
export async function enqueueHumanReview(input: {
  reasons: HumanReviewReason[];
  entityType: string;
  entityId: string;
  actorUserId?: string | null;
  notes?: string;
}): Promise<HumanReviewTicket> {
  let ticket: HumanReviewTicket;

  if (process.env.DATABASE_URL) {
    try {
      const row = await prisma.supportIntelHumanReview.create({
        data: {
          reasons: input.reasons,
          entityType: input.entityType,
          entityId: input.entityId,
          status: "queued",
          notes: input.notes,
          actorUserId: input.actorUserId ?? undefined,
        },
      });
      ticket = toTicket(row);
    } catch {
      ticket = {
        id: `hr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        reasons: input.reasons,
        entityType: input.entityType,
        entityId: input.entityId,
        status: "queued",
        createdAt: new Date().toISOString(),
        notes: input.notes,
      };
      memoryQueue.push(ticket);
    }
  } else {
    ticket = {
      id: `hr_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      reasons: input.reasons,
      entityType: input.entityType,
      entityId: input.entityId,
      status: "queued",
      createdAt: new Date().toISOString(),
      notes: input.notes,
    };
    memoryQueue.push(ticket);
  }

  await auditSupportIntelligence({
    action: "support_intel.human_review.created",
    actorUserId: input.actorUserId,
    entityType: input.entityType,
    entityId: input.entityId,
    metadata: { ticketId: ticket.id, reasons: input.reasons },
  });
  return ticket;
}

export async function listHumanReviewTickets(): Promise<HumanReviewTicket[]> {
  if (!process.env.DATABASE_URL) return [...memoryQueue];
  try {
    const rows = await prisma.supportIntelHumanReview.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    });
    return rows.map(toTicket);
  } catch {
    return [...memoryQueue];
  }
}

export function clearHumanReviewTicketsForTests(): void {
  memoryQueue.length = 0;
}
