/**
 * Deterministic virtual clock for Replay Lab.
 * Production code must never use this clock accidentally — inject explicitly.
 */

export type VirtualClockOptions = {
  /** ISO-8601 instant for virtual t0. */
  start: string;
  /** IANA timezone for local scheduling (default Australia/Sydney). */
  timeZone?: string;
  /** Acceleration multiplier when running (1 = real-time virtual). */
  acceleration?: number;
};

export type ScheduledVirtualEvent = {
  id: string;
  atMs: number;
  label: string;
  recurringIntervalMs?: number;
  payload?: Record<string, unknown>;
};

export type VirtualClock = {
  readonly timeZone: string;
  readonly startIso: string;
  nowMs(): number;
  nowIso(): string;
  isPaused(): boolean;
  pause(): void;
  resume(): void;
  setAcceleration(factor: number): void;
  getAcceleration(): number;
  /** Advance by delta virtual milliseconds (respects pause). */
  advance(deltaMs: number): void;
  /** Jump absolute virtual epoch ms. */
  jumpToMs(targetMs: number): void;
  /** Schedule a one-shot or recurring event at absolute virtual ms. */
  schedule(event: ScheduledVirtualEvent): void;
  /** Step to the next scheduled event; returns it or null. */
  step(): ScheduledVirtualEvent | null;
  listScheduled(): ScheduledVirtualEvent[];
  /** Local wall-clock string HH:mm in the clock timezone for a virtual instant. */
  formatLocalTime(isoOrMs?: string | number): string;
  /** Next business day start (Mon–Fri) after the given virtual instant. */
  nextBusinessDayStart(fromMs?: number): number;
  /** Snapshot for rewind reconstruction (clock position only). */
  snapshot(): { nowMs: number; paused: boolean; acceleration: number };
  restore(snap: { nowMs: number; paused: boolean; acceleration: number }): void;
};

function parseStartMs(start: string): number {
  const ms = Date.parse(start);
  if (Number.isNaN(ms)) {
    throw new Error(`Invalid virtual clock start: ${start}`);
  }
  return ms;
}

/**
 * Format HH:mm in a timezone using Intl — deterministic for a fixed instant.
 */
