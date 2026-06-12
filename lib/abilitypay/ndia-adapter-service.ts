import type { MapAbleUserRole } from "@prisma/client";

import { decryptNdisNumber, maskNdisNumber } from "@/lib/crypto/ndis";
import { isNdiaProviderClaimingEnabled } from "@/lib/ndia-provider-claiming/config";
import type { NdiaProviderClaimPayload } from "@/lib/ndia-provider-claiming/types";
import { prisma } from "@/lib/prisma";

import { logAbilityPayEvent } from "./audit";

function isoDate(d: Date) {
  return d.toISOString().slice(0, 10);
}

async function participantNdis(participantId: string) {
  const profile = await prisma.participantProfile.findUnique({
    where: { userId: participantId },
  });
  if (!profile?.ndisParticipantNumberEnc) {
    return { ndisNumber: null, masked: null };
  }
  const ndisNumber = decryptNdisNumber(profile.ndisParticipantNumberEnc);
  return {
    ndisNumber,
    masked: ndisNumber ? maskNdisNumber(ndisNumber) : null,
  };
}

export async function buildClaimFromAbilityPayInvoice(
  abilityPayInvoiceId: string,
  organisationId: string
) {
  const invoice = await prisma.abilityPayInvoice.findFirst({
    where: { id: abilityPayInvoiceId },
    include: {
      lineItems: { orderBy: { sortOrder: "asc" } },
      provider: { include: { organisation: true } },
    },
  });
  if (!invoice) return { ok: false as const, error: "Invoice not found" };

  const org =
    invoice.provider?.organisation ??
    (await prisma.organisation.findUnique({
      where: { id: organisationId },
    }));
  if (!org || org.id !== organisationId) {
    return { ok: false as const, error: "Organisation required" };
  }

  const { ndisNumber, masked } = await participantNdis(invoice.participantId);
  const serviceDates = invoice.lineItems.map((l) => l.serviceDate);
  const start =
    serviceDates.length > 0
      ? new Date(Math.min(...serviceDates.map((d) => d.getTime())))
      : invoice.issueDate ?? invoice.createdAt;
  const end =
    serviceDates.length > 0
      ? new Date(Math.max(...serviceDates.map((d) => d.getTime())))
      : invoice.dueDate ?? invoice.createdAt;

  const payload: NdiaProviderClaimPayload = {
    claimType: "registered_provider",
    provider: {
      abn: org.abn,
      ndisRegistrationNumber: org.ndisRegistrationNumber ?? "",
      organisationId: org.id,
      name: org.name,
    },
    participant: {
      ndisNumber,
      ndisNumberMasked: masked,
      mapableUserId: invoice.participantId,
    },
    invoiceReference: {
      invoiceNumber: invoice.invoiceNumber,
    },
    servicePeriod: { start: isoDate(start), end: isoDate(end) },
    lines: invoice.lineItems.map((line, i) => ({
      lineNumber: i + 1,
      supportItemCode: line.supportItemCode ?? "",
      description: line.description,
      serviceDate: isoDate(line.serviceDate),
      quantity: Number(line.quantity),
      unitPriceCents: line.unitPriceCents,
      totalCents: line.totalCents,
      gstIncluded: false,
    })),
    totals: {
      subtotalCents: invoice.subtotalCents,
      taxCents: invoice.taxCents,
      totalCents: invoice.totalCents,
      currency: invoice.currency,
    },
    metadata: {
      builtAt: new Date().toISOString(),
      mapableVersion: "1",
      abilityPayInvoiceId: invoice.id,
    } as NdiaProviderClaimPayload["metadata"] & { abilityPayInvoiceId: string },
  };

  return {
    ok: true as const,
    payload,
    participantId: invoice.participantId,
    organisationId: org.id,
  };
}

export async function initiateNdiaHandoff(params: {
  invoiceId: string;
  actorUserId: string;
  actorRole: MapAbleUserRole;
}) {
  const invoice = await prisma.abilityPayInvoice.findUnique({
    where: { id: params.invoiceId },
    include: {
      provider: true,
      paymentAttempts: {
        where: { adapter: "ndia_claim" },
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });
  if (!invoice) throw new Error("INVOICE_NOT_FOUND");

  const organisationId = invoice.provider?.organisationId;
  if (!organisationId) throw new Error("PROVIDER_ORG_REQUIRED");

  if (!isNdiaProviderClaimingEnabled()) {
    await logAbilityPayEvent({
      action: "abilitypay.payment.ndia_handoff",
      entityType: "AbilityPayInvoice",
      entityId: params.invoiceId,
      actorUserId: params.actorUserId,
      actorRole: params.actorRole,
      participantId: invoice.participantId,
      metadata: {
        status: "metadata_only",
        reason: "NDIA_PROVIDER_CLAIMING_DISABLED",
      },
    });
    return {
      handoff: "metadata_only" as const,
      message: "NDIA claiming is disabled; invoice marked for agency handoff.",
    };
  }

  const built = await buildClaimFromAbilityPayInvoice(
    params.invoiceId,
    organisationId
  );
  if (!built.ok) throw new Error(built.error);

  const claim = await prisma.ndiaProviderClaim.create({
    data: {
      organisationId,
      participantId: built.participantId,
      createdById: params.actorUserId,
      ndisRegistrationNumber: built.payload.provider.ndisRegistrationNumber,
      status: "draft",
      claimPayloadJson: built.payload as object,
      validationFindingsJson: [],
    },
  });

  const attempt = invoice.paymentAttempts[0];
  if (attempt) {
    await prisma.abilityPayPaymentAttempt.update({
      where: { id: attempt.id },
      data: {
        status: "processing",
        externalRef: claim.id,
        metadata: {
          ...(typeof attempt.metadata === "object" && attempt.metadata
            ? (attempt.metadata as object)
            : {}),
          ndiaClaimId: claim.id,
        },
      },
    });
  }

  await logAbilityPayEvent({
    action: "abilitypay.payment.ndia_handoff",
    entityType: "NdiaProviderClaim",
    entityId: claim.id,
    actorUserId: params.actorUserId,
    actorRole: params.actorRole,
    participantId: invoice.participantId,
    organisationId,
    metadata: { abilityPayInvoiceId: params.invoiceId },
  });

  return {
    handoff: "claim_draft" as const,
    claimId: claim.id,
    message: "NDIA claim draft created for provider review.",
  };
}
