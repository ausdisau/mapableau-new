import type { Prisma } from "@prisma/client";

import { NAVIGATOR_AUDIT } from "@/lib/ai/navigator/gates";
import { rematchAfterPassportCorrection } from "@/lib/ai/navigator/passport/rematch";
import {
  hardConstraintsSchema,
  passportCreateSchema,
  passportInterpretationSchema,
  rankingWeightsSchema,
  shortlistSchema,
  type DecisionPassportView,
  type HardConstraint,
  type PassportInterpretation,
  type RankingWeights,
  type ShortlistItem,
} from "@/lib/ai/navigator/passport/types";
import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { isNavigatorPassportEnabled } from "@/lib/config/navigator-pilot";
import { prisma } from "@/lib/prisma";

type PassportRow = {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  sessionId: string;
  goalSummary: string;
  interpretationJson: Prisma.JsonValue;
  hardConstraintsJson: Prisma.JsonValue;
  rankingWeightsJson: Prisma.JsonValue;
  sourcesJson: Prisma.JsonValue;
  shortlistJson: Prisma.JsonValue;
  uncertaintyNotes: string[];
  limitationsNotes: string[];
  conflictsOfInterest: string[];
  aiInvolved: boolean;
  modelIndependentRules: string[];
  nextStep: string | null;
  nextStepController: string;
  consentedPurpose: string;
  consentRecordId: string | null;
  aiOptedOut: boolean;
  status: string;
  correlationId: string;
  createdAt: Date;
  updatedAt: Date;
};

function asObject(value: Prisma.JsonValue): Record<string, unknown> {
  if (value && typeof value === "object" && !Array.isArray(value)) {
    return value as Record<string, unknown>;
  }
  return {};
}

function asArray(value: Prisma.JsonValue): unknown[] {
  return Array.isArray(value) ? value : [];
}

function parseInterpretation(value: Prisma.JsonValue): PassportInterpretation {
  const parsed = passportInterpretationSchema.safeParse(asObject(value));
  return parsed.success ? parsed.data : {};
}

function parseHardConstraints(value: Prisma.JsonValue): HardConstraint[] {
  const parsed = hardConstraintsSchema.safeParse(asArray(value));
  return parsed.success ? parsed.data : [];
}

function parseRankingWeights(value: Prisma.JsonValue): RankingWeights {
  const parsed = rankingWeightsSchema.safeParse(asObject(value));
  return parsed.success ? parsed.data : {};
}

function parseShortlist(value: Prisma.JsonValue): ShortlistItem[] {
  const parsed = shortlistSchema.safeParse(asArray(value));
  return parsed.success ? parsed.data : [];
}

function parseSources(
  value: Prisma.JsonValue,
): Array<{ id?: string; label: string; kind?: string }> {
  const sources: Array<{ id?: string; label: string; kind?: string }> = [];
  for (const item of asArray(value)) {
    if (!item || typeof item !== "object" || Array.isArray(item)) continue;
    const row = item as Record<string, unknown>;
    if (typeof row.label !== "string" || !row.label.trim()) continue;
    sources.push({
      id: typeof row.id === "string" ? row.id : undefined,
      label: row.label,
      kind: typeof row.kind === "string" ? row.kind : undefined,
    });
  }
  return sources;
}

