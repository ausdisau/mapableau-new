/**
 * Wave 11 — Continuity capacity reservations.
 *
 * A reservation HOLDS capacity for a participant without committing.
 * A held reservation may only become `confirmed` via an approved recovery
 * plan step; `expired` is automatic when `windowEnd` is in the past.
 */

import type { ContinuityCapacityReservation, ContinuityReservationStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export interface CreateReservationInput {
  caseId?: string | null;
  organisationId?: string | null;
  resourceKind: string;
  resourceRef: string;
  windowStart: Date;
  windowEnd: Date;
  createdById: string;
  detailsJson?: Record<string, unknown>;
}

export async function createReservation(input: CreateReservationInput): Promise<ContinuityCapacityReservation> {
  if (input.windowEnd.getTime() <= input.windowStart.getTime()) {
    throw new Error("RESERVATION_INVALID_WINDOW");
  }
  return prisma.continuityCapacityReservation.create({
    data: {
      caseId: input.caseId ?? null,
      organisationId: input.organisationId ?? null,
      resourceKind: input.resourceKind,
      resourceRef: input.resourceRef,
      windowStart: input.windowStart,
      windowEnd: input.windowEnd,
      detailsJson: asJson(input.detailsJson ?? undefined),
      createdById: input.createdById,
      status: "held",
    },
  });
}

export async function releaseReservation(id: string, releasedById: string): Promise<ContinuityCapacityReservation> {
  return prisma.continuityCapacityReservation.update({
    where: { id },
    data: { status: "released", releasedById, releasedAt: new Date() },
  });
}

export async function expireOverdueReservations(now: Date = new Date()) {
  return prisma.continuityCapacityReservation.updateMany({
    where: { status: "held", windowEnd: { lt: now } },
    data: { status: "expired" },
  });
}
