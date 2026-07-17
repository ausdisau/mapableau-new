import type { Prisma, QsDeadlineInstanceStatus } from "@prisma/client";

import { prisma } from "@/lib/prisma";

import type { DeadlineDuration, DeadlineRuleDefinition } from "./types";

/** Default AU public holidays (stub — extend per jurisdiction/org). */
export const DEFAULT_AU_HOLIDAYS_ISO: readonly string[] = [
  "2026-01-01",
  "2026-01-26",
  "2026-04-03",
  "2026-04-06",
  "2026-04-25",
  "2026-06-08",
  "2026-12-25",
  "2026-12-26",
  "2027-01-01",
  "2027-01-26",
];

export function toDateKey(date: Date, timeZone = "Australia/Sydney"): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(date);
}

export function isWeekend(date: Date, timeZone = "Australia/Sydney"): boolean {
  const weekday = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  }).format(date);
  return weekday === "Sat" || weekday === "Sun";
}

export function isHoliday(
  date: Date,
  holidays: readonly string[] = DEFAULT_AU_HOLIDAYS_ISO,
  timeZone = "Australia/Sydney"
): boolean {
  return holidays.includes(toDateKey(date, timeZone));
}

export function isBusinessDay(
  date: Date,
  holidays: readonly string[] = DEFAULT_AU_HOLIDAYS_ISO,
  timeZone = "Australia/Sydney"
): boolean {
  return !isWeekend(date, timeZone) && !isHoliday(date, holidays, timeZone);
}

/** Add calendar days (preserves time-of-day). */
export function addCalendarDays(from: Date, days: number): Date {
  const result = new Date(from);
  result.setDate(result.getDate() + days);
  return result;
}

/** Add hours. */
export function addHours(from: Date, hours: number): Date {
  return new Date(from.getTime() + hours * 60 * 60 * 1000);
}

/**
 * Add business days skipping weekends and configured holidays.
 * Advances by whole calendar days until `days` business days are counted.
 */
export function addBusinessDays(
  from: Date,
  days: number,
  holidays: readonly string[] = DEFAULT_AU_HOLIDAYS_ISO,
  timeZone = "Australia/Sydney"
): Date {
  if (days <= 0) return new Date(from);
  const result = new Date(from);
  let added = 0;
  while (added < days) {
    result.setDate(result.getDate() + 1);
    if (isBusinessDay(result, holidays, timeZone)) {
      added += 1;
    }
  }
  return result;
}

export function computeDeadlineDueAt(
  from: Date,
  duration: DeadlineDuration,
  options?: {
    holidays?: readonly string[];
    timeZone?: string;
  }
): Date {
  const holidays = options?.holidays ?? DEFAULT_AU_HOLIDAYS_ISO;
  const timeZone = options?.timeZone ?? "Australia/Sydney";

  switch (duration.kind) {
    case "hours":
      return addHours(from, duration.value);
    case "calendarDays":
      return addCalendarDays(from, duration.value);
    case "businessDays":
      return addBusinessDays(from, duration.value, holidays, timeZone);
    default: {
      const _exhaustive: never = duration.kind;
      throw new Error(`Unknown duration kind: ${_exhaustive}`);
    }
  }
}

export const BUILTIN_DEADLINE_RULES: DeadlineRuleDefinition[] = [
  {
    code: "complaint_acknowledgement",
    version: "2026-07",
    triggerEvent: "complaint.received",
    duration: { kind: "businessDays", value: 2 },
    jurisdiction: "AU",
    priority: "high",
    escalationPath: ["complaints_officer", "quality_officer"],
    sourceReference: "NDIS Practice Standards — complaints management",
    effectiveFrom: "2026-07-01T00:00:00.000Z",
  },
  {
    code: "reportable_incident_24h",
    version: "2026-07",
    triggerEvent: "incident.awareness",
    duration: { kind: "hours", value: 24 },
    jurisdiction: "AU",
    priority: "critical",
    escalationPath: ["incident_manager", "safeguarding_lead", "executive"],
    sourceReference: "NDIS reportable incidents — 24 hour notification",
    effectiveFrom: "2026-07-01T00:00:00.000Z",
  },
  {
    code: "unauthorised_rp_5bd",
    version: "2026-07",
    triggerEvent: "restrictive_practice.unauthorised",
    duration: { kind: "businessDays", value: 5 },
    jurisdiction: "AU",
    priority: "critical",
    escalationPath: ["behaviour_support_lead", "safeguarding_lead"],
    sourceReference:
      "NDIS reportable incidents — unauthorised restrictive practice (no immediate harm)",
    effectiveFrom: "2026-07-01T00:00:00.000Z",
  },
  {
    code: "credential_expiry_warning_7d",
    version: "2026-07",
    triggerEvent: "credential.expiring",
    duration: { kind: "calendarDays", value: 7 },
    jurisdiction: "AU",
    priority: "high",
    escalationPath: ["hr_credential_officer"],
    sourceReference: "Worker credential renewal advisory",
    effectiveFrom: "2026-07-01T00:00:00.000Z",
  },
];

