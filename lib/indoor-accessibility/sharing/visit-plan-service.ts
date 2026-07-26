import { Prisma } from "@prisma/client";

import { recordIndoorAuditEvent } from "@/lib/indoor-accessibility/audit/indoor-audit-service";
import {
  generateShareToken,
  hashShareToken,
  isShareTokenFormat,
} from "@/lib/indoor-accessibility/verification/correction-service";
import { prisma } from "@/lib/prisma";

export async function createVisitPlan(params: {
  ownerUserId: string;
  placeId: string;
  title?: string;
  scheduledAt?: Date;
  payload: Record<string, unknown>;
  shareScopes?: string[];
}) {
  return prisma.visitPlan.create({
    data: {
      ownerUserId: params.ownerUserId,
      placeId: params.placeId,
      title: params.title,
      scheduledAt: params.scheduledAt,
      payload: params.payload as Prisma.InputJsonValue,
      shareScopes: (params.shareScopes ?? []) as Prisma.InputJsonValue,
    },
  });
}

export async function createVisitPlanShare(params: {
  visitPlanId: string;
  ownerUserId: string;
  scopes: string[];
  expiresInHours?: number;
}) {
  const plan = await prisma.visitPlan.findFirst({
    where: { id: params.visitPlanId, ownerUserId: params.ownerUserId },
  });
  if (!plan) throw new Error("Visit plan not found");

  const token = generateShareToken();
  const tokenHash = hashShareToken(token);
  const expiresAt = new Date(
    Date.now() + (params.expiresInHours ?? 72) * 60 * 60 * 1000,
  );

  const share = await prisma.visitPlanShare.create({
    data: {
      visitPlanId: params.visitPlanId,
      tokenHash,
      scopes: params.scopes,
      expiresAt,
    },
  });

  await recordIndoorAuditEvent({
    action: "visit_plan.shared",
    actorUserId: params.ownerUserId,
    entityType: "VisitPlanShare",
    entityId: share.id,
    placeId: plan.placeId,
    metadata: { scopes: params.scopes },
  });

  return { share, token };
}

export type ResolveVisitPlanShareResult =
  | { plan: Record<string, unknown>; scopes: string[] }
  | { error: "invalid_format" | "not_found" | "revoked" | "expired" };

/**
 * Resolve a shared visit plan by high-entropy token.
 *
 * SECURITY:
 * - Rejects non-64-hex tokens before touching the DB (enumeration resistance).
 * - Active lookup requires `expiresAt > NOW()` and `revokedAt IS NULL`.
 * - Separate expired/revoked probes return typed errors for HTTP 410.
 */
export async function resolveVisitPlanShare(
  token: string,
): Promise<ResolveVisitPlanShareResult> {
  // Fail closed on weak / non-canonical token shapes.
  if (!isShareTokenFormat(token)) {
    return { error: "invalid_format" };
  }

  const tokenHash = hashShareToken(token);
  const now = new Date();

  // Primary query: only non-revoked, non-expired shares (expiresAt > NOW()).
  const active = await prisma.visitPlanShare.findFirst({
    where: {
      tokenHash,
      revokedAt: null,
      expiresAt: { gt: now },
    },
    include: { visitPlan: { include: { place: { select: { name: true } } } } },
  });

  if (active) {
    await prisma.visitPlanShare.update({
      where: { id: active.id },
      data: { accessCount: { increment: 1 } },
    });

    const scopes = active.scopes as string[];
    const payload = active.visitPlan.payload as Record<string, unknown>;
    const filtered: Record<string, unknown> = {
      venueName: active.visitPlan.place.name,
    };
    for (const scope of scopes) {
      if (payload[scope] !== undefined) filtered[scope] = payload[scope];
    }
    return { plan: filtered, scopes };
  }

  // Distinguish expired/revoked from unknown for accurate 410 vs 404.
  const any = await prisma.visitPlanShare.findUnique({
    where: { tokenHash },
    select: { revokedAt: true, expiresAt: true },
  });
  if (!any) return { error: "not_found" };
  if (any.revokedAt) return { error: "revoked" };
  if (any.expiresAt <= now) return { error: "expired" };
  return { error: "not_found" };
}

export async function revokeVisitPlanShare(
  shareId: string,
  ownerUserId: string,
) {
  const share = await prisma.visitPlanShare.findFirst({
    where: { id: shareId, visitPlan: { ownerUserId } },
    include: { visitPlan: true },
  });
  if (!share) throw new Error("Share not found");

  await prisma.visitPlanShare.update({
    where: { id: shareId },
    data: { revokedAt: new Date() },
  });

  await recordIndoorAuditEvent({
    action: "visit_plan.revoked",
    actorUserId: ownerUserId,
    entityType: "VisitPlanShare",
    entityId: shareId,
    placeId: share.visitPlan.placeId,
  });
}
