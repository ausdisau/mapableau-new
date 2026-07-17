import { prisma } from "@/lib/prisma";
import type { ReleaseRing } from "@prisma/client";

export async function createDeployment(input: {
  releaseId: string;
  organisationId?: string | null;
  ring: ReleaseRing;
  initiatedById?: string;
  scheduledAt?: Date;
}) {
  return prisma.releaseDeployment.create({
    data: {
      releaseId: input.releaseId,
      organisationId: input.organisationId ?? null,
      ring: input.ring,
      status: "scheduled",
      initiatedById: input.initiatedById ?? null,
      scheduledAt: input.scheduledAt ?? null,
    },
  });
}

export async function markDeploymentDeploying(id: string) {
  return prisma.releaseDeployment.update({
    where: { id },
    data: { status: "deploying", startedAt: new Date() },
  });
}

export async function markDeploymentSucceeded(id: string) {
  return prisma.releaseDeployment.update({
    where: { id },
    data: { status: "succeeded", completedAt: new Date() },
  });
}

export async function markDeploymentFailed(id: string, reason: string) {
  return prisma.releaseDeployment.update({
    where: { id },
    data: {
      status: "failed",
      completedAt: new Date(),
      rollbackReason: reason,
    },
  });
}
