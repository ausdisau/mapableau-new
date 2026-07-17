/**
 * Wave 11 — Continuity Signal Service.
 *
 * Signals are LEAN inputs (validated, deduped, freshness-aware) that feed the
 * continuity graph. A signal is NOT a decision. Nothing destructive can be
 * driven by a stale, unvalidated, or low-confidence external signal.
 */

import type {
  ContinuitySignal,
  ContinuitySignalConfidence,
  ContinuitySignalKind,
  ContinuitySignalStatus,
} from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { asJson } from "@/lib/prisma-json";

export interface RecordSignalInput {
  kind: ContinuitySignalKind;
  participantId?: string | null;
  organisationId?: string | null;
  sourceKind?: string | null;
  sourceRef?: string | null;
  lifeEventId?: string | null;
  payload?: Record<string, unknown> | null;
  dedupeKey: string;
  observedAt: Date;
  staleAfter?: Date | null;
  confidence?: ContinuitySignalConfidence;
  status?: ContinuitySignalStatus;
}

export const DEFAULT_SIGNAL_FRESHNESS_MINUTES = 60 * 24; // 24h

export function computeDefaultStaleAfter(kind: ContinuitySignalKind, observedAt: Date): Date {
  switch (kind) {
    case "care_shift_cancelled":
    case "transport_booking_cancelled":
    case "reservation_expired":
      return new Date(observedAt.getTime() + 24 * 60 * 60 * 1000);
    case "external_civic_feed":
      return new Date(observedAt.getTime() + 60 * 60 * 1000);
    case "aura_flag":
      return new Date(observedAt.getTime() + 6 * 60 * 60 * 1000);
    default:
      return new Date(observedAt.getTime() + DEFAULT_SIGNAL_FRESHNESS_MINUTES * 60 * 1000);
  }
}

/**
 * Deterministic dedupe. Never uses Date.now(). If the same dedupeKey is
 * recorded again the existing signal id is returned untouched.
 */
export async function recordContinuitySignal(input: RecordSignalInput): Promise<ContinuitySignal> {
  if (!input.dedupeKey || input.dedupeKey.trim().length === 0) {
    throw new Error("SIGNAL_MISSING_DEDUPE_KEY");
  }

  const staleAfter = input.staleAfter ?? computeDefaultStaleAfter(input.kind, input.observedAt);

  const existing = await prisma.continuitySignal.findUnique({
    where: { dedupeKey: input.dedupeKey },
  });
  if (existing) return existing;

  return prisma.continuitySignal.create({
    data: {
      kind: input.kind,
      status: input.status ?? "received",
      confidence: input.confidence ?? "low",
      participantId: input.participantId ?? null,
      organisationId: input.organisationId ?? null,
      sourceKind: input.sourceKind ?? null,
      sourceRef: input.sourceRef ?? null,
      lifeEventId: input.lifeEventId ?? null,
      payloadJson: asJson(input.payload ?? undefined),
      observedAt: input.observedAt,
      dedupeKey: input.dedupeKey,
      staleAfter,
    },
  });
}

export interface ValidateSignalInput {
  signalId: string;
  now?: Date;
  markConfidence?: ContinuitySignalConfidence;
  validatorNarrative?: string;
}

export async function validateSignal(input: ValidateSignalInput): Promise<ContinuitySignal> {
  const now = input.now ?? new Date();
  const signal = await prisma.continuitySignal.findUnique({ where: { id: input.signalId } });
  if (!signal) throw new Error("SIGNAL_NOT_FOUND");
  if (signal.staleAfter && signal.staleAfter.getTime() < now.getTime()) {
    return prisma.continuitySignal.update({
      where: { id: signal.id },
      data: { status: "stale" },
    });
  }
  return prisma.continuitySignal.update({
    where: { id: signal.id },
    data: {
      status: "validated",
      validatedAt: now,
      confidence: input.markConfidence ?? signal.confidence,
    },
  });
}

export function isSignalDestructivelyUsable(signal: ContinuitySignal, now: Date = new Date()): {
  usable: boolean;
  reason?: string;
} {
  if (signal.status === "rejected") return { usable: false, reason: "rejected" };
  if (signal.status === "stale") return { usable: false, reason: "stale" };
  if (signal.staleAfter && signal.staleAfter.getTime() < now.getTime()) {
    return { usable: false, reason: "expired_freshness" };
  }
  if (signal.status !== "validated" && signal.status !== "correlated") {
    return { usable: false, reason: "not_validated" };
  }
  if (signal.confidence === "low") return { usable: false, reason: "low_confidence" };
  return { usable: true };
}

export async function markSignalStaleIfExpired(signalId: string, now: Date = new Date()) {
  const signal = await prisma.continuitySignal.findUnique({ where: { id: signalId } });
  if (!signal) return null;
  if (signal.status === "stale" || signal.status === "rejected") return signal;
  if (!signal.staleAfter) return signal;
  if (signal.staleAfter.getTime() >= now.getTime()) return signal;
  return prisma.continuitySignal.update({
    where: { id: signal.id },
    data: { status: "stale" },
  });
}

export async function listRecentSignalsForParticipant(participantId: string, options: {
  organisationId?: string | null;
  limit?: number;
  kinds?: ContinuitySignalKind[];
} = {}) {
  return prisma.continuitySignal.findMany({
    where: {
      participantId,
      ...(options.organisationId ? { organisationId: options.organisationId } : {}),
      ...(options.kinds && options.kinds.length > 0 ? { kind: { in: options.kinds } } : {}),
    },
    orderBy: [{ observedAt: "desc" }, { id: "desc" }],
    take: Math.min(Math.max(options.limit ?? 50, 1), 200),
  });
}
