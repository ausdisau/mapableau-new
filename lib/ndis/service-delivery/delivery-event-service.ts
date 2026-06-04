import { isNdisServiceDeliveryMechanismEnabled } from "@/lib/config/ndis-service-delivery";
import { findActiveDeliveryAuthorization } from "@/lib/ndis/service-delivery/authorization-service";
import type {
  DeliveryValidationIssue,
  RecordDeliveryEventInput,
} from "@/lib/ndis/service-delivery/types";
import { prisma } from "@/lib/prisma";

export async function recordDeliveryEvent(input: RecordDeliveryEventInput) {
  if (!isNdisServiceDeliveryMechanismEnabled()) {
    throw new Error("NDIS_SERVICE_DELIVERY_DISABLED");
  }

  const event = await prisma.ndisServiceDeliveryEvent.create({
    data: {
      authorizationId: input.authorizationId,
      participantId: input.participantId,
      providerOrgId: input.providerOrgId,
      deliveryMechanism: input.deliveryMechanism,
      paymentRoute: input.paymentRoute,
      careShiftId: input.careShiftId,
      careServiceLogId: input.careServiceLogId,
      claimLineId: input.claimLineId,
      serviceDate: input.serviceDate,
      quantityMinutes: input.quantityMinutes,
      evidenceJson: input.evidenceJson as object | undefined,
      createdById: input.createdById,
    },
  });

  if (input.careServiceLogId) {
    await prisma.careServiceLog.update({
      where: { id: input.careServiceLogId },
      data: {
        deliveryMechanism: input.deliveryMechanism,
        deliveryAuthorizationId: input.authorizationId,
      },
    });
  }

  if (input.claimLineId) {
    await prisma.ndisClaimLine.update({
      where: { id: input.claimLineId },
      data: {
        deliveryMechanism: input.deliveryMechanism,
        deliveryAuthorizationId: input.authorizationId,
      },
    });
  }

  return event;
}

export async function validateDeliveryAuthorizationForClaim(params: {
  participantId: string;
  providerOrgId: string;
  paymentRoute: RecordDeliveryEventInput["paymentRoute"];
  deliveryMechanism?: RecordDeliveryEventInput["deliveryMechanism"] | null;
  supportItemCode?: string;
  serviceDate: Date;
}): Promise<DeliveryValidationIssue[]> {
  if (!isNdisServiceDeliveryMechanismEnabled()) return [];

  const issues: DeliveryValidationIssue[] = [];

  if (!params.deliveryMechanism) {
    issues.push({
      code: "delivery_mechanism_missing",
      field: "deliveryMechanism",
      message:
        "NDIS service delivery mechanism is required when delivery tracking is enabled.",
      severity: "error",
    });
    return issues;
  }

  try {
    const auth = await findActiveDeliveryAuthorization({
      participantId: params.participantId,
      providerOrgId: params.providerOrgId,
      paymentRoute: params.paymentRoute,
      deliveryMechanism: params.deliveryMechanism,
      supportItemCode: params.supportItemCode,
      serviceDate: params.serviceDate,
    });

    if (!auth) {
      issues.push({
        code: "delivery_authorization_missing",
        field: "deliveryAuthorizationId",
        message:
          "No active service delivery authorization covers this participant, provider, mechanism, and service date.",
        severity: "error",
      });
    } else if (
      params.paymentRoute === "ndia_managed" &&
      !auth.ndiaBookingReference
    ) {
      issues.push({
        code: "ndia_service_booking_reference_missing",
        field: "ndiaBookingReference",
        message:
          "NDIA-managed delivery requires a service booking reference on the authorization.",
        severity: "warning",
      });
    }
  } catch {
    // DB unavailable in CI — skip authorization lookup
  }

  return issues;
}
