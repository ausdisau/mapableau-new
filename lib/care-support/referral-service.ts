import type { CareRequestType, Prisma, SupportReferralType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { createCareRequest } from "@/lib/care/care-request-service";
import { prisma } from "@/lib/prisma";
import {
  assertCoordinatorCanAccessParticipant,
  assertParticipantSelfById,
  CareSupportAccessError,
} from "@/lib/care-support/access-control";
import { refreshCoordinationCaseCounts } from "@/lib/care-support/coordination-service";
import { createCoordinatorTaskForParticipant } from "@/lib/care-support/coordinator-tasks";

export function providerFinderUrlFromDestination(
  destinationJson: Prisma.JsonValue
): string | null {
  if (!destinationJson || typeof destinationJson !== "object" || Array.isArray(destinationJson)) {
    return null;
  }
  const d = destinationJson as Record<string, unknown>;
  const params = new URLSearchParams();
  if (typeof d.q === "string") params.set("q", d.q);
  if (typeof d.suburb === "string") params.set("suburb", d.suburb);
  if (typeof d.state === "string") params.set("state", d.state);
  const qs = params.toString();
  return qs ? `/provider-finder?${qs}` : "/provider-finder";
}

export async function listReferralsForParticipant(participantId: string) {
  return prisma.supportReferral.findMany({
    where: { participantId },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: { careRequest: { select: { id: true, status: true, title: true } } },
  });
}

export async function getReferralById(referralId: string) {
  return prisma.supportReferral.findUnique({
    where: { id: referralId },
    include: { careRequest: { select: { id: true, status: true, title: true } } },
  });
}

export async function createReferral(params: {
  participantId: string;
  createdById: string;
  referralType: SupportReferralType;
  summary: string;
  assessmentId?: string;
  priority?: "low" | "normal" | "high" | "urgent";
  destinationJson?: Record<string, unknown>;
  asCoordinator?: boolean;
}) {
  if (params.asCoordinator) {
    await assertCoordinatorCanAccessParticipant(
      params.createdById,
      params.participantId,
      "care_support.referral_manage"
    );
  } else {
    assertParticipantSelfById(params.createdById, params.participantId);
  }

  const referral = await prisma.supportReferral.create({
    data: {
      participantId: params.participantId,
      createdById: params.createdById,
      assessmentId: params.assessmentId,
      referralType: params.referralType,
      summary: params.summary,
      priority: params.priority ?? "normal",
      destinationJson: (params.destinationJson ?? {}) as Prisma.InputJsonValue,
      status: "draft",
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "care_support.referral_created",
    entityType: "SupportReferral",
    entityId: referral.id,
    participantId: params.participantId,
  });

  return referral;
}

export async function updateReferral(params: {
  referralId: string;
  actorUserId: string;
  status?: string;
  priority?: string;
  summary?: string;
  destinationJson?: Record<string, unknown>;
  careRequestId?: string;
  asCoordinator?: boolean;
}) {
  const existing = await prisma.supportReferral.findUnique({
    where: { id: params.referralId },
  });
  if (!existing) throw new CareSupportAccessError("NOT_FOUND");

  if (params.asCoordinator) {
    await assertCoordinatorCanAccessParticipant(
      params.actorUserId,
      existing.participantId,
      "care_support.referral_manage"
    );
  } else {
    assertParticipantSelfById(params.actorUserId, existing.participantId);
    if (existing.status !== "draft" && params.status && params.status !== existing.status) {
      throw new CareSupportAccessError("REFERRAL_NOT_EDITABLE");
    }
  }

  const referral = await prisma.supportReferral.update({
    where: { id: params.referralId },
    data: {
      ...(params.status ? { status: params.status as never } : {}),
      ...(params.priority ? { priority: params.priority as never } : {}),
      ...(params.summary !== undefined ? { summary: params.summary } : {}),
      ...(params.destinationJson !== undefined
        ? { destinationJson: params.destinationJson as Prisma.InputJsonValue }
        : {}),
      ...(params.careRequestId !== undefined ? { careRequestId: params.careRequestId } : {}),
    },
  });

  await refreshCoordinationCaseCounts(existing.participantId);

  if (params.status && params.status !== existing.status) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "care_support.referral_status_changed",
      entityType: "SupportReferral",
      entityId: referral.id,
      participantId: existing.participantId,
      metadata: { from: existing.status, to: params.status },
    });
  }

  return referral;
}

