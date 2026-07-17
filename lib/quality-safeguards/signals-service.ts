import type {
  SafeguardSignal,
  SafeguardSignalStatus,
  SafeguardSignalUrgency,
  TrustSafetyQueueItem,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

import { appendQsImmutableAuditEvent } from "./audit-service";
import type {
  RuleTrigger,
  SafeguardSignalInput,
  SignalTriageInput,
} from "./types";

function mapTrustSafetyUrgency(
  item: TrustSafetyQueueItem
): SafeguardSignalUrgency {
  if (item.escalationLevel >= 2) return "critical";
  if (item.escalationLevel >= 1) return "high";
  if (item.source === "incident") return "high";
  return "moderate";
}

export async function createSafeguardSignal(
  input: SafeguardSignalInput
): Promise<SafeguardSignal> {
  return prisma.safeguardSignal.create({
    data: {
      organisationId: input.organisationId ?? null,
      sourceType: input.sourceType,
      sourceId: input.sourceId ?? null,
      participantId: input.participantId ?? null,
      workerId: input.workerId ?? null,
      providerId: input.providerId ?? null,
      serviceVertical: input.serviceVertical ?? "core",
      summary: input.summary,
      observedAt: input.observedAt,
      urgency: input.urgency ?? "unassessed",
      immediateSafetyConcern: input.immediateSafetyConcern ?? false,
      ruleTriggers: (input.ruleTriggers ?? []) as object[],
      createdById: input.createdById ?? null,
      isAnonymous: input.isAnonymous ?? false,
      assignedTeam: input.assignedTeam ?? null,
      assignedUserId: input.assignedUserId ?? null,
    },
  });
}

export async function listSafeguardSignals(params?: {
  organisationId?: string | null;
  status?: SafeguardSignalStatus | SafeguardSignalStatus[];
  urgency?: SafeguardSignalUrgency;
  immediateOnly?: boolean;
  limit?: number;
  offset?: number;
}) {
  const statusFilter = params?.status
    ? Array.isArray(params.status)
      ? { in: params.status }
      : params.status
    : undefined;

  return prisma.safeguardSignal.findMany({
    where: {
      deletedAt: null,
      ...(params?.organisationId
        ? { organisationId: params.organisationId }
        : {}),
      ...(statusFilter ? { status: statusFilter } : {}),
      ...(params?.urgency ? { urgency: params.urgency } : {}),
      ...(params?.immediateOnly ? { immediateSafetyConcern: true } : {}),
    },
    orderBy: [
      { immediateSafetyConcern: "desc" },
      { urgency: "asc" },
      { receivedAt: "desc" },
    ],
    take: params?.limit ?? 50,
    skip: params?.offset ?? 0,
  });
}

export async function getSafeguardSignalForOrg(
  id: string,
  organisationId?: string | null
): Promise<SafeguardSignal | null> {
  return prisma.safeguardSignal.findFirst({
    where: {
      id,
      deletedAt: null,
      ...(organisationId ? { organisationId } : {}),
    },
  });
}

export async function triageSafeguardSignal(params: {
  signalId: string;
  actorId: string;
  actorRole?: string;
  organisationId?: string | null;
  input: SignalTriageInput;
}): Promise<SafeguardSignal> {
  const existing = await getSafeguardSignalForOrg(
    params.signalId,
    params.organisationId
  );
  if (!existing) {
    throw new Error("Signal not found or not in organisation scope");
  }

  let nextStatus: SafeguardSignalStatus = existing.status;
  const data: {
    status?: SafeguardSignalStatus;
    dismissReason?: string | null;
    triageNotes?: string | null;
    assignedUserId?: string | null;
    urgency?: SafeguardSignalUrgency;
    immediateSafetyConcern?: boolean;
    convertedResourceType?: string | null;
    convertedResourceId?: string | null;
    version: number;
  } = { version: existing.version + 1 };

  switch (params.input.action) {
    case "triage":
      nextStatus = "triaged";
      data.status = nextStatus;
      data.triageNotes = params.input.notes ?? existing.triageNotes;
      if (params.input.assignedUserId !== undefined) {
        data.assignedUserId = params.input.assignedUserId;
      }
      if (params.input.urgency) data.urgency = params.input.urgency;
      if (params.input.immediateSafetyConcern !== undefined) {
        data.immediateSafetyConcern = params.input.immediateSafetyConcern;
      }
      break;
    case "link":
      if (!params.input.linkedSignalId) {
        throw new Error("linkedSignalId is required for link action");
      }
      nextStatus = "linked";
      data.status = nextStatus;
      data.triageNotes = params.input.notes ?? existing.triageNotes;
      await prisma.safeguardSignalLink.upsert({
        where: {
          fromSignalId_toSignalId_linkType: {
            fromSignalId: existing.id,
            toSignalId: params.input.linkedSignalId,
            linkType: "related",
          },
        },
        create: {
          fromSignalId: existing.id,
          toSignalId: params.input.linkedSignalId,
          linkType: "related",
          note: params.input.notes,
        },
        update: { note: params.input.notes },
      });
      break;
    case "convert_to_case":
      nextStatus = "converted_to_case";
      data.status = nextStatus;
      data.convertedResourceType =
        params.input.convertedResourceType ?? "pending_case";
      data.convertedResourceId = params.input.convertedResourceId ?? null;
      data.triageNotes = params.input.notes ?? existing.triageNotes;
      break;
    case "dismiss_with_reason":
      if (!params.input.reason?.trim()) {
        throw new Error(
          "A reason is required to dismiss a signal (never silently discard)"
        );
      }
      nextStatus = "dismissed_with_reason";
      data.status = nextStatus;
      data.dismissReason = params.input.reason.trim();
      data.triageNotes = params.input.notes ?? existing.triageNotes;
      break;
    case "request_more_info":
      nextStatus = "triaged";
      data.status = nextStatus;
      data.triageNotes =
        params.input.notes ??
        "More information requested from reporter / assigned team.";
      break;
    case "record_immediate_action":
      data.immediateSafetyConcern =
        params.input.immediateSafetyConcern ?? existing.immediateSafetyConcern;
      data.triageNotes = params.input.notes ?? existing.triageNotes;
      if (existing.status === "new") {
        nextStatus = "triaged";
        data.status = nextStatus;
      }
      break;
    default: {
      const _exhaustive: never = params.input.action;
      throw new Error(`Unknown triage action: ${_exhaustive}`);
    }
  }

  const updated = await prisma.safeguardSignal.update({
    where: { id: existing.id },
    data,
  });

  await appendQsImmutableAuditEvent({
    organisationId: existing.organisationId,
    actorId: params.actorId,
    actorRole: params.actorRole,
    action: `signal.${params.input.action}`,
    resourceType: "safeguard_signal",
    resourceId: existing.id,
    reason: params.input.reason,
    before: {
      status: existing.status,
      urgency: existing.urgency,
      version: existing.version,
    },
    after: {
      status: updated.status,
      urgency: updated.urgency,
      version: updated.version,
      dismissReason: updated.dismissReason,
    },
    metadata: {
      notes: params.input.notes,
      linkedSignalId: params.input.linkedSignalId,
    },
  });

  return updated;
}

/**
 * Upsert SafeguardSignal rows from TrustSafetyQueueItem feeders.
 * Non-destructive: does not delete or overwrite triage outcomes.
 */
export async function syncSignalsFromTrustSafetyQueue(): Promise<number> {
  const items = await prisma.trustSafetyQueueItem.findMany({
    where: {
      status: { in: ["open", "acknowledged", "investigating", "escalated"] },
    },
    take: 200,
  });

  let upserted = 0;
  for (const item of items) {
    const sourceId = item.id;
    const existing = await prisma.safeguardSignal.findFirst({
      where: {
        sourceType: "trust_safety_queue",
        sourceId,
        deletedAt: null,
      },
    });

    const ruleTriggers: RuleTrigger[] = [
      {
        code: "trust_safety_feeder",
        version: "2026-07",
        triggeredAt: new Date().toISOString(),
        advisory: true,
        summary: `Synced from trust-safety queue (${item.source})`,
        suggestedAction: "Triage in Quality & Safeguards inbox",
        requiredReviewerRole: "quality_officer",
      },
    ];

    if (!existing) {
      await prisma.safeguardSignal.create({
        data: {
          organisationId: item.organisationId,
          sourceType: "trust_safety_queue",
          sourceId,
          participantId: item.participantId,
          summary: item.summary
            ? `${item.title}: ${item.summary}`
            : item.title,
          observedAt: item.createdAt,
          receivedAt: item.updatedAt,
          urgency: mapTrustSafetyUrgency(item),
          immediateSafetyConcern:
            item.source === "incident" && item.escalationLevel >= 1,
          status: "new",
          ruleTriggers: ruleTriggers as object[],
          serviceVertical: "core",
        },
      });
      upserted += 1;
      continue;
    }

    if (
      existing.status === "new" ||
      existing.status === "triaged" ||
      existing.status === "linked"
    ) {
      await prisma.safeguardSignal.update({
        where: { id: existing.id },
        data: {
          summary: item.summary
            ? `${item.title}: ${item.summary}`
            : item.title,
          urgency: mapTrustSafetyUrgency(item),
          ruleTriggers: ruleTriggers as object[],
        },
      });
      upserted += 1;
    }
  }

  return upserted;
}

export function redactAnonymousSignal<T extends SafeguardSignal>(
  signal: T,
  canViewIdentity: boolean
): T {
  if (!signal.isAnonymous || canViewIdentity) return signal;
  return {
    ...signal,
    participantId: null,
    workerId: null,
    createdById: null,
    summary: signal.summary.replace(/\b[\w.+-]+@[\w.-]+\.\w+\b/g, "[redacted]"),
  };
}