/** Project a participant-facing Decision Passport view (no chain-of-thought). */
export function projectDecisionPassport(row: PassportRow): DecisionPassportView {
  return {
    id: row.id,
    tenantId: row.tenantId,
    participantId: row.participantId,
    sessionId: row.sessionId,
    status: row.status,
    goal: row.goalSummary,
    interpretation: parseInterpretation(row.interpretationJson),
    hardConstraints: parseHardConstraints(row.hardConstraintsJson),
    rankingWeights: parseRankingWeights(row.rankingWeightsJson),
    sources: parseSources(row.sourcesJson),
    shortlist: parseShortlist(row.shortlistJson),
    uncertaintyNotes: row.uncertaintyNotes,
    limitationsNotes: row.limitationsNotes,
    conflictsOfInterest: row.conflictsOfInterest,
    aiInvolved: row.aiInvolved,
    aiOptedOut: row.aiOptedOut,
    modelIndependentRules: row.modelIndependentRules,
    nextStep: row.nextStep,
    nextStepController: row.nextStepController,
    consentedPurpose: row.consentedPurpose,
    routes: {
      correct: `/api/navigator/pilot/passport/${row.id}`,
      reject: `/api/navigator/pilot/passport/${row.id}`,
      optOut: `/api/navigator/pilot/opt-out`,
      humanHelp: `/api/navigator/pilot/escalate`,
      continueWithoutAi: "/provider-finder",
    },
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export async function createDecisionPassport(
  rawInput: unknown,
): Promise<DecisionPassportView> {
  if (!isNavigatorPassportEnabled()) {
    throw new Error("NAVIGATOR_PASSPORT_DISABLED");
  }

  const input = passportCreateSchema.parse(rawInput);

  const row = await prisma.navigatorDecisionPassport.create({
    data: {
      tenantId: input.tenantId,
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      sessionId: input.sessionId,
      goalSummary: input.goalSummary,
      interpretationJson: input.interpretation as Prisma.InputJsonValue,
      hardConstraintsJson: input.hardConstraints as Prisma.InputJsonValue,
      rankingWeightsJson: input.rankingWeights as Prisma.InputJsonValue,
      sourcesJson: input.sources as Prisma.InputJsonValue,
      shortlistJson: input.shortlist as Prisma.InputJsonValue,
      uncertaintyNotes: input.uncertaintyNotes,
      limitationsNotes: input.limitationsNotes,
      conflictsOfInterest: input.conflictsOfInterest,
      aiInvolved: input.aiInvolved,
      modelIndependentRules: input.modelIndependentRules,
      nextStep: input.nextStep ?? null,
      nextStepController: input.nextStepController,
      consentedPurpose: input.consentedPurpose,
      consentRecordId: input.consentRecordId ?? null,
      status: "active",
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.passportCreated,
    entityType: "NavigatorDecisionPassport",
    entityId: row.id,
    metadata: {
      tenantId: input.tenantId,
      sessionId: input.sessionId,
      aiInvolved: input.aiInvolved,
    },
  });

  return projectDecisionPassport(row as PassportRow);
}

/** Tenant + participant scoped get — prevents IDOR. */
export async function getDecisionPassport(input: {
  id: string;
  tenantId: string;
  participantId: string;
}): Promise<DecisionPassportView | null> {
  const row = await prisma.navigatorDecisionPassport.findFirst({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
    },
  });
  return row ? projectDecisionPassport(row as PassportRow) : null;
}

export async function correctDecisionPassport(input: {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  interpretation?: PassportInterpretation;
  hardConstraints?: HardConstraint[];
  rankingWeights?: RankingWeights;
  note?: string;
  /** When false, skip rematch even if matching is enabled. Default true. */
  rematch?: boolean;
  silent?: boolean;
}): Promise<DecisionPassportView> {
  if (!isNavigatorPassportEnabled()) {
    throw new Error("NAVIGATOR_PASSPORT_DISABLED");
  }

  const existing = await prisma.navigatorDecisionPassport.findFirst({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
    },
  });
  if (!existing) {
    throw new Error("NAVIGATOR_PASSPORT_NOT_FOUND");
  }

  if (existing.aiOptedOut) {
    throw new Error("NAVIGATOR_PASSPORT_AI_OPTED_OUT");
  }

  const nextInterpretation = passportInterpretationSchema.parse({
    ...parseInterpretation(existing.interpretationJson),
    ...(input.interpretation ?? {}),
    correctionNote: input.note ?? input.interpretation?.correctionNote,
  });
  const nextConstraints = input.hardConstraints
    ? hardConstraintsSchema.parse(input.hardConstraints)
    : parseHardConstraints(existing.hardConstraintsJson);
  const nextWeights = input.rankingWeights
    ? rankingWeightsSchema.parse(input.rankingWeights)
    : parseRankingWeights(existing.rankingWeightsJson);

  let nextShortlist = parseShortlist(existing.shortlistJson);
  let nextLimitations = existing.limitationsNotes;
  let nextStep = existing.nextStep;

  const shouldRematch = input.rematch !== false;
  if (shouldRematch) {
    const match = await rematchAfterPassportCorrection({
      tenantId: input.tenantId,
      participantId: input.participantId,
      actorUserId: input.actorUserId,
      hardConstraints: nextConstraints,
      rankingWeights: nextWeights,
      query:
        nextInterpretation.summary ??
        nextInterpretation.serviceType ??
        existing.goalSummary,
      silent: input.silent,
    });
    if (match) {
      nextShortlist = match.shortlist.map((entry) => ({
        id: entry.provider.id,
        label: entry.provider.name,
        factors: entry.materialFactors,
        score: entry.score,
      }));
      nextLimitations = match.limitations;
      nextStep =
        match.status === "NO_SAFE_MATCH"
          ? "No safe match after correction — refine constraints or request human help"
          : "Review updated shortlist after your correction";
    }
  }

  const row = await prisma.navigatorDecisionPassport.update({
    where: { id: existing.id },
    data: {
      interpretationJson: nextInterpretation as Prisma.InputJsonValue,
      hardConstraintsJson: nextConstraints as Prisma.InputJsonValue,
      rankingWeightsJson: nextWeights as Prisma.InputJsonValue,
      shortlistJson: nextShortlist as Prisma.InputJsonValue,
      limitationsNotes: nextLimitations,
      nextStep,
      status: "corrected",
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.passportCorrected,
    entityType: "NavigatorDecisionPassport",
    entityId: row.id,
    metadata: {
      tenantId: input.tenantId,
      note: input.note ?? null,
      rematched: shouldRematch,
      shortlistCount: nextShortlist.length,
    },
  });

  return projectDecisionPassport(row as PassportRow);
}

export async function challengeDecisionPassport(input: {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  note?: string;
}): Promise<DecisionPassportView> {
  if (!isNavigatorPassportEnabled()) {
    throw new Error("NAVIGATOR_PASSPORT_DISABLED");
  }

  const existing = await prisma.navigatorDecisionPassport.findFirst({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
    },
  });
  if (!existing) {
    throw new Error("NAVIGATOR_PASSPORT_NOT_FOUND");
  }

  const nextInterpretation = passportInterpretationSchema.parse({
    ...parseInterpretation(existing.interpretationJson),
    challenged: true,
    challengeNote: input.note ?? "Participant challenged this decision.",
  });

  const row = await prisma.navigatorDecisionPassport.update({
    where: { id: existing.id },
    data: {
      interpretationJson: nextInterpretation as Prisma.InputJsonValue,
      status: "challenged",
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.passportChallenged,
    entityType: "NavigatorDecisionPassport",
    entityId: row.id,
    metadata: {
      tenantId: input.tenantId,
      note: input.note ?? null,
    },
  });

  return projectDecisionPassport(row as PassportRow);
}

export async function rejectSuggestion(input: {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
  shortlistItemId?: string;
  reason?: string;
}): Promise<DecisionPassportView> {
  if (!isNavigatorPassportEnabled()) {
    throw new Error("NAVIGATOR_PASSPORT_DISABLED");
  }

  const existing = await prisma.navigatorDecisionPassport.findFirst({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
    },
  });
  if (!existing) {
    throw new Error("NAVIGATOR_PASSPORT_NOT_FOUND");
  }

  const shortlist = parseShortlist(existing.shortlistJson);
  const reason = input.reason ?? "rejected_by_participant";

  let nextShortlist: ShortlistItem[];
  let status: string;

  if (input.shortlistItemId) {
    const found = shortlist.some((item) => item.id === input.shortlistItemId);
    if (!found) {
      throw new Error("NAVIGATOR_PASSPORT_SHORTLIST_ITEM_NOT_FOUND");
    }
    nextShortlist = shortlist.map((item) =>
      item.id === input.shortlistItemId
        ? { ...item, rejected: true, rejectReason: reason }
        : item,
    );
    status = existing.status === "active" ? "active" : existing.status;
  } else {
    nextShortlist = shortlist.map((item) => ({
      ...item,
      rejected: true,
      rejectReason: reason,
    }));
    status = "rejected";
  }

  const row = await prisma.navigatorDecisionPassport.update({
    where: { id: existing.id },
    data: {
      shortlistJson: nextShortlist as Prisma.InputJsonValue,
      status,
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.passportSuggestionRejected,
    entityType: "NavigatorDecisionPassport",
    entityId: row.id,
    metadata: {
      tenantId: input.tenantId,
      shortlistItemId: input.shortlistItemId ?? null,
      wholeShortlist: !input.shortlistItemId,
      reason,
    },
  });

  return projectDecisionPassport(row as PassportRow);
}

export async function setAiOptOut(input: {
  id: string;
  tenantId: string;
  participantId: string;
  actorUserId: string;
}): Promise<DecisionPassportView> {
  if (!isNavigatorPassportEnabled()) {
    throw new Error("NAVIGATOR_PASSPORT_DISABLED");
  }

  const existing = await prisma.navigatorDecisionPassport.findFirst({
    where: {
      id: input.id,
      tenantId: input.tenantId,
      participantId: input.participantId,
    },
  });
  if (!existing) {
    throw new Error("NAVIGATOR_PASSPORT_NOT_FOUND");
  }

  const row = await prisma.navigatorDecisionPassport.update({
    where: { id: existing.id },
    data: {
      aiOptedOut: true,
      // Passport is retained for audit / continuity — never deleted on opt-out.
    },
  });

  await createAuditEvent({
    actorUserId: input.actorUserId,
    participantId: input.participantId,
    action: NAVIGATOR_AUDIT.passportAiOptOut,
    entityType: "NavigatorDecisionPassport",
    entityId: row.id,
    metadata: { tenantId: input.tenantId, retained: true },
  });

  return projectDecisionPassport(row as PassportRow);
}

/**
 * True when any retained passport for this tenant/participant (optionally
 * session) has aiOptedOut. Server-side honour — clients cannot bypass by
 * omitting aiOptedOut on the search body.
 */
export async function hasActiveAiOptOut(input: {
  tenantId: string;
  participantId: string;
  sessionId?: string;
}): Promise<boolean> {
  if (!isNavigatorPassportEnabled()) {
    return false;
  }
  const row = await prisma.navigatorDecisionPassport.findFirst({
    where: {
      tenantId: input.tenantId,
      participantId: input.participantId,
      aiOptedOut: true,
      ...(input.sessionId ? { sessionId: input.sessionId } : {}),
    },
    select: { id: true, aiOptedOut: true },
  });
  // Require the flag on the row — mocked findFirst callers that ignore `where`
  // must still return aiOptedOut: true to count as an opt-out.
  return row?.aiOptedOut === true;
}