export async function submitReferral(referralId: string, actorUserId: string) {
  const existing = await prisma.supportReferral.findUnique({
    where: { id: referralId },
  });
  if (!existing) throw new CareSupportAccessError("NOT_FOUND");
  assertParticipantSelfById(actorUserId, existing.participantId);

  const referral = await updateReferral({
    referralId,
    actorUserId,
    status: "submitted",
  });

  const rels = await prisma.supportCoordinatorRelationship.findMany({
    where: { participantId: existing.participantId, status: "active" },
  });
  for (const rel of rels) {
    await createCoordinatorTaskForParticipant({
      participantId: existing.participantId,
      coordinatorId: rel.coordinatorId,
      taskType: "triage_referral",
      title: `Triage referral: ${existing.summary.slice(0, 80)}`,
    });
  }

  await refreshCoordinationCaseCounts(existing.participantId);
  return referral;
}

export async function createCareRequestFromReferral(
  referralId: string,
  actorUserId: string,
  overrides?: {
    requestType?: CareRequestType;
    title?: string;
    description?: string;
  }
) {
  const referral = await prisma.supportReferral.findUnique({
    where: { id: referralId },
  });
  if (!referral) throw new CareSupportAccessError("NOT_FOUND");

  if (referral.referralType !== "internal_care") {
    throw new CareSupportAccessError("REFERRAL_NOT_CARE_TYPE");
  }

  const isCoordinator =
    referral.participantId !== actorUserId &&
    (await assertCoordinatorCanAccessParticipant(
      actorUserId,
      referral.participantId,
      "care_support.referral_manage"
    ).then(
      () => true,
      () => false
    ));

  if (!isCoordinator && referral.participantId !== actorUserId) {
    throw new CareSupportAccessError("FORBIDDEN");
  }
  if (!isCoordinator) {
    assertParticipantSelfById(actorUserId, referral.participantId);
  }

  const dest =
    referral.destinationJson &&
    typeof referral.destinationJson === "object" &&
    !Array.isArray(referral.destinationJson)
      ? (referral.destinationJson as Record<string, unknown>)
      : {};

  const requestType =
    overrides?.requestType ??
    (typeof dest.requestType === "string"
      ? (dest.requestType as CareRequestType)
      : "other");

  const title =
    overrides?.title ??
    (typeof dest.title === "string" ? dest.title : `Care — ${referral.summary.slice(0, 120)}`);

  const description =
    overrides?.description ??
    (typeof dest.description === "string" ? dest.description : referral.summary);

  const careRequest = await createCareRequest({
    participantId: referral.participantId,
    createdById: actorUserId,
    requestType,
    title,
    description,
    accessRequirementsSummary:
      typeof dest.accessRequirementsSummary === "string"
        ? dest.accessRequirementsSummary
        : undefined,
    tasks: Array.isArray(dest.tasks) ? dest.tasks : undefined,
  });

  const updated = await prisma.supportReferral.update({
    where: { id: referralId },
    data: {
      careRequestId: careRequest.id,
      status: referral.status === "draft" ? "accepted" : referral.status,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "care_support.referral_care_request_created",
    entityType: "SupportReferral",
    entityId: referral.id,
    participantId: referral.participantId,
    metadata: { careRequestId: careRequest.id },
  });

  await refreshCoordinationCaseCounts(referral.participantId);

  return { referral: updated, careRequest };
}
