import type { ServiceAgreementType } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import {
  createDraftAgreement,
  sendForReview,
  signAgreement,
} from "@/lib/service-agreements/lifecycle-service";


export async function createServiceAgreement(params: {
  participantId: string;
  organisationId: string;
  agreementType: ServiceAgreementType;
  title: string;
  plainLanguageSummary: string;
  startDate: Date;
  endDate?: Date;
  createdById: string;
  fundingSourceId?: string;
}) {
  return createDraftAgreement(params);
}

export async function sendAgreementForReview(
  agreementId: string,
  actorUserId = "system"
) {
  return sendForReview(agreementId, actorUserId);
}

export async function signServiceAgreement(params: {
  agreementId: string;
  signerUserId: string;
  role: "participant" | "provider";
}) {
  return signAgreement(params);
}

export async function agreementWarningIfRequired(
  participantId: string,
  organisationId: string
) {
  const { phase4Config } = await import("@/lib/config/phase4");
  if (!phase4Config.serviceAgreementRequiredForRepeat) return null;

  const active = await prisma.serviceAgreement.findFirst({
    where: {
      participantId,
      organisationId,
      status: { in: ["signed", "active"] },
    },
  });

  if (!active) {
    return "No active service agreement on file — review recommended before repeat bookings.";
  }
  return null;
}