export function classifyDeadlineStatus(
  dueAt: Date,
  now: Date = new Date(),
  dueSoonHours = 48
): QsDeadlineInstanceStatus {
  if (dueAt.getTime() < now.getTime()) return "overdue";
  const msUntil = dueAt.getTime() - now.getTime();
  if (msUntil <= dueSoonHours * 60 * 60 * 1000) return "due_soon";
  return "pending";
}

export async function ensureBuiltinDeadlineRules(): Promise<void> {
  for (const rule of BUILTIN_DEADLINE_RULES) {
    await prisma.qsDeadlineRule.upsert({
      where: {
        code_version: { code: rule.code, version: rule.version },
      },
      create: {
        code: rule.code,
        version: rule.version,
        triggerEvent: rule.triggerEvent,
        conditionsJson: [],
        durationKind: rule.duration.kind,
        durationValue: rule.duration.value,
        jurisdiction: rule.jurisdiction,
        priority: rule.priority,
        escalationPath: rule.escalationPath,
        sourceReference: rule.sourceReference,
        effectiveFrom: new Date(rule.effectiveFrom),
        effectiveTo: rule.effectiveTo ? new Date(rule.effectiveTo) : null,
        active: true,
      },
      update: {
        triggerEvent: rule.triggerEvent,
        durationKind: rule.duration.kind,
        durationValue: rule.duration.value,
        priority: rule.priority,
        escalationPath: rule.escalationPath,
        sourceReference: rule.sourceReference,
        active: true,
      },
    });
  }
}

export async function createDeadlineInstance(params: {
  organisationId?: string | null;
  ruleCode: string;
  ruleVersion: string;
  resourceType: string;
  resourceId: string;
  triggerEvent: string;
  triggeredAt: Date;
  timezone?: string;
  correlationId?: string;
  metadata?: Record<string, unknown>;
  holidays?: readonly string[];
}) {
  const rule =
    BUILTIN_DEADLINE_RULES.find(
      (r) => r.code === params.ruleCode && r.version === params.ruleVersion
    ) ?? null;

  const duration: DeadlineDuration = rule?.duration ?? {
    kind: "businessDays",
    value: 2,
  };

  const timezone = params.timezone ?? "Australia/Sydney";
  const dueAt = computeDeadlineDueAt(params.triggeredAt, duration, {
    holidays: params.holidays,
    timeZone: timezone,
  });

  const dbRule = await prisma.qsDeadlineRule.findUnique({
    where: {
      code_version: {
        code: params.ruleCode,
        version: params.ruleVersion,
      },
    },
  });

  return prisma.qsDeadlineInstance.create({
    data: {
      organisationId: params.organisationId ?? null,
      ruleId: dbRule?.id ?? null,
      ruleCode: params.ruleCode,
      ruleVersion: params.ruleVersion,
      resourceType: params.resourceType,
      resourceId: params.resourceId,
      triggerEvent: params.triggerEvent,
      timezone,
      dueAt,
      status: classifyDeadlineStatus(dueAt),
      correlationId: params.correlationId,
      metadataJson: (params.metadata ?? {}) as Prisma.InputJsonValue,
    },
  });
}

export async function listApproachingDeadlines(params?: {
  organisationId?: string | null;
  limit?: number;
}) {
  const now = new Date();
  const horizon = addHours(now, 72);
  return prisma.qsDeadlineInstance.findMany({
    where: {
      status: { in: ["pending", "due_soon", "overdue"] },
      dueAt: { lte: horizon },
      ...(params?.organisationId
        ? { organisationId: params.organisationId }
        : {}),
    },
    orderBy: { dueAt: "asc" },
    take: params?.limit ?? 50,
  });
}
