/**
 * Store timestamps in UTC; present in Australia/Sydney (DST-aware).
 */

const SYDNEY = "Australia/Sydney";

export function toUnixSeconds(date: Date): number {
  return Math.floor(date.getTime() / 1000);
}

export function formatSydney(date: Date): string {
  return new Intl.DateTimeFormat("en-AU", {
    timeZone: SYDNEY,
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

/** Detect whether start/end span a Sydney DST transition (length ≠ wall-clock expectation). */
export function spansSydneyDstTransition(start: Date, end: Date): boolean {
  const startOffset = offsetMinutesInSydney(start);
  const endOffset = offsetMinutesInSydney(end);
  return startOffset !== endOffset;
}

function offsetMinutesInSydney(date: Date): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: SYDNEY,
    timeZoneName: "shortOffset",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const tz = parts.find((p) => p.type === "timeZoneName")?.value ?? "GMT+10";
  const match = tz.match(/GMT([+-])(\d{1,2})(?::(\d{2}))?/i);
  if (!match) return 600;
  const sign = match[1] === "-" ? -1 : 1;
  const hours = Number(match[2] ?? 0);
  const mins = Number(match[3] ?? 0);
  return sign * (hours * 60 + mins);
}

export const SYDNEY_TZ = SYDNEY;
