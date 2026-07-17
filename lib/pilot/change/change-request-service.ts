import type { Prisma } from "@prisma/client";

import { canApplyPilotChange } from "@/lib/pilot/change/release-policy";
import { prisma } from "@/lib/prisma";

export async function createPilotChangeRequest(input: {
  pilotId: string;
  title: string;
  description: string;
  changeType: string;
  requestedById: string;
  riskSummary?: string;
  rollbackPlan?: string;
  safeDiffJson?: Record<string, unknown>;
}) {
  return prisma.pilotChangeRequest.create({
    data: {
      pilotId: input.pilotId,
      title: input.title,
      description: input.description,
      changeType: input.changeType,
      requestedById: input.requestedById,
      riskSummary: input.riskSummary,
      rollbackPlan: input.rollbackPlan,
      safeDiffJson: input.safeDiffJson as Prisma.InputJsonValue | undefined,
      status: "submitted",
    },
  });
}

export async function approvePilotChangeRequest(input: {
  changeRequestId: string;
  approvedById: string;
}) {
  return prisma.pilotChangeRequest.update({
    where: { id: input.changeRequestId },
    data: {
      status: "approved",
      approvedById: input.approvedById,
      approvedAt: new Date(),
    },
  });
}

export async function applyPilotChangeRequest(input: {
  changeRequestId: string;
}) {
  const change = await prisma.pilotChangeRequest.findUniqueOrThrow({
    where: { id: input.changeRequestId },
    include: { pilot: true },
  });
  const gate = canApplyPilotChange({
    status: change.pilot.status,
    stage: change.pilot.stage,
    changeApproved: change.status === "approved",
  });
  if (!gate.ok) throw new Error(gate.reason ?? "CHANGE_APPLY_DENIED");

  return prisma.pilotChangeRequest.update({
    where: { id: change.id },
    data: { status: "applied", appliedAt: new Date() },
  });
}
