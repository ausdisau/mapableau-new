import { Prisma } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { mapShiftToNdisLineItem } from "@/lib/billing/ndis-pricing-engine";
import { recordBookingTimelineEvent } from "@/lib/bookings/timeline-service";
import { syncCalendarForCareShift } from "@/lib/calendar/calendar-service";
import {
  hashShiftTelemetry,
  resolveTelemetryTimestamp,
  type PaceCheckOutTelemetryEntry,
  type ShiftTelemetry,
} from "@/lib/care/shift-telemetry-schemas";
import { distanceKm } from "@/lib/geo";
import {
  isPaceTelemetryClaimingEnabled,
  PACE_GEOFENCE_RADIUS_METERS,
} from "@/lib/ndis/pace-config";
import { verifyPaceEndorsement } from "@/lib/ndis/pace-service";
import { prisma } from "@/lib/prisma";

const DEFAULT_SUPPORT_CATEGORY = "0001";

export async function createCareShiftFromRequest(params: {
  careRequestId: string;
  organisationId: string;
  startAt: Date;
  endAt: Date;
  location?: string;
  workerProfileId?: string;
  careBookingId?: string;
  createdById: string;
  recurringScheduleId?: string;
  occurrenceDate?: Date;
}) {
  const request = await prisma.careRequest.findUnique({
    where: { id: params.careRequestId },
  });
  if (!request) throw new Error("NOT_FOUND");

  const shift = await prisma.careShift.create({
    data: {
      careRequestId: params.careRequestId,
      careBookingId: params.careBookingId,
      bookingId: request.bookingId,
      participantId: request.participantId,
      organisationId: params.organisationId,
      workerProfileId: params.workerProfileId,
      startAt: params.startAt,
      endAt: params.endAt,
      location: params.location ?? request.address,
      tasks: request.tasks ?? [],
      accessRequirementsSnapshot: request.accessRequirementsSummary
        ? { summary: request.accessRequirementsSummary }
        : {},
      status: params.workerProfileId ? "worker_assigned" : "scheduled",
      recurringScheduleId: params.recurringScheduleId,
      occurrenceDate: params.occurrenceDate,
    },
  });

  await syncCalendarForCareShift(shift, params.createdById);
  await createAuditEvent({
    actorUserId: params.createdById,
    action: "care_shift.created",
    entityType: "CareShift",
    entityId: shift.id,
    participantId: shift.participantId,
  });

  return shift;
}

export async function careShiftCheckIn(
  shiftId: string,
  actorUserId: string,
  telemetry?: ShiftTelemetry
) {
  if (!isPaceTelemetryClaimingEnabled() || !telemetry) {
    const shift = await prisma.careShift.update({
      where: { id: shiftId },
      data: { status: "checked_in", checkInTime: new Date() },
    });
    await createAuditEvent({
      actorUserId,
      action: "care_shift.check_in",
      entityType: "CareShift",
      entityId: shiftId,
      participantId: shift.participantId,
    });
    return { shift, pace: null as null };
  }

  const existing = await prisma.careShift.findUnique({
    where: { id: shiftId },
    include: { workerProfile: true },
  });
  if (!existing) throw new Error("NOT_FOUND");

  if (!existing.workerProfileId || !existing.workerProfile) {
    throw new Error("WORKER_REQUIRED");
  }
  if (existing.workerProfile.workerScreeningStatus !== "verified") {
    throw new Error("WORKER_SCREENING_REQUIRED");
  }

  const pace = await verifyPaceEndorsement(
    existing.participantId,
    existing.organisationId,
    DEFAULT_SUPPORT_CATEGORY
  );
  if (!pace.authorized) {
    const err = new Error("PACE_ENDORSEMENT_REQUIRED") as Error & {
      pace: typeof pace;
    };
    err.pace = pace;
    throw err;
  }

  const checkInTime = resolveTelemetryTimestamp(telemetry.timestamp);
  const telemetryHash = hashShiftTelemetry({
    latitude: telemetry.latitude,
    longitude: telemetry.longitude,
    timestamp: checkInTime.toISOString(),
  });

  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: {
      status: "checked_in",
      checkInTime,
      checkInLatPlaceholder: telemetry.latitude,
      checkInLngPlaceholder: telemetry.longitude,
    },
  });

  await createAuditEvent({
    actorUserId,
    action: "care_shift.check_in_telemetry",
    entityType: "CareShift",
    entityId: shiftId,
    participantId: shift.participantId,
    organisationId: shift.organisationId,
    metadata: {
      accuracyMeters: telemetry.accuracyMeters,
      telemetryHash,
      paceStatus: pace.status,
    },
  });

  return { shift, pace };
}

export type CareShiftCheckOutResult = {
  shift: Awaited<ReturnType<typeof prisma.careShift.update>>;
  geofence: {
    distanceMeters: number;
    withinRadius: boolean;
    radiusMeters: number;
  } | null;
  pricingPreview: ReturnType<typeof mapShiftToNdisLineItem> | null;
  warnings: string[];
  checkOutTelemetryHash: string | null;
};

