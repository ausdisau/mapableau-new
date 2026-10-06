type ZonedCalendarParts = {
  year: number;
  month: number;
  day: number;
};

function zonedParts(date: Date, timeZone: string): ZonedCalendarParts & {
  hour: number;
  minute: number;
  second: number;
} {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hourCycle: "h23",
  }).formatToParts(date);

  const values = new Map(
    parts
      .filter((part) => part.type !== "literal")
      .map((part) => [part.type, Number(part.value)]),
  );

  return {
    year: values.get("year") ?? 0,
    month: values.get("month") ?? 0,
    day: values.get("day") ?? 0,
    hour: values.get("hour") ?? 0,
    minute: values.get("minute") ?? 0,
    second: values.get("second") ?? 0,
  };
}

function timeZoneOffsetMs(date: Date, timeZone: string): number {
  const local = zonedParts(date, timeZone);
  const localAsUtc = Date.UTC(
    local.year,
    local.month - 1,
    local.day,
    local.hour,
    local.minute,
    local.second,
  );
  return localAsUtc - date.getTime();
}

function zonedMidnightToUtc(
  parts: ZonedCalendarParts,
  timeZone: string,
): Date {
  const localMidnightAsUtc = Date.UTC(
    parts.year,
    parts.month - 1,
    parts.day,
    0,
    0,
    0,
  );

  // Iterate because the UTC guess and local midnight can sit on opposite sides
  // of a daylight-saving transition.
  let utcMillis = localMidnightAsUtc;
  for (let i = 0; i < 4; i += 1) {
    const offset = timeZoneOffsetMs(new Date(utcMillis), timeZone);
    const next = localMidnightAsUtc - offset;
    if (next === utcMillis) break;
    utcMillis = next;
  }

  return new Date(utcMillis);
}

function addCalendarDays(
  parts: ZonedCalendarParts,
  days: number,
): ZonedCalendarParts {
  const date = new Date(
    Date.UTC(parts.year, parts.month - 1, parts.day + days),
  );
  return {
    year: date.getUTCFullYear(),
    month: date.getUTCMonth() + 1,
    day: date.getUTCDate(),
  };
}

export function getZonedHour(date: Date, timeZone: string): number {
  return zonedParts(date, timeZone).hour;
}

export function getZonedDayBoundsUtc(
  referenceTime: Date,
  timeZone: string,
): {
  start: Date;
  endExclusive: Date;
} {
  const local = zonedParts(referenceTime, timeZone);
  const today = {
    year: local.year,
    month: local.month,
    day: local.day,
  };
  const tomorrow = addCalendarDays(today, 1);

  return {
    start: zonedMidnightToUtc(today, timeZone),
    endExclusive: zonedMidnightToUtc(tomorrow, timeZone),
  };
}
