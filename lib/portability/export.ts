import type {
  PortabilityDataScope,
  PortabilityExportJob,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";

export async function queuePortabilityExport(input: {
  participantId: string;
  scope: PortabilityDataScope;
  requestedById: string;
}): Promise<PortabilityExportJob> {
  if (input.requestedById !== input.participantId) {
    throw new Error("only_participant_can_request_export");
  }
  return prisma.portabilityExportJob.create({
    data: {
      participantId: input.participantId,
      scope: input.scope,
      status: "queued",
    },
  });
}

export async function completePortabilityExport(input: {
  jobId: string;
  artifactRef: string;
  humanSummary: string;
}): Promise<PortabilityExportJob> {
  return prisma.portabilityExportJob.update({
    where: { id: input.jobId },
    data: {
      status: "completed",
      completedAt: new Date(),
      artifactRef: input.artifactRef,
      humanSummary: input.humanSummary,
    },
  });
}
