import type { AccessAlertStatus, AccessAlertType } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { recordContribution } from "@/lib/access-contributions/contribution-service";
import { prisma } from "@/lib/prisma";
import type { CreateAccessAlertInput } from "@/lib/validation/access-alert";

const ALERT_RATE_LIMIT_PER_HOUR = 5;
const DEFAULT_EXPIRY_DAYS = 7;

export async function createAccessAlert(params: {
  userId: string;
  input: CreateAccessAlertInput;
}) {
  const recentCount = await prisma.accessAlert.count({
    where: {
      submittedById: params.userId,
      createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) },
    },
  });
  if (recentCount >= ALERT_RATE_LIMIT_PER_HOUR) {
    throw new Error("ALERT_RATE_LIMIT");
  }

  const expiresAt = params.input.expiresAt
    ? new Date(params.input.expiresAt)
    : new Date(Date.now() + DEFAULT_EXPIRY_DAYS * 24 * 60 * 60 * 1000);

  const alert = await prisma.accessAlert.create({
    data: {
      placeId: params.input.placeId,
      reportId: params.input.reportId,
      alertType: params.input.alertType as AccessAlertType,
      title: params.input.title,
      description: params.input.description,
      latitude: params.input.latitude,
      longitude: params.input.longitude,
      submittedById: params.userId,
      expiresAt,
      reviewAt: params.input.reviewAt
        ? new Date(params.input.reviewAt)
        : undefined,
    },
    include: { place: true },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: "access_alert.created",
    entityType: "AccessAlert",
    entityId: alert.id,
  });

  await recordContribution({
    userId: params.userId,
    action: "alert_created",
    entityType: "AccessAlert",
    entityId: alert.id,
  });

  return alert;
}

export async function listActiveAlerts(params?: {
  placeId?: string;
  lat?: number;
  lng?: number;
  radiusKm?: number;
}) {
  const alerts = await prisma.accessAlert.findMany({
    where: {
      status: "active",
      ...(params?.placeId ? { placeId: params.placeId } : {}),
    },
    include: { place: { select: { id: true, name: true } } },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  if (params?.lat != null && params?.lng != null && params.radiusKm) {
    const { distanceKm } = await import("@/lib/geo");
    return alerts.filter((a) => {
      if (a.latitude == null || a.longitude == null) {
        return Boolean(params.placeId);
      }
      const dist = distanceKm(params.lat!, params.lng!, a.latitude, a.longitude);
      return dist <= params.radiusKm!;
    });
  }

  return alerts;
}

export async function updateAccessAlert(params: {
  alertId: string;
  userId: string;
  status?: AccessAlertStatus;
  isModerator?: boolean;
  isVenueOwner?: boolean;
}) {
  const alert = await prisma.accessAlert.findUnique({
    where: { id: params.alertId },
    include: { place: { include: { venueProfile: true } } },
  });
  if (!alert) throw new Error("ALERT_NOT_FOUND");

  const canResolve =
    params.isModerator ||
    params.isVenueOwner ||
    alert.submittedById === params.userId;

  if (params.status === "resolved" && !canResolve) {
    throw new Error("ALERT_FORBIDDEN");
  }

  const updated = await prisma.accessAlert.update({
    where: { id: params.alertId },
    data: {
      status: params.status,
      resolvedAt: params.status === "resolved" ? new Date() : undefined,
      resolvedById: params.status === "resolved" ? params.userId : undefined,
    },
  });

  await createAuditEvent({
    actorUserId: params.userId,
    action: `access_alert.${params.status ?? "updated"}`,
    entityType: "AccessAlert",
    entityId: params.alertId,
  });

  return updated;
}

export async function expireStaleAlerts() {
  const result = await prisma.accessAlert.updateMany({
    where: {
      status: "active",
      expiresAt: { lt: new Date() },
    },
    data: { status: "expired" },
  });
  return result.count;
}

export async function countActiveAlertsForPlace(placeId: string) {
  return prisma.accessAlert.count({
    where: { placeId, status: "active" },
  });
}

export async function addAlertPhoto(params: {
  alertId: string;
  userId: string;
  storagePath: string;
  mimeType: string;
  altText: string;
}) {
  const alert = await prisma.accessAlert.findUnique({
    where: { id: params.alertId },
  });
  if (!alert) throw new Error("ALERT_NOT_FOUND");
  if (alert.submittedById !== params.userId) {
    throw new Error("ALERT_FORBIDDEN");
  }

  const photo = await prisma.accessAlertPhoto.create({
    data: {
      alertId: params.alertId,
      storagePath: params.storagePath,
      mimeType: params.mimeType,
      altText: params.altText,
      status: "pending",
    },
  });

  await prisma.accessModerationQueue.create({
    data: {
      entityType: "AccessAlertPhoto",
      entityId: photo.id,
      flagReason: "Photo pending privacy review",
    },
  });

  return photo;
}
