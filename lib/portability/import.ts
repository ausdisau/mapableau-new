import type { PortabilityImportJob } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export async function queuePortabilityImport(input: {
  participantId: string;
  sourceLabel: string;
  requestedById: string;
}): Promise<PortabilityImportJob> {
  if (input.requestedById !== input.participantId) {
    throw new Error("only_participant_can_request_import");
  }
  return prisma.portabilityImportJob.create({
    data: {
      participantId: input.participantId,
      sourceLabel: input.sourceLabel,
      status: "queued",
    },
  });
}

export async function completePortabilityImport(input: {
  jobId: string;
  conflicts?: Record<string, unknown>;
  humanSummary: string;
}): Promise<PortabilityImportJob> {
  return prisma.portabilityImportJob.update({
    where: { id: input.jobId },
    data: {
      status: "completed",
      completedAt: new Date(),
      conflicts: asJson(input.conflicts),
      humanSummary: input.humanSummary,
    },
  });
}
