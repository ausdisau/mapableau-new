import type {
  Prisma,
  ServiceAgreement,
  ServiceAgreementStatus,
  ServiceAgreementType,
} from "@prisma/client";

import { createAttestation } from "@/lib/attestations/attestation-service";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { runSmartContract } from "@/lib/contracts/contract-runner";
import { prisma } from "@/lib/prisma";

export class ServiceAgreementLifecycleError extends Error {
  constructor(
    public readonly code:
      | "NOT_FOUND"
      | "INVALID_TRANSITION"
      | "FORBIDDEN"
      | "ALREADY_SIGNED"
      | "COMPLIANCE_BLOCKED",
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
  }
}

function assertStatus(
  agreement: ServiceAgreement,
  allowed: ServiceAgreementStatus[],
  action: string
) {
  if (!allowed.includes(agreement.status)) {
    throw new ServiceAgreementLifecycleError(
      "INVALID_TRANSITION",
      `Cannot ${action} when agreement is ${agreement.status}`
    );
  }
}

export async function createDraftAgreement(params: {
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
  const agreement = await prisma.serviceAgreement.create({
    data: { ...params, status: "draft" },
  });
  await createAuditEvent({
    actorUserId: params.createdById,
    action: "service_agreement.created",
    entityType: "ServiceAgreement",
    entityId: agreement.id,
    participantId: agreement.participantId,
    organisationId: agreement.organisationId,
    metadata: { status: agreement.status },
  });
  return agreement;
}

export async function sendForReview(agreementId: string, actorUserId: string) {
  const agreement = await prisma.serviceAgreement.findUnique({
    where: { id: agreementId },
  });
  if (!agreement) {
    throw new ServiceAgreementLifecycleError("NOT_FOUND", "Agreement not found");
  }
  assertStatus(agreement, ["draft", "participant_review"], "send for review");

  const updated = await prisma.serviceAgreement.update({
    where: { id: agreementId },
    data: { status: "sent_for_review" },
  });
  await createAuditEvent({
    actorUserId,
    action: "service_agreement.sent_for_review",
    entityType: "ServiceAgreement",
    entityId: updated.id,
    participantId: updated.participantId,
    organisationId: updated.organisationId,
  });
  return updated;
}

export async function markNegotiationUpdate(params: {
  agreementId: string;
  authorUserId: string;
  summary: string;
  changeSetJson?: Prisma.InputJsonValue;
}) {
  const agreement = await prisma.serviceAgreement.findUnique({
    where: { id: params.agreementId },
  });
  if (!agreement) {
    throw new ServiceAgreementLifecycleError("NOT_FOUND", "Agreement not found");
  }
  assertStatus(
    agreement,
    ["draft", "sent_for_review", "participant_review", "signed"],
    "record negotiation update"
  );

  const [revision, updated] = await prisma.$transaction([
    prisma.serviceAgreementRevision.create({
      data: {
        agreementId: agreement.id,
        authorUserId: params.authorUserId,
        summary: params.summary,
        changeSetJson: params.changeSetJson,
      },
    }),
    prisma.serviceAgreement.update({
      where: { id: agreement.id },
      data: {
        status:
          agreement.status === "signed"
            ? "participant_review"
            : agreement.status === "draft"
              ? "sent_for_review"
              : "participant_review",
        participantSignedAt:
          agreement.status === "signed" ? null : agreement.participantSignedAt,
        providerSignedAt:
          agreement.status === "signed" ? null : agreement.providerSignedAt,
        signedByParticipantId:
          agreement.status === "signed" ? null : agreement.signedByParticipantId,
        signedByProviderId:
          agreement.status === "signed" ? null : agreement.signedByProviderId,
      },
    }),
  ]);

  await createAuditEvent({
    actorUserId: params.authorUserId,
    action: "service_agreement.negotiation_updated",
    entityType: "ServiceAgreement",
    entityId: agreement.id,
    participantId: agreement.participantId,
    organisationId: agreement.organisationId,
    metadata: { revisionId: revision.id, status: updated.status },
  });

  return { agreement: updated, revision };
}

export async function signAgreement(params: {
  agreementId: string;
  signerUserId: string;
  role: "participant" | "provider";
}) {
  const agreement = await prisma.serviceAgreement.findUnique({
    where: { id: params.agreementId },
  });
  if (!agreement) {
    throw new ServiceAgreementLifecycleError("NOT_FOUND", "Agreement not found");
  }
  assertStatus(
    agreement,
    ["draft", "sent_for_review", "participant_review", "signed"],
    "sign agreement"
  );

  const alreadySigned =
    params.role === "participant"
      ? Boolean(agreement.participantSignedAt)
      : Boolean(agreement.providerSignedAt);
  if (alreadySigned) {
    throw new ServiceAgreementLifecycleError(
      "ALREADY_SIGNED",
      `Agreement already signed by ${params.role}`
    );
  }

  const data =
    params.role === "participant"
      ? {
          signedByParticipantId: params.signerUserId,
          participantSignedAt: new Date(),
        }
      : {
          signedByProviderId: params.signerUserId,
          providerSignedAt: new Date(),
        };

  const willBeFullySigned =
    params.role === "participant"
      ? Boolean(agreement.providerSignedAt)
      : Boolean(agreement.participantSignedAt);

  const updated = await prisma.serviceAgreement.update({
    where: { id: params.agreementId },
    data: {
      ...data,
      status: willBeFullySigned ? "signed" : "participant_review",
    },
  });

  if (updated.status === "signed") {
    await createAttestation({
      type: "provider_accepted_service_agreement",
      actorUserId: params.signerUserId,
      participantId: agreement.participantId,
      actorOrganisationId: agreement.organisationId,
      entityType: "ServiceAgreement",
      entityId: agreement.id,
      claim: "Service agreement signed by participant and provider",
      evidence: { agreementId: agreement.id },
    });
  }

  await createAuditEvent({
    actorUserId: params.signerUserId,
    action: "service_agreement.signed",
    entityType: "ServiceAgreement",
    entityId: agreement.id,
    participantId: agreement.participantId,
    organisationId: agreement.organisationId,
    metadata: { status: updated.status, role: params.role },
  });

  return updated;
}

export async function activateAgreement(params: {
  agreementId: string;
  actorUserId: string;
  complianceContractCode?: string;
}) {
  const agreement = await prisma.serviceAgreement.findUnique({
    where: { id: params.agreementId },
  });
  if (!agreement) {
    throw new ServiceAgreementLifecycleError("NOT_FOUND", "Agreement not found");
  }
  assertStatus(agreement, ["signed", "participant_review"], "activate agreement");

  if (!agreement.participantSignedAt || !agreement.providerSignedAt) {
    throw new ServiceAgreementLifecycleError(
      "INVALID_TRANSITION",
      "Cannot activate agreement before both parties sign"
    );
  }

  const contractCode =
    params.complianceContractCode ?? "SERVICE_AGREEMENT_ACTIVATION_V1";
  const compliance = await runSmartContract({
    contractCode,
    actorUserId: params.actorUserId,
    entityType: "ServiceAgreement",
    entityId: agreement.id,
    participantId: agreement.participantId,
    context: {
      agreementType: agreement.agreementType,
      startDate: agreement.startDate.toISOString(),
      endDate: agreement.endDate?.toISOString() ?? null,
      hasParticipantSignature: Boolean(agreement.participantSignedAt),
      hasProviderSignature: Boolean(agreement.providerSignedAt),
      fundingSourceId: agreement.fundingSourceId,
      serviceTypes: agreement.serviceTypes,
    },
  });

  if (compliance.result !== "passed") {
    throw new ServiceAgreementLifecycleError(
      "COMPLIANCE_BLOCKED",
      "Agreement activation blocked by compliance checks",
      {
        result: compliance.result,
        findings: "findings" in compliance ? compliance.findings : [],
        runId: "run" in compliance ? compliance.run?.id : undefined,
      }
    );
  }

  const updated = await prisma.serviceAgreement.update({
    where: { id: agreement.id },
    data: { status: "active" },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "service_agreement.activated",
    entityType: "ServiceAgreement",
    entityId: agreement.id,
    participantId: agreement.participantId,
    organisationId: agreement.organisationId,
    metadata: {
      contractCode,
      runId: "run" in compliance ? compliance.run?.id : undefined,
    },
  });
  return {
    agreement: updated,
    complianceRunId: "run" in compliance ? compliance.run?.id : undefined,
  };
}

export async function cancelAgreement(params: {
  agreementId: string;
  actorUserId: string;
  reason?: string;
}) {
  const agreement = await prisma.serviceAgreement.findUnique({
    where: { id: params.agreementId },
  });
  if (!agreement) {
    throw new ServiceAgreementLifecycleError("NOT_FOUND", "Agreement not found");
  }
  assertStatus(
    agreement,
    ["draft", "sent_for_review", "participant_review", "signed", "active"],
    "cancel agreement"
  );

  const updated = await prisma.serviceAgreement.update({
    where: { id: agreement.id },
    data: { status: "cancelled" },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "service_agreement.cancelled",
    entityType: "ServiceAgreement",
    entityId: agreement.id,
    participantId: agreement.participantId,
    organisationId: agreement.organisationId,
    metadata: { reason: params.reason ?? null },
  });
  return updated;
}

export async function expireAgreement(params: {
  agreementId: string;
  actorUserId?: string;
  source?: "manual" | "job";
}) {
  const agreement = await prisma.serviceAgreement.findUnique({
    where: { id: params.agreementId },
  });
  if (!agreement) {
    throw new ServiceAgreementLifecycleError("NOT_FOUND", "Agreement not found");
  }
  assertStatus(agreement, ["active", "signed"], "expire agreement");

  const updated = await prisma.serviceAgreement.update({
    where: { id: agreement.id },
    data: { status: "expired" },
  });
  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "service_agreement.expired",
    entityType: "ServiceAgreement",
    entityId: agreement.id,
    participantId: agreement.participantId,
    organisationId: agreement.organisationId,
    metadata: { source: params.source ?? "manual" },
  });
  return updated;
}

export async function expireDueAgreements(params?: {
  actorUserId?: string;
  source?: "manual" | "job";
  now?: Date;
}) {
  const now = params?.now ?? new Date();
  const due = await prisma.serviceAgreement.findMany({
    where: {
      endDate: { lt: now },
      status: { in: ["active", "signed"] },
    },
    select: { id: true },
  });
  const results: ServiceAgreement[] = [];
  for (const item of due) {
    const expired = await expireAgreement({
      agreementId: item.id,
      actorUserId: params?.actorUserId,
      source: params?.source ?? "job",
    });
    results.push(expired);
  }
  return results;
}

export async function listAgreementRevisions(agreementId: string) {
  return prisma.serviceAgreementRevision.findMany({
    where: { agreementId },
    orderBy: { createdAt: "desc" },
  });
}
