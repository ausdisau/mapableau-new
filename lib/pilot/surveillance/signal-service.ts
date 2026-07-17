import type { PilotSignalType, Prisma } from "@prisma/client";

import { classifyPilotSignal } from "@/lib/pilot/surveillance/signal-classifier";
import { prisma } from "@/lib/prisma";

export async function raisePilotSignal(input: {
  pilotId: string;
  signalType?: PilotSignalType;
  summary: string;
  source?: string;
  sourceRef?: string;
  triggerId?: string | null;
  safePayloadJson?: Record<string, unknown>;
}) {
  const classified = classifyPilotSignal({
    source: input.source ?? "other",
    keywords: [input.summary],
  });
  return prisma.pilotSafetySignal.create({
    data: {
      pilotId: input.pilotId,
      triggerId: input.triggerId ?? null,
      signalType: input.signalType ?? classified.signalType,
      severity: classified.severity,
      summary: input.summary,
      sourceRef: input.sourceRef,
      safePayloadJson: (input.safePayloadJson ?? undefined) as
        | Prisma.InputJsonValue
        | undefined,
    },
  });
}

export async function acknowledgePilotSignal(input: {
  signalId: string;
  actorUserId: string;
}) {
  return prisma.pilotSafetySignal.update({
    where: { id: input.signalId },
    data: {
      acknowledged: true,
      acknowledgedById: input.actorUserId,
      acknowledgedAt: new Date(),
    },
  });
}
