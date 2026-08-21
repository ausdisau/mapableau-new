/**
 * MapAble Ads money helpers — AUD micros only within the Ads domain.
 * 1 AUD = 1_000_000 micros; 1 cent = 10_000 micros.
 * Never use JavaScript floating-point for ledger accounting.
 */

export const ADS_CURRENCY = "AUD" as const;
export const MICROS_PER_AUD = 1_000_000n;
export const MICROS_PER_CENT = 10_000n;

export type AdsMicros = bigint;

export function assertMicros(value: bigint, label = "amount"): AdsMicros {
  if (typeof value !== "bigint") {
    throw new Error(`${label} must be bigint micros`);
  }
  return value;
}

export function centsToMicros(cents: number): AdsMicros {
  if (!Number.isInteger(cents)) {
    throw new Error("cents must be an integer");
  }
  return BigInt(cents) * MICROS_PER_CENT;
}

export function microsToCentsFloor(micros: AdsMicros): number {
  assertMicros(micros);
  return Number(micros / MICROS_PER_CENT);
}

/** Format micros as A$ string without floating intermediate for display. */
export function formatAudMicros(micros: AdsMicros): string {
  assertMicros(micros);
  const negative = micros < 0n;
  const abs = negative ? -micros : micros;
  const dollars = abs / MICROS_PER_AUD;
  const remainder = abs % MICROS_PER_AUD;
  // two decimal places from micros: remainder / 10_000 = cents portion
  const cents = remainder / MICROS_PER_CENT;
  const frac = cents.toString().padStart(2, "0");
  const body = `A$${dollars.toString()}.${frac}`;
  return negative ? `-${body}` : body;
}

/** Serialize bigint for JSON API clients. */
export function microsToString(micros: AdsMicros): string {
  return assertMicros(micros).toString();
}

export function parseMicrosString(value: string): AdsMicros {
  if (!/^-?\d+$/.test(value)) {
    throw new Error("invalid micros string");
  }
  return BigInt(value);
}

/**
 * Charge for one viewable impression at a CPM (micros per 1000 impressions).
 * charge = clearingCpm / 1000
 */
export function cpmChargePerImpression(clearingCpmMicros: AdsMicros): AdsMicros {
  assertMicros(clearingCpmMicros);
  if (clearingCpmMicros < 0n) {
    throw new Error("clearing CPM cannot be negative");
  }
  return clearingCpmMicros / 1000n;
}

/**
 * Integer multiply-divide with half-up rounding for non-negative values.
 * result = round(a * b / denom)
 */
export function mulDivRound(a: AdsMicros, b: bigint, denom: bigint): AdsMicros {
  if (denom <= 0n) throw new Error("denom must be positive");
  if (a < 0n || b < 0n) throw new Error("mulDivRound expects non-negative");
  const product = a * b;
  return (product + denom / 2n) / denom;
}
