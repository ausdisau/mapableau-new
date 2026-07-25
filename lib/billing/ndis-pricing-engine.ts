import { fromCents, multiplyCents, toCents, type Cents } from "@/lib/billing/money";
import { bookingHasHighIntensityTasks } from "@/lib/care/worker-eligibility";

export type NdisTimeBand =
  | "weekday_daytime"
  | "weekday_evening"
  | "saturday"
  | "sunday"
  | "public_holiday";

export type NdisIntensity = "standard" | "high";

export type MapShiftToNdisLineItemInput = {
  startAt: Date | string;
  endAt: Date | string;
  tasks?: unknown;
  /** Optional override when check-in/out times differ from scheduled window. */
  serviceStartAt?: Date | string;
  serviceEndAt?: Date | string;
};

export type NdisLineItemPricing = {
  supportItemNumber: string;
  timeBand: NdisTimeBand;
  intensity: NdisIntensity;
  quantityHours: number;
  unitPriceAUD: number;
  unitPriceCents: Cents;
  totalAmountAUD: number;
  totalAmountCents: Cents;
  source: "scaffold_rate_table";
};

/**
 * Static AU national public holidays (scaffold calendar for 2025–2026).
 * Not a full jurisdictional set — labelled as scaffold.
 */
const AU_PUBLIC_HOLIDAYS = new Set([
  // 2025
  "2025-01-01",
  "2025-01-27",
  "2025-04-18",
  "2025-04-21",
  "2025-04-25",
  "2025-12-25",
  "2025-12-26",
  // 2026
  "2026-01-01",
  "2026-01-26",
  "2026-04-03",
  "2026-04-06",
  "2026-04-25",
  "2026-12-25",
  "2026-12-26",
]);

/**
 * Scaffold NDIS rate caps (cents). Weekday daytime standard matches seed 6706¢.
 * Other bands are illustrative scaffold caps pending live catalogue lookup.
 */
const RATE_TABLE: Record<
  NdisIntensity,
  Record<NdisTimeBand, { code: string; priceCapCents: number }>
> = {
  standard: {
    weekday_daytime: { code: "01_011_0107_1_1", priceCapCents: 6706 },
    weekday_evening: { code: "01_012_0107_1_1", priceCapCents: 7385 },
    saturday: { code: "01_013_0107_1_1", priceCapCents: 9417 },
    sunday: { code: "01_014_0107_1_1", priceCapCents: 12127 },
    public_holiday: { code: "01_010_0107_1_1", priceCapCents: 14838 },
  },
  high: {
    weekday_daytime: { code: "01_015_0107_1_1", priceCapCents: 7238 },
    weekday_evening: { code: "01_016_0107_1_1", priceCapCents: 7971 },
    saturday: { code: "01_017_0107_1_1", priceCapCents: 10165 },
    sunday: { code: "01_018_0107_1_1", priceCapCents: 13090 },
    public_holiday: { code: "01_019_0107_1_1", priceCapCents: 16015 },
  },
};

function toDate(value: Date | string): Date {
  return value instanceof Date ? value : new Date(value);
}

function sydneyParts(date: Date): {
  ymd: string;
  weekday: number;
  hour: number;
  minute: number;
} {
  const fmt = new Intl.DateTimeFormat("en-AU", {
    timeZone: "Australia/Sydney",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hourCycle: "h23",
    weekday: "short",
  });
  const parts = Object.fromEntries(
    fmt.formatToParts(date).map((p) => [p.type, p.value])
  ) as Record<string, string>;
  const ymd = `${parts.year}-${parts.month}-${parts.day}`;
  const weekdayMap: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };
  return {
    ymd,
    weekday: weekdayMap[parts.weekday] ?? 0,
    hour: Number(parts.hour),
    minute: Number(parts.minute),
  };
}

export function detectNdisTimeBand(at: Date): NdisTimeBand {
  const { ymd, weekday, hour } = sydneyParts(at);
  if (AU_PUBLIC_HOLIDAYS.has(ymd)) return "public_holiday";
  if (weekday === 6) return "saturday";
  if (weekday === 0) return "sunday";
  if (hour >= 20) return "weekday_evening";
  return "weekday_daytime";
}

export function isScaffoldPublicHoliday(ymd: string): boolean {
  return AU_PUBLIC_HOLIDAYS.has(ymd);
}

/**
 * Map shift timing + intensity to an NDIS support item and price-cap total.
 */
export function mapShiftToNdisLineItem(
  shiftDetails: MapShiftToNdisLineItemInput
): NdisLineItemPricing {
  const start = toDate(shiftDetails.serviceStartAt ?? shiftDetails.startAt);
  const end = toDate(shiftDetails.serviceEndAt ?? shiftDetails.endAt);
  if (!Number.isFinite(start.getTime()) || !Number.isFinite(end.getTime())) {
    throw new Error("Invalid shift start/end");
  }
  if (end.getTime() <= start.getTime()) {
    throw new Error("Shift end must be after start");
  }

  const durationMs = end.getTime() - start.getTime();
  const quantityHours = Math.round((durationMs / (1000 * 60 * 60)) * 100) / 100;
  const intensity: NdisIntensity = bookingHasHighIntensityTasks(
    shiftDetails.tasks
  )
    ? "high"
    : "standard";
  const timeBand = detectNdisTimeBand(start);
  const rate = RATE_TABLE[intensity][timeBand];
  const unitPriceCents = rate.priceCapCents;
  const totalAmountCents = multiplyCents(unitPriceCents, quantityHours);

  return {
    supportItemNumber: rate.code,
    timeBand,
    intensity,
    quantityHours,
    unitPriceAUD: fromCents(unitPriceCents),
    unitPriceCents,
    totalAmountAUD: fromCents(totalAmountCents),
    totalAmountCents,
    source: "scaffold_rate_table",
  };
}

/** Exported for tests that need dollar→cents consistency checks. */
export function scaffoldUnitPriceCents(
  intensity: NdisIntensity,
  timeBand: NdisTimeBand
): Cents {
  return toCents(fromCents(RATE_TABLE[intensity][timeBand].priceCapCents));
}