function formatInTimeZone(ms: number, timeZone: string): string {
  const fmt = new Intl.DateTimeFormat("en-AU", {
    timeZone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
  const parts = fmt.formatToParts(new Date(ms));
  const hour = parts.find((p) => p.type === "hour")?.value ?? "00";
  const minute = parts.find((p) => p.type === "minute")?.value ?? "00";
  return `${hour.padStart(2, "0")}:${minute.padStart(2, "0")}`;
}

function weekdayInTimeZone(ms: number, timeZone: string): number {
  const fmt = new Intl.DateTimeFormat("en-US", {
    timeZone,
    weekday: "short",
  });
  const day = fmt.format(new Date(ms));
  const map: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return map[day] ?? 0;
}

export function createVirtualClock(options: VirtualClockOptions): VirtualClock {
  const timeZone = options.timeZone ?? "Australia/Sydney";
  const startMs = parseStartMs(options.start);
  let nowMs = startMs;
  let paused = false;
  let acceleration = options.acceleration ?? 1;
  const scheduled: ScheduledVirtualEvent[] = [];

  const sortScheduled = () => {
    scheduled.sort((a, b) => a.atMs - b.atMs || a.id.localeCompare(b.id));
  };

  return {
    timeZone,
    startIso: new Date(startMs).toISOString(),
    nowMs: () => nowMs,
    nowIso: () => new Date(nowMs).toISOString(),
    isPaused: () => paused,
    pause() {
      paused = true;
    },
    resume() {
      paused = false;
    },
    setAcceleration(factor: number) {
      if (factor <= 0) throw new Error("acceleration must be > 0");
      acceleration = factor;
    },
    getAcceleration: () => acceleration,
    advance(deltaMs: number) {
      if (paused) return;
      if (deltaMs < 0) throw new Error("advance does not rewind; use restore/jump");
      nowMs += Math.floor(deltaMs * acceleration);
    },
    jumpToMs(targetMs: number) {
      nowMs = targetMs;
    },
    schedule(event: ScheduledVirtualEvent) {
      scheduled.push({ ...event });
      sortScheduled();
    },
    step() {
      sortScheduled();
      const next = scheduled.find((e) => e.atMs >= nowMs) ?? scheduled[0] ?? null;
      if (!next) return null;
      // Prefer the soonest event at or after now; if all are past, take earliest remaining.
      const upcoming = scheduled.filter((e) => e.atMs >= nowMs);
      const chosen = upcoming[0] ?? scheduled[0]!;
      nowMs = chosen.atMs;
      const idx = scheduled.findIndex((e) => e.id === chosen.id && e.atMs === chosen.atMs);
      if (idx >= 0) scheduled.splice(idx, 1);
      if (chosen.recurringIntervalMs && chosen.recurringIntervalMs > 0) {
        scheduled.push({
          ...chosen,
          atMs: chosen.atMs + chosen.recurringIntervalMs,
        });
        sortScheduled();
      }
      return chosen;
    },
    listScheduled() {
      sortScheduled();
      return scheduled.map((e) => ({ ...e }));
    },
    formatLocalTime(isoOrMs?: string | number) {
      const ms =
        isoOrMs === undefined
          ? nowMs
          : typeof isoOrMs === "number"
            ? isoOrMs
            : Date.parse(isoOrMs);
      if (Number.isNaN(ms)) throw new Error("Invalid time for formatLocalTime");
      return formatInTimeZone(ms, timeZone);
    },
    nextBusinessDayStart(fromMs?: number) {
      const base = fromMs ?? nowMs;
      // Advance calendar days in 24h steps until Mon–Fri in the zone.
      let cursor = base + 24 * 60 * 60 * 1000;
      for (let i = 0; i < 10; i++) {
        const wd = weekdayInTimeZone(cursor, timeZone);
        if (wd >= 1 && wd <= 5) {
          // Align to local midnight approximately via iterative format — use UTC noon shift.
          const local = formatInTimeZone(cursor, timeZone);
          // Strip time to start-of-day by subtracting hours/minutes from local reading.
          const [hh, mm] = local.split(":").map(Number);
          const start = cursor - ((hh ?? 0) * 3600 + (mm ?? 0) * 60) * 1000;
          return start;
        }
        cursor += 24 * 60 * 60 * 1000;
      }
      return cursor;
    },
    snapshot() {
      return { nowMs, paused, acceleration };
    },
    restore(snap) {
      nowMs = snap.nowMs;
      paused = snap.paused;
      acceleration = snap.acceleration;
    },
  };
}

/**
 * Resolve a scenario local time "HH:mm" on the clock's start calendar day in its timezone.
 * Uses binary-search-friendly hourly scan then minute refine (DST-safe).
 */
export function resolveLocalTimeOnStartDay(
  clock: VirtualClock,
  hhmm: string,
): number {
  const match = /^(\d{2}):(\d{2})$/.exec(hhmm);
  if (!match) throw new Error(`Invalid local time: ${hhmm}`);
  const target = `${String(Number(match[1])).padStart(2, "0")}:${String(Number(match[2])).padStart(2, "0")}`;
  const start = Date.parse(clock.startIso);

  // Coarse scan by hour across ±36h, then refine by minute within the matching hour.
  for (let hourOffset = -36; hourOffset <= 36; hourOffset++) {
    const hourStart = start + hourOffset * 3600 * 1000;
    const localAtHour = clock.formatLocalTime(hourStart);
    const localHour = Number(localAtHour.slice(0, 2));
    const targetHour = Number(match[1]);
    if (localHour !== targetHour && (localHour + 1) % 24 !== targetHour && localHour !== (targetHour + 23) % 24) {
      continue;
    }
    for (let minute = 0; minute < 60; minute++) {
      // Probe a window around this hour for DST shifts.
      for (const skew of [0, -3600_000, 3600_000]) {
        const candidate = hourStart + minute * 60_000 + skew;
        if (clock.formatLocalTime(candidate) === target) {
          return candidate;
        }
      }
    }
  }

  // Fallback exhaustive minute scan (rare).
  for (let offset = -36 * 3600 * 1000; offset <= 36 * 3600 * 1000; offset += 60 * 1000) {
    const candidate = start + offset;
    if (clock.formatLocalTime(candidate) === target) return candidate;
  }
  throw new Error(`Could not resolve local time ${hhmm} near ${clock.startIso}`);
}
