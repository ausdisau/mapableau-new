import type { AccessAlertType } from "@prisma/client";

import { recordContribution } from "@/lib/access-badges/contribution-service";
import { prisma } from "@/lib/prisma";

const DEFAULT_EXPIRY_DAYS: Record<AccessAlertType, number> = {
  broken_lift: 7,
  blocked_ramp: 7,
  inaccessible_toilet: 14,
  construction_barrier: 30,
  inaccessible_transport_stop: 14,
  temporary_closure: 30,
  crowding_risk: 3,
  sensory_overload: 3,
  urgent_hazard: 7,
  other: 14,
};

export async function createAccessAlert(params: {
  placeId?: string;
  alertType: AccessAlertType;
  title: string;
  description?: string;
  latitude?: number;
  longitude?: number;
  expiresAt?: Date;
  reportedById: string;
  sourceReviewId?: string;
}) {
  const expiresAt =
    params.expiresAt ??
    new Date(
      Date.now() +
        DEFAULT_EXPIRY_DAYS[params.alertType] * 24 * 60 * 60 * 1000
    );

  const alert = await prisma.accessAlert.create({
    data: {
      placeId: params.placeId,
      alertType: params.alertType,
      title: params.title,
      description: params.description,
      latitude: params.latitude,
      longitude: params.longitude,
      expiresAt,
      reportedById: params.reportedById,
      sourceReviewId: params.sourceReviewId,
      status: "active",
      confidence: "user_reported",
    },
  });

  await recordContribution({
    userId: params.reportedById,
    action: "alert_created",
    entityType: "AccessAlert",
    entityId: alert.id,
  });

  return alert;
}

export async function listActiveAlertsForPlace(placeId: string) {
  const now = new Date();
  return prisma.accessAlert.findMany({
    where: {
      placeId,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { createdAt: "desc" },
  });
}

export async function resolveAccessAlert(params: {
  alertId: string;
  resolvedById: string;
}) {
  return prisma.accessAlert.update({
    where: { id: params.alertId },
    data: {
      status: "resolved",
      resolvedById: params.resolvedById,
      resolvedAt: new Date(),
    },
  });
}

export async function expireStaleAlerts() {
  const now = new Date();
  await prisma.accessAlert.updateMany({
    where: {
      status: "active",
      expiresAt: { lt: now },
    },
    data: { status: "expired" },
  });
}
