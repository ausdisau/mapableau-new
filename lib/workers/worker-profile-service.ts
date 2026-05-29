import type { WorkerCredentialStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import type { workerProfileSelfSchema } from "@/lib/validation/worker";
import type { z } from "zod";

type WorkerProfileSelfInput = z.infer<typeof workerProfileSelfSchema>;

export async function getPrimaryWorkerProfileForUser(userId: string) {
  return prisma.workerProfile.findFirst({
    where: { userId, active: true },
    orderBy: { createdAt: "asc" },
    include: {
      organisation: { select: { id: true, name: true, organisationType: true } },
      availabilityWindows: {
        where: { active: true },
        orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
      },
    },
  });
}

export async function getOrCreateWorkerProfileForUser(
  userId: string,
  displayName: string
) {
  const existing = await getPrimaryWorkerProfileForUser(userId);
  if (existing) return existing;

  const membership = await prisma.organisationMember.findFirst({
    where: { userId, role: "support_worker" },
    orderBy: { createdAt: "asc" },
  });
  if (!membership) return null;

  return prisma.workerProfile.create({
    data: {
      userId,
      organisationId: membership.organisationId,
      displayName,
      verificationStatus: "pending_review",
      active: true,
    },
    include: {
      organisation: { select: { id: true, name: true, organisationType: true } },
      availabilityWindows: true,
    },
  });
}

export async function createWorkerProfile(params: {
  userId: string;
  organisationId: string;
  displayName: string;
  profileSummary?: string;
  serviceTypes?: string[];
  serviceRegions?: string[];
  specialisations?: string[];
  languages?: string[];
  communicationCapabilities?: string[];
  qualificationsSummary?: string;
  createdById: string;
}) {
  const profile = await prisma.workerProfile.upsert({
    where: {
      userId_organisationId: {
        userId: params.userId,
        organisationId: params.organisationId,
      },
    },
    create: {
      userId: params.userId,
      organisationId: params.organisationId,
      displayName: params.displayName,
      profileSummary: params.profileSummary,
      serviceTypes: params.serviceTypes ?? [],
      serviceRegions: params.serviceRegions ?? [],
      specialisations: params.specialisations ?? [],
      languages: params.languages ?? [],
      communicationCapabilities: params.communicationCapabilities ?? [],
      qualificationsSummary: params.qualificationsSummary,
      workerScreeningStatus: "not_provided",
      verificationStatus: "pending_review",
      active: true,
    },
    update: {
      displayName: params.displayName,
      profileSummary: params.profileSummary,
      serviceTypes: params.serviceTypes,
      serviceRegions: params.serviceRegions,
      specialisations: params.specialisations,
      languages: params.languages,
    },
  });

  await createAuditEvent({
    actorUserId: params.createdById,
    action: "worker_profile.created",
    entityType: "WorkerProfile",
    entityId: profile.id,
    organisationId: params.organisationId,
  });

  return profile;
}

export async function verifyWorkerProfile(
  workerId: string,
  verificationStatus: "verified" | "rejected" | "pending_review",
  adminUserId: string
) {
  const profile = await prisma.workerProfile.update({
    where: { id: workerId },
    data: { verificationStatus },
  });

  await createAuditEvent({
    actorUserId: adminUserId,
    action: "worker_profile.verification_updated",
    entityType: "WorkerProfile",
    entityId: workerId,
    organisationId: profile.organisationId,
    metadata: { verificationStatus },
  });

  return profile;
}

export async function updateWorkerCredential(
  workerId: string,
  field: "workerScreeningStatus" | "wwccStatus" | "firstAidStatus" | "insuranceStatus",
  status: WorkerCredentialStatus,
  actorUserId: string
) {
  const profile = await prisma.workerProfile.update({
    where: { id: workerId },
    data: { [field]: status },
  });
  await createAuditEvent({
    actorUserId,
    action: "worker_profile.credential_updated",
    entityType: "WorkerProfile",
    entityId: workerId,
    metadata: { field, status },
  });
  return profile;
}

export async function updateWorkerProfileSelf(
  profileId: string,
  userId: string,
  data: WorkerProfileSelfInput
) {
  const profile = await prisma.workerProfile.update({
    where: { id: profileId, userId },
    data: {
      displayName: data.displayName,
      profileSummary: data.profileSummary,
      serviceTypes: data.serviceTypes,
      serviceRegions: data.serviceRegions,
      specialisations: data.specialisations,
      languages: data.languages,
      communicationCapabilities: data.communicationCapabilities,
      qualificationsSummary: data.qualificationsSummary,
    },
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "worker_profile.updated",
    entityType: "WorkerProfile",
    entityId: profile.id,
    organisationId: profile.organisationId,
  });

  return profile;
}

export async function replaceWorkerAvailabilityWindows(
  profileId: string,
  organisationId: string,
  userId: string,
  windows: {
    dayOfWeek:
      | "MONDAY"
      | "TUESDAY"
      | "WEDNESDAY"
      | "THURSDAY"
      | "FRIDAY"
      | "SATURDAY"
      | "SUNDAY";
    startTime: string;
    endTime: string;
    timezone?: string;
    active?: boolean;
  }[]
) {
  await prisma.$transaction(async (tx) => {
    await tx.availabilityWindow.updateMany({
      where: { workerProfileId: profileId },
      data: { active: false },
    });
    for (const w of windows) {
      await tx.availabilityWindow.create({
        data: {
          organisationId,
          workerProfileId: profileId,
          dayOfWeek: w.dayOfWeek,
          startTime: w.startTime,
          endTime: w.endTime,
          timezone: w.timezone ?? "Australia/Sydney",
          active: w.active ?? true,
        },
      });
    }
  });

  await createAuditEvent({
    actorUserId: userId,
    action: "worker_profile.availability_updated",
    entityType: "WorkerProfile",
    entityId: profileId,
    organisationId,
    metadata: { windowCount: windows.length },
  });

  return prisma.availabilityWindow.findMany({
    where: { workerProfileId: profileId, active: true },
    orderBy: [{ dayOfWeek: "asc" }, { startTime: "asc" }],
  });
}
