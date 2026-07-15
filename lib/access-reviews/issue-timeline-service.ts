import type { AccessFeatureAnchor, AccessIssueHistoryState } from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";

export async function recordIssueHistory(params: {
  placeId: string;
  state: AccessIssueHistoryState;
  actorId?: string;
  reviewId?: string;
  commentId?: string;
  alertId?: string;
  note?: string;
  metadata?: Record<string, unknown>;
}) {
  const row = await prisma.accessIssueHistory.create({
    data: {
      placeId: params.placeId,
      state: params.state,
      actorId: params.actorId,
      reviewId: params.reviewId,
      commentId: params.commentId,
      alertId: params.alertId,
      note: params.note,
      metadata: params.metadata as never,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorId,
    action: `accessibility.issue.${params.state}`,
    entityType: "AccessIssueHistory",
    entityId: row.id,
  });

  return row;
}

export async function getIssueTimeline(placeId: string) {
  const rows = await prisma.accessIssueHistory.findMany({
    where: { placeId },
    orderBy: { createdAt: "asc" },
    take: 100,
  });
  return rows.map((r) => ({
    id: r.id,
    state: r.state,
    note: r.note,
    createdAt: r.createdAt.toISOString(),
    reviewId: r.reviewId,
    commentId: r.commentId,
    alertId: r.alertId,
  }));
}

export async function createPlaceAlert(params: {
  placeId: string;
  authorUserId: string;
  title: string;
  body?: string;
  featureKey?: AccessFeatureAnchor;
  observationDate: Date;
  expectedExpiry?: Date;
  sourceType?: string;
}) {
  const alert = await prisma.accessPlaceAlert.create({
    data: {
      placeId: params.placeId,
      authorUserId: params.authorUserId,
      title: params.title,
      body: params.body,
      featureKey: params.featureKey ?? "whole_place",
      observationDate: params.observationDate,
      expectedExpiry: params.expectedExpiry,
      sourceType: params.sourceType ?? "community",
      status: "active",
    },
  });

  await recordIssueHistory({
    placeId: params.placeId,
    alertId: alert.id,
    state: "reported",
    actorId: params.authorUserId,
    note: params.title,
  });

  return alert;
}

export async function expireStaleAlerts(now = new Date()) {
  return prisma.accessPlaceAlert.updateMany({
    where: {
      status: "active",
      expectedExpiry: { lte: now },
    },
    data: { status: "expired" },
  });
}

export async function markAlertOutdated(params: {
  alertId: string;
  actorUserId: string;
}) {
  const alert = await prisma.accessPlaceAlert.update({
    where: { id: params.alertId },
    data: { status: "outdated" },
  });
  await recordIssueHistory({
    placeId: alert.placeId,
    alertId: alert.id,
    state: "outdated",
    actorId: params.actorUserId,
  });
  return alert;
}

export async function confirmAlert(params: {
  alertId: string;
  actorUserId: string;
}) {
  const alert = await prisma.accessPlaceAlert.findUnique({
    where: { id: params.alertId },
  });
  if (!alert) throw new Error("NOT_FOUND");
  await recordIssueHistory({
    placeId: alert.placeId,
    alertId: alert.id,
    state: "confirmed",
    actorId: params.actorUserId,
  });
  return alert;
}
