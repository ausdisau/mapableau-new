import { createHash } from "crypto";

import { z } from "zod";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import {
  mapShiftToNdisLineItem,
  type NdisLineItemPricing,
} from "@/lib/billing/ndis-pricing-engine";
import type { PaceCheckOutTelemetryEntry } from "@/lib/care/shift-telemetry-schemas";
import { hashShiftTelemetry } from "@/lib/care/shift-telemetry-schemas";
import { decryptNdisNumber } from "@/lib/crypto/ndis";
import { isPaceTelemetryClaimingEnabled } from "@/lib/ndis/pace-config";
import { verifyPaceEndorsement } from "@/lib/ndis/pace-service";
import { prisma } from "@/lib/prisma";

export const PaceSubmitRequestSchema = z.object({
  completedShiftId: z.string().min(1),
});

export type PaceClaimPayload = {
  registrationNumber: string | null;
  ndisNumber: string | null;
  supportItemNumber: string;
  serviceStartDate: string;
  serviceEndDate: string;
  quantityHours: number;
  unitPrice: number;
  totalClaimAmount: number;
  authorityCeiling: "DRAFT_ONLY";
  requiresHumanConfirmation: true;
  liveSubmit: false;
  timeBand: string;
  intensity: string;
};

export type PaceClaimBuildResult = {
  claimId: string;
  payload: PaceClaimPayload;
  pricing: NdisLineItemPricing;
  telemetryHash: string;
  payloadHash: string;
  paceStatus: string;
  warnings: string[];
};

const DEFAULT_SUPPORT_CATEGORY = "0001";

function extractCheckOutTelemetry(
  supportsDelivered: unknown,
  snapshot: unknown
): PaceCheckOutTelemetryEntry | null {
  if (Array.isArray(supportsDelivered)) {
    const found = supportsDelivered.find(
      (item) =>
        item &&
        typeof item === "object" &&
        (item as { kind?: string }).kind === "pace_telemetry_check_out"
    );
    if (found) return found as PaceCheckOutTelemetryEntry;
  }
  if (snapshot && typeof snapshot === "object") {
    const nested = (snapshot as { paceCheckOutTelemetry?: unknown })
      .paceCheckOutTelemetry;
    if (
      nested &&
      typeof nested === "object" &&
      (nested as { kind?: string }).kind === "pace_telemetry_check_out"
    ) {
      return nested as PaceCheckOutTelemetryEntry;
    }
  }
  return null;
}

/**
 * Build a DRAFT_ONLY PACE claim payload from a completed (checked-out) shift.
 * Never submits to NDIA.
 */
