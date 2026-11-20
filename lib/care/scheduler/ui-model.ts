/**
 * Presentation-only contracts for the MapAble Care & Support Scheduler.
 * Dates in views are Australian/Sydney calendar dates; stored shift instants remain UTC.
 * No worker assignment, funding or verification decisions happen here.
 */
export const CARE_SCHEDULER_TIME_ZONE = "Australia/Sydney";
const DAY_MS = 86_400_000;

export type CareSchedulerRole = "participant" | "provider" | "worker";

export type CareSchedulerEntry = {
  id: string;
  date: string;
  startAt: string;
  endAt: string;
  service: string;
  workerId: string | null;
  workerLabel: string;
  participantLabel: string;
  status: string;
  statusLabel: string;
  attention: boolean;
  href: string;
};

export type CareSchedulerWorker = { id: string; label: string };

export type CareSchedulerData = {
  entries: CareSchedulerEntry[];
  workers: CareSchedulerWorker[];
  truncated: boolean;
};

export function isValidDateOnly(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(value + "T00:00:00.000Z");
  return !Number.isNaN(date.valueOf()) && date.toISOString().slice(0, 10) === value;
}

export function addCalendarDays(dateOnly: string, days: number): string {
  if (!isValidDateOnly(dateOnly) || !Number.isSafeInteger(days)) {
    throw new Error("INVALID_SCHEDULER_DATE");
  }
  const date = new Date(dateOnly + "T00:00:00.000Z");
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

export function sydneyDateKey(date: Date | string): string {
  const instant = typeof date === "string" ? new Date(date) : date;
  if (Number.isNaN(instant.getTime())) throw new Error("INVALID_SCHEDULER_DATE");
  const parts = new Intl.DateTimeFormat("en-AU", {
    timeZone: CARE_SCHEDULER_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(instant);
  const get = (part: string) => parts.find((item) => item.type === part)?.value ?? "";
  return get("year") + "-" + get("month") + "-" + get("day");
}

export function mondayOfWeek(input: string | undefined, now = new Date()): string {
  const day = input && isValidDateOnly(input) ? input : sydneyDateKey(now);
  const anchor = new Date(day + "T00:00:00.000Z");
  const dayOfWeek = anchor.getUTCDay();
  return addCalendarDays(day, -((dayOfWeek + 6) % 7));
}

export function getWeekDates(monday: string): string[] {
  if (!isValidDateOnly(monday)) throw new Error("INVALID_SCHEDULER_DATE");
  return Array.from({ length: 7 }, (_, index) => addCalendarDays(monday, index));
}

export function getReadWindow(monday: string): { from: Date; to: Date } {
  // Query an extra calendar day on either side to safely include Sydney UTC offsets.
  // Final grouping uses sydneyDateKey, not UTC day boundaries.
  const from = new Date(addCalendarDays(monday, -1) + "T00:00:00.000Z");
  const to = new Date(addCalendarDays(monday, 8) + "T00:00:00.000Z");
  return { from, to };
}

export function formatSydneyTime(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Time unavailable";
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: CARE_SCHEDULER_TIME_ZONE,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).format(date);
}

export function formatDateHeading(dateOnly: string): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: "UTC",
    weekday: "short",
    day: "numeric",
    month: "short",
  }).format(new Date(dateOnly + "T12:00:00.000Z"));
}

export function formatStatus(raw: string): string {
  return raw
    .replace(/[_-]/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

export function needsAttention(status: string, assignedWorkerId: string | null): boolean {
  return (
    (status === "scheduled" && !assignedWorkerId) ||
    [
      "cancelled",
      "no_show",
      "disputed",
      "service_recovery_required",
      "awaiting_participant_approval",
      "worker_unassigned",
      "pending_review",
    ].includes(status)
  );
}

export function isCompletedStatus(status: string): boolean {
  return ["completed", "approved", "closed"].includes(status);
}

export function isWithinWeek(sydneyDate: string, monday: string): boolean {
  return sydneyDate >= monday && sydneyDate <= addCalendarDays(monday, 6);
}
