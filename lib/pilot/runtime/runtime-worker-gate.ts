import type { Prisma } from "@prisma/client";

import { assertOperationAllowedAtStage } from "@/lib/pilot/policy/stage-policy";
import {
  evaluateCredentialChecks,
  type CredentialCheck,
} from "@/lib/pilot/runtime/runtime-credential-gate";
import { prisma } from "@/lib/prisma";

export async function authoriseWorkerForPilot(input: {
  pilotId: string;
  workerUserId: string;
  authorisedById: string;
  credentialChecks: readonly CredentialCheck[];
}) {
  const pilot = await prisma.controlledPilot.findUniqueOrThrow({
    where: { id: input.pilotId },
  });
  assertOperationAllowedAtStage(pilot.stage, "authorise_worker");
  const creds = evaluateCredentialChecks(input.credentialChecks);
  if (!creds.ok) {
    throw new Error(`WORKER_CREDENTIALS_FAILED:${creds.failed.join(",")}`);
  }

  return prisma.pilotWorkerAuthorisation.upsert({
    where: {
      pilotId_workerUserId: {
        pilotId: input.pilotId,
        workerUserId: input.workerUserId,
      },
    },
    create: {
      pilotId: input.pilotId,
      workerUserId: input.workerUserId,
      authorisedById: input.authorisedById,
      active: true,
      credentialChecksJson: input.credentialChecks as unknown as Prisma.InputJsonValue,
    },
    update: {
      active: true,
      authorisedById: input.authorisedById,
      credentialChecksJson: input.credentialChecks as unknown as Prisma.InputJsonValue,
      revokedAt: null,
      revokeReason: null,
    },
  });
}

export async function assertWorkerAuthorisedForPilot(input: {
  pilotId: string;
  workerUserId: string;
}): Promise<void> {
  const auth = await prisma.pilotWorkerAuthorisation.findUnique({
    where: {
      pilotId_workerUserId: {
        pilotId: input.pilotId,
        workerUserId: input.workerUserId,
      },
    },
  });
  if (!auth || !auth.active) {
    throw new Error("WORKER_NOT_AUTHORISED_FOR_PILOT");
  }
}
