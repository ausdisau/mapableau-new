import type { WorkerCredentialStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function createWorkerProfile(params: {
  userId: string;
  organisationId: string;
  displayName: string;
  profileSummary?: string;
  serviceTypes?: string[];
  serviceRegions?: string[];
  languages?: string[];
  communicationCapabilities?: string[];
  qualificationsSummary?: string;
  createdById: string;
}) {
  const profile = await prisma.workerProfile.create({
    data: {
      userId: params.userId,
      organisationId: params.organisationId,
      displayName: params.displayName,
      profileSummary: params.profileSummary,
      serviceTypes: params.serviceTypes ?? [],
      serviceRegions: params.serviceRegions ?? [],
      languages: params.languages ?? [],
      communicationCapabilities: params.communicationCapabilities ?? [],
      qualificationsSummary: params.qualificationsSummary,
      workerScreeningStatus: "not_provided",
      verificationStatus: "pending_review",
      active: true,
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
