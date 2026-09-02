/**
 * Deterministic temporal helpers for Mission Watch.
 * Reuses Prompt 03 recovery temporal utilities for deadline/approval arithmetic.
 * Australia/Sydney is the default mission-local timezone. No LLM date calculations.
 */

import {
  approvalExpired,
  computeTemporalConstraint,
  minutesUntilDeadline,
  type TemporalConstraint,
} from "@/lib/ai/platform/recovery/temporal";

export const DEFAULT_MISSION_TIMEZONE = "Australia/Sydney";

export {
  approvalExpired,
  computeTemporalConstraint,
  minutesUntilDeadline,
  type TemporalConstraint,
};

export function zonedLocalToUtc(input: {
  year: number;
  month: number;
  day: number;
  hour: number;
  minute: number;
  second?: number;
  timeZone: string;
}): Date {
  const second = input.second ?? 0;
  const asUtcGuess = Date.UTC(
    input.year,
    input.month - 1,
    input.day,
    input.hour,
    input.minute,
    second,
  );
  const offsetMs = getTimeZoneOffsetMs(new Date(asUtcGuess), input.timeZone);
  return new Date(asUtcGuess - offsetMs);
}

export function getTimeZoneOffsetMs(date: Date, timeZone: string): number {
  const dtf = new Intl.DateTimeFormat("en-US", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
  const parts = dtf.formatToParts(date);
  const map: Record<string, string> = {};
  for (const p of parts) {
    if (p.type !== "literal") map[p.type] = p.value;
  }
  const asLocal = Date.UTC(
    Number(map.year),
    Number(map.month) - 1,
    Number(map.day),
    Number(map.hour === "24" ? "0" : map.hour),
    Number(map.minute),
    Number(map.second),
  );
  return asLocal - date.getTime();
}

export function formatInTimeZone(iso: string, timeZone: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(iso));
}

export function isPastIso(iso: string, referenceTime: Date): boolean {
  return new Date(iso).getTime() <= referenceTime.getTime();
}

export function addMinutesIso(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

export function evidenceIsStale(input: {
  observedAt: string | null | undefined;
  maxAgeMinutes: number;
  referenceTime: Date;
}): boolean {
  if (!input.observedAt) return true;
  const age =
    (input.referenceTime.getTime() - new Date(input.observedAt).getTime()) / 60_000;
  return age > input.maxAgeMinutes;
}

export function deadlineWarnWindowOpen(input: {
  deadlineIso: string;
  warnBeforeMinutes: number;
  referenceTime: Date;
}): boolean {
  const mins = minutesUntilDeadline(input.deadlineIso, input.referenceTime);
  return mins <= input.warnBeforeMinutes && mins >= 0;
}

export function nextEvaluationFromTrigger(
  triggerAt: string | null,
  referenceTime: Date,
): string | null {
  if (!triggerAt) return null;
  if (new Date(triggerAt).getTime() <= referenceTime.getTime()) {
    return referenceTime.toISOString();
  }
  return triggerAt;
}