export async function buildPaceClaimFromShift(params: {
  completedShiftId: string;
  actorUserId: string;
}): Promise<PaceClaimBuildResult> {
  if (!isPaceTelemetryClaimingEnabled()) {
    throw new Error("PACE_TELEMETRY_CLAIMING_DISABLED");
  }

  const shift = await prisma.careShift.findUnique({
    where: { id: params.completedShiftId },
    include: {
      organisation: {
        select: {
          ndisRegistrationNumber: true,
          abn: true,
        },
      },
      participant: {
        select: {
          id: true,
          participantProfile: {
            select: { ndisParticipantNumberEnc: true },
          },
        },
      },
      careServiceLog: true,
    },
  });
  if (!shift) throw new Error("NOT_FOUND");
  if (!shift.checkInTime || !shift.checkOutTime) {
    throw new Error("SHIFT_TELEMETRY_INCOMPLETE");
  }
  if (
    shift.checkInLatPlaceholder == null ||
    shift.checkInLngPlaceholder == null
  ) {
    throw new Error("SHIFT_TELEMETRY_INCOMPLETE");
  }

  const checkOut = extractCheckOutTelemetry(
    shift.careServiceLog?.supportsDelivered,
    shift.accessRequirementsSnapshot
  );

  const checkInHash = hashShiftTelemetry({
    latitude: shift.checkInLatPlaceholder,
    longitude: shift.checkInLngPlaceholder,
    timestamp: shift.checkInTime.toISOString(),
  });
  const telemetryHash = checkOut?.telemetryHash
    ? createHash("sha256")
        .update(`${checkInHash}|${checkOut.telemetryHash}`)
        .digest("hex")
    : checkInHash;

  const pace = await verifyPaceEndorsement(
    shift.participantId,
    shift.organisationId,
    DEFAULT_SUPPORT_CATEGORY
  );

  const pricing = mapShiftToNdisLineItem({
    startAt: shift.startAt,
    endAt: shift.endAt,
    tasks: shift.tasks,
    serviceStartAt: shift.checkInTime,
    serviceEndAt: shift.checkOutTime,
  });

  const decryptedNdis = shift.participant.participantProfile
    ?.ndisParticipantNumberEnc
    ? decryptNdisNumber(
        shift.participant.participantProfile.ndisParticipantNumberEnc
      )
    : null;

  const payload: PaceClaimPayload = {
    registrationNumber:
      shift.organisation.ndisRegistrationNumber ??
      shift.organisation.abn ??
      null,
    ndisNumber: pace.profile.ndisNumber ?? decryptedNdis ?? null,
    supportItemNumber: pricing.supportItemNumber,
    serviceStartDate: shift.checkInTime.toISOString(),
    serviceEndDate: shift.checkOutTime.toISOString(),
    quantityHours: pricing.quantityHours,
    unitPrice: pricing.unitPriceAUD,
    totalClaimAmount: pricing.totalAmountAUD,
    authorityCeiling: "DRAFT_ONLY",
    requiresHumanConfirmation: true,
    liveSubmit: false,
    timeBand: pricing.timeBand,
    intensity: pricing.intensity,
  };

  const payloadHash = createHash("sha256")
    .update(JSON.stringify(payload))
    .digest("hex");
  const claimId = createHash("sha256")
    .update(`${shift.id}|${payloadHash}|${telemetryHash}`)
    .digest("hex")
    .slice(0, 32);

  const warnings = [...pace.warnings];
  if (checkOut && !checkOut.geofenceWithinRadius) {
    warnings.push("Check-out was outside the geofence radius of check-in.");
  }
  warnings.push(
    "DRAFT_ONLY scaffold — not submitted to NDIA PACE. Human confirmation required."
  );

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "ndis.pace_claim.draft_generated",
    entityType: "CareShift",
    entityId: shift.id,
    participantId: shift.participantId,
    organisationId: shift.organisationId,
    metadata: {
      claimId,
      telemetryHash,
      payloadHash,
      supportItemNumber: payload.supportItemNumber,
      totalClaimAmount: payload.totalClaimAmount,
      liveSubmit: false,
      authorityCeiling: "DRAFT_ONLY",
    },
  });

  return {
    claimId,
    payload,
    pricing,
    telemetryHash,
    payloadHash,
    paceStatus: pace.status,
    warnings,
  };
}

export async function getPaceShiftPreview(shiftId: string) {
  const shift = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: {
      careServiceLog: true,
      participant: {
        select: {
          id: true,
          name: true,
          participantProfile: {
            select: { ndisParticipantNumberEnc: true },
          },
        },
      },
      organisation: {
        select: {
          id: true,
          name: true,
          ndisRegistrationNumber: true,
          abn: true,
        },
      },
    },
  });
  if (!shift) throw new Error("NOT_FOUND");

  const pace = await verifyPaceEndorsement(
    shift.participantId,
    shift.organisationId,
    DEFAULT_SUPPORT_CATEGORY
  );

  const checkOut = extractCheckOutTelemetry(
    shift.careServiceLog?.supportsDelivered,
    shift.accessRequirementsSnapshot
  );

  const pricingPreview =
    shift.checkInTime && shift.checkOutTime
      ? mapShiftToNdisLineItem({
          startAt: shift.startAt,
          endAt: shift.endAt,
          tasks: shift.tasks,
          serviceStartAt: shift.checkInTime,
          serviceEndAt: shift.checkOutTime,
        })
      : null;

  return {
    shift: {
      id: shift.id,
      status: shift.status,
      startAt: shift.startAt.toISOString(),
      endAt: shift.endAt.toISOString(),
      checkInTime: shift.checkInTime?.toISOString() ?? null,
      checkOutTime: shift.checkOutTime?.toISOString() ?? null,
      checkInLat: shift.checkInLatPlaceholder,
      checkInLng: shift.checkInLngPlaceholder,
      participantName: shift.participant.name,
      organisationName: shift.organisation.name,
    },
    pace,
    telemetry: {
      checkIn:
        shift.checkInLatPlaceholder != null &&
        shift.checkInLngPlaceholder != null
          ? {
              latitude: shift.checkInLatPlaceholder,
              longitude: shift.checkInLngPlaceholder,
              timestamp: shift.checkInTime?.toISOString() ?? null,
            }
          : null,
      checkOut: checkOut
        ? {
            latitude: checkOut.latitude,
            longitude: checkOut.longitude,
            timestamp: checkOut.timestamp,
            accuracyMeters: checkOut.accuracyMeters,
            geofenceWithinRadius: checkOut.geofenceWithinRadius,
            geofenceDistanceMeters: checkOut.geofenceDistanceMeters,
          }
          : null,
    },
    pricingPreview,
    notice:
      "Scaffold / DRAFT_ONLY — not live NDIA PACE submission. Human review required.",
  };
}
