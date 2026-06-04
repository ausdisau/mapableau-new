import type { NdisDeliveryAuthorizationStatus } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isNdisServiceDeliveryMechanismEnabled } from "@/lib/config/ndis-service-delivery";
import { defaultAuthorizationTypeForRoute } from "@/lib/ndis/service-delivery/mechanism-catalog";
import type { CreateDeliveryAuthorizationInput } from "@/lib/ndis/service-delivery/types";
import { prisma } from "@/lib/prisma";

const ACTIVE_STATUSES: NdisDeliveryAuthorizationStatus[] = ["active"];

export async function createDeliveryAuthorization(
  input: CreateDeliveryAuthorizationInput
) {
  if (!isNdisServiceDeliveryMechanismEnabled()) {
    throw new Error("NDIS_SERVICE_DELIVERY_DISABLED");
  }

  const authorizationType =
    input.authorizationType ??
    defaultAuthorizationTypeForRoute(input.paymentRoute);

  const record = await prisma.ndisServiceDeliveryAuthorization.create({
    data: {
      participantId: input.participantId,
      providerOrgId: input.providerOrgId,
      paymentRoute: input.paymentRoute,
      deliveryMechanism: input.deliveryMechanism,
      authorizationType,
      status: "draft",
      supportItemCode: input.supportItemCode,
      supportCategoryCode: input.supportCategoryCode,
      serviceAgreementId: input.serviceAgreementId,
      careBookingId: input.careBookingId,
      ndiaBookingReference: input.ndiaBookingReference,
      validFrom: input.validFrom,
      validTo: input.validTo,
      notes: input.notes,
      metadataJson: input.metadataJson as object | undefined,
      createdById: input.createdById,
    },
  });

  await createAuditEvent({
    actorUserId: input.createdById,
    action: "ndis_delivery_authorization.created",
    entityType: "NdisServiceDeliveryAuthorization",
    entityId: record.id,
    participantId: input.participantId,
    organisationId: input.providerOrgId,
  });

  return record;
}

export async function activateDeliveryAuthorization(
  authorizationId: string,
  actorUserId: string
) {
  const updated = await prisma.ndisServiceDeliveryAuthorization.update({
    where: { id: authorizationId },
    data: { status: "active" },
  });

  await createAuditEvent({
    actorUserId,
    action: "ndis_delivery_authorization.activated",
    entityType: "NdisServiceDeliveryAuthorization",
    entityId: authorizationId,
    participantId: updated.participantId,
    organisationId: updated.providerOrgId,
  });

  return updated;
}

export async function findActiveDeliveryAuthorization(params: {
  participantId: string;
  providerOrgId: string;
  paymentRoute: CreateDeliveryAuthorizationInput["paymentRoute"];
  deliveryMechanism: CreateDeliveryAuthorizationInput["deliveryMechanism"];
  supportItemCode?: string;
  serviceDate: Date;
}) {
  const { serviceDate } = params;
  return prisma.ndisServiceDeliveryAuthorization.findFirst({
    where: {
      participantId: params.participantId,
      providerOrgId: params.providerOrgId,
      paymentRoute: params.paymentRoute,
      deliveryMechanism: params.deliveryMechanism,
      status: { in: ACTIVE_STATUSES },
      validFrom: { lte: serviceDate },
      AND: [
        { OR: [{ validTo: null }, { validTo: { gte: serviceDate } }] },
        ...(params.supportItemCode
          ? [
              {
                OR: [
                  { supportItemCode: params.supportItemCode },
                  { supportItemCode: null },
                ],
              },
            ]
          : []),
      ],
    },
    orderBy: { validFrom: "desc" },
  });
}

export async function listDeliveryAuthorizationsForOrg(
  providerOrgId: string,
  status?: NdisDeliveryAuthorizationStatus
) {
  return prisma.ndisServiceDeliveryAuthorization.findMany({
    where: {
      providerOrgId,
      ...(status ? { status } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: 100,
  });
}
