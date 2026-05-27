import type { OrgWorkerOption, ParsedShiftQuery } from "@/lib/care/shift-creator/types";

const DAY_NAMES = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
] as const;

const ISO_DATETIME =
  /\d{4}-\d{2}-\d{2}(?:T\d{2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?/;

/** Parses using server local timezone (org TZ can be wired later). */
export function parseShiftQuery(
  query: string,
  workers: OrgWorkerOption[],
  referenceDate: Date = new Date(),
): ParsedShiftQuery {
  const normalized = query.trim();
  const lower = normalized.toLowerCase();
  const warnings: string[] = [];

  const workerMatch = matchWorker(normalized, lower, workers);
  const times = parseTimes(lower, referenceDate);
  const location = parseLocation(normalized);
  const bookingTitleHint = parseBookingTitleHint(lower);

  if (!times.startAt) {
    warnings.push("No start time detected — booking schedule or defaults will be used.");
  }
  if (!workerMatch.workerProfileId && !workerMatch.workerNameHint) {
    warnings.push("No worker named — pick a worker before confirming.");
  }

  return {
    ...workerMatch,
    ...times,
    location,
    bookingTitleHint,
    warnings,
  };
}

function matchWorker(
  query: string,
  lower: string,
  workers: OrgWorkerOption[],
): Pick<ParsedShiftQuery, "workerProfileId" | "workerNameHint"> {
  const cuidMatch = query.match(/\b(cl[a-z0-9]{20,})\b/i);
  if (cuidMatch) {
    const id = cuidMatch[1];
    const exact = workers.find((w) => w.id === id);
    if (exact) {
      return { workerProfileId: exact.id, workerNameHint: exact.displayName };
    }
  }

  const assignMatch = lower.match(
    /\b(?:assign|with|worker)\s+([a-z][a-z\s'-]{1,40})/i,
  );
  const nameHint = assignMatch?.[1]?.trim();

  let best: OrgWorkerOption | undefined;
  if (nameHint) {
    const hintLower = nameHint.toLowerCase();
    best = workers.find((w) => w.displayName.toLowerCase().includes(hintLower));
    if (!best) {
      best = workers.find((w) => hintLower.includes(w.displayName.toLowerCase()));
    }
  }

  if (!best) {
    for (const worker of workers) {
      const nameLower = worker.displayName.toLowerCase();
      if (nameLower.length < 3) continue;
      if (lower.includes(nameLower)) {
        best = worker;
        break;
      }
    }
  }

  if (best) {
    return { workerProfileId: best.id, workerNameHint: best.displayName };
  }

  return nameHint ? { workerNameHint: nameHint } : {};
}

function parseLocation(query: string): string | undefined {
  const atMatch = query.match(/\bat\s+([^,.]+?)(?:\s+on\s+|\s+from\s+|\s+for\s+|$)/i);
  if (atMatch?.[1]) return atMatch[1].trim();

  const locMatch = query.match(/\blocation:\s*([^,.]+)/i);
  if (locMatch?.[1]) return locMatch[1].trim();

  return undefined;
}

function parseBookingTitleHint(lower: string): string | undefined {
  const forMatch = lower.match(/\bfor\s+(?:booking\s+)?["']?([^"'.]+?)["']?(?:\s+on\s+|\s+with\s+|$)/i);
  if (forMatch?.[1] && forMatch[1].length > 3) {
    return forMatch[1].trim();
  }
  return undefined;
}

function parseTimes(
  lower: string,
  referenceDate: Date,
): Pick<ParsedShiftQuery, "startAt" | "endAt"> {
  const isoMatches = lower.match(new RegExp(ISO_DATETIME.source, "gi"));
  if (isoMatches && isoMatches.length >= 1) {
    const startAt = new Date(isoMatches[0]);
    const endAt =
      isoMatches[1] ? new Date(isoMatches[1]) : addHours(startAt, 2);
    if (!Number.isNaN(startAt.getTime())) {
      return { startAt, endAt: Number.isNaN(endAt.getTime()) ? undefined : endAt };
    }
  }

  const base = startOfDay(referenceDate);
  let dayOffset = 0;
  if (/\btomorrow\b/.test(lower)) dayOffset = 1;
  else if (/\btoday\b/.test(lower)) dayOffset = 0;
  else {
    const dayIndex = DAY_NAMES.findIndex((d) => lower.includes(d));
    if (dayIndex >= 0) {
      dayOffset = daysUntilWeekday(referenceDate, dayIndex);
    }
  }

  const targetDay = addDays(base, dayOffset);
  const times = extractClockTimes(lower);
  if (times.length === 0) return {};

  const startAt = applyTime(targetDay, times[0]);
  const endAt =
    times.length > 1 ? applyTime(targetDay, times[1]) : addHours(startAt, 4);

  return { startAt, endAt };
}

type ClockTime = { hours: number; minutes: number };

function extractClockTimes(lower: string): ClockTime[] {
  const results: ClockTime[] = [];
  const pattern =
    /\b(\d{1,2})(?::(\d{2}))?\s*(am|pm)?\b|\b(\d{1,2})\s*(am|pm)\b/gi;
  let match: RegExpExecArray | null;
  while ((match = pattern.exec(lower)) !== null) {
    const h = Number(match[1] ?? match[4]);
    const minutes = Number(match[2] ?? 0);
    const meridiem = (match[3] ?? match[5])?.toLowerCase();
    if (Number.isNaN(h)) continue;
    let hours = h;
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    if (!meridiem && h <= 12 && lower.includes(`${h}pm`)) hours = h === 12 ? 12 : h + 12;
    results.push({ hours, minutes });
  }
  return results;
}

function applyTime(day: Date, time: ClockTime): Date {
  const d = new Date(day);
  d.setHours(time.hours, time.minutes, 0, 0);
  return d;
}

function startOfDay(d: Date): Date {
  const copy = new Date(d);
  copy.setHours(0, 0, 0, 0);
  return copy;
}

function addDays(d: Date, days: number): Date {
  const copy = new Date(d);
  copy.setDate(copy.getDate() + days);
  return copy;
}

function addHours(d: Date, hours: number): Date {
  return new Date(d.getTime() + hours * 60 * 60 * 1000);
}

function daysUntilWeekday(from: Date, targetDayIndex: number): number {
  const current = from.getDay();
  let diff = targetDayIndex - current;
  if (diff <= 0) diff += 7;
  return diff;
}