export async function careShiftCheckOut(
  shiftId: string,
  actorUserId: string,
  telemetry?: ShiftTelemetry
): Promise<CareShiftCheckOutResult> {
  if (!isPaceTelemetryClaimingEnabled() || !telemetry) {
    const shift = await prisma.careShift.update({
      where: { id: shiftId },
      data: {
        status: "awaiting_participant_approval",
        checkOutTime: new Date(),
      },
    });

    if (shift.careBookingId) {
      const { ensureServiceLogDraftForShift } = await import(
        "@/lib/care/care-service-log-service"
      );
      await ensureServiceLogDraftForShift(shift.id, actorUserId);
    }

    await createAuditEvent({
      actorUserId,
      action: "care_shift.check_out",
      entityType: "CareShift",
      entityId: shiftId,
      participantId: shift.participantId,
    });
    return {
      shift,
      geofence: null,
      pricingPreview: null,
      warnings: [],
      checkOutTelemetryHash: null,
    };
  }

  const existing = await prisma.careShift.findUnique({
    where: { id: shiftId },
  });
  if (!existing) throw new Error("NOT_FOUND");
  if (
    existing.checkInLatPlaceholder == null ||
    existing.checkInLngPlaceholder == null ||
    !existing.checkInTime
  ) {
    throw new Error("CHECK_IN_TELEMETRY_REQUIRED");
  }

  const checkOutTime = resolveTelemetryTimestamp(telemetry.timestamp);
  const durationMinutes = Math.max(
    0,
    Math.round(
      (checkOutTime.getTime() - existing.checkInTime.getTime()) / 60_000
    )
  );
  const distanceMeters =
    distanceKm(
      existing.checkInLatPlaceholder,
      existing.checkInLngPlaceholder,
      telemetry.latitude,
      telemetry.longitude
    ) * 1000;
  const withinRadius = distanceMeters <= PACE_GEOFENCE_RADIUS_METERS;
  const warnings: string[] = [];
  if (!withinRadius) {
    warnings.push(
      `Check-out is ${Math.round(distanceMeters)}m from check-in (geofence ${PACE_GEOFENCE_RADIUS_METERS}m). Review before claiming.`
    );
  }

  const telemetryHash = hashShiftTelemetry({
    latitude: telemetry.latitude,
    longitude: telemetry.longitude,
    timestamp: checkOutTime.toISOString(),
  });

  const checkOutEntry: PaceCheckOutTelemetryEntry = {
    kind: "pace_telemetry_check_out",
    latitude: telemetry.latitude,
    longitude: telemetry.longitude,
    accuracyMeters: telemetry.accuracyMeters,
    timestamp: checkOutTime.toISOString(),
    durationMinutes,
    geofenceDistanceMeters: Math.round(distanceMeters * 100) / 100,
    geofenceWithinRadius: withinRadius,
    telemetryHash,
  };

  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: {
      status: "awaiting_participant_approval",
      checkOutTime,
    },
  });

  if (shift.careBookingId) {
    const { ensureServiceLogDraftForShift } = await import(
      "@/lib/care/care-service-log-service"
    );
    const log = await ensureServiceLogDraftForShift(shift.id, actorUserId);
    if (log) {
      const delivered = Array.isArray(log.supportsDelivered)
        ? [...(log.supportsDelivered as unknown[])]
        : [];
      const withoutPrior = delivered.filter(
        (item) =>
          !(
            item &&
            typeof item === "object" &&
            (item as { kind?: string }).kind === "pace_telemetry_check_out"
          )
      );
      withoutPrior.push(checkOutEntry);
      await prisma.careServiceLog.update({
        where: { id: log.id },
        data: {
          supportsDelivered: withoutPrior as object[],
          durationMinutes,
        },
      });
    }
  } else {
    // No booking: stash check-out telemetry on accessRequirementsSnapshot namespace
    const snapshot: Prisma.InputJsonObject = {
      ...(existing.accessRequirementsSnapshot &&
      typeof existing.accessRequirementsSnapshot === "object" &&
      !Array.isArray(existing.accessRequirementsSnapshot)
        ? (existing.accessRequirementsSnapshot as Prisma.InputJsonObject)
        : {}),
      paceCheckOutTelemetry: checkOutEntry as unknown as Prisma.InputJsonValue,
    };
    await prisma.careShift.update({
      where: { id: shiftId },
      data: { accessRequirementsSnapshot: snapshot },
    });
  }

  const pricingPreview = mapShiftToNdisLineItem({
    startAt: existing.startAt,
    endAt: existing.endAt,
    tasks: existing.tasks,
    serviceStartAt: existing.checkInTime,
    serviceEndAt: checkOutTime,
  });

  await createAuditEvent({
    actorUserId,
    action: "care_shift.check_out_telemetry",
    entityType: "CareShift",
    entityId: shiftId,
    participantId: shift.participantId,
    organisationId: shift.organisationId,
    metadata: {
      accuracyMeters: telemetry.accuracyMeters,
      telemetryHash,
      durationMinutes,
      geofenceDistanceMeters: checkOutEntry.geofenceDistanceMeters,
      geofenceWithinRadius: withinRadius,
      supportItemNumber: pricingPreview.supportItemNumber,
    },
  });

  return {
    shift,
    geofence: {
      distanceMeters: checkOutEntry.geofenceDistanceMeters,
      withinRadius,
      radiusMeters: PACE_GEOFENCE_RADIUS_METERS,
    },
    pricingPreview,
    warnings,
    checkOutTelemetryHash: telemetryHash,
  };
}

export async function approveCareShift(shiftId: string, participantId: string) {
  const shift = await prisma.careShift.update({
    where: { id: shiftId },
    data: {
      status: "approved",
      participantApprovalStatus: "approved",
      approvedById: participantId,
      approvedAt: new Date(),
    },
  });

  await createAuditEvent({
    actorUserId: participantId,
    action: "care_shift.approved",
    entityType: "CareShift",
    entityId: shiftId,
    participantId: shift.participantId,
  });

  if (shift.bookingId) {
    await recordBookingTimelineEvent({
      bookingId: shift.bookingId,
      eventType: "booking_completed",
      title: "Care shift approved by participant",
      actorUserId: participantId,
    });
  }

  return shift;
}
