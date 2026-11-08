/**
 * Placement API money helpers — integer minor units (cents).
 * Distinct from auction/wallet micros in lib/ads/money/micros.ts.
 */

import { centsToMicros, microsToCentsFloor, type AdsMicros } from "@/lib/ads/money/micros";

export type AmountMinor = number;

export function assertAmountMinor(value: number, label = "amountMinor"): AmountMinor {
  if (!Number.isInteger(value) || value < 0) {
    throw new Error(`${label} must be a non-negative integer`);
  }
  return value;
}

export function minorToMicros(amountMinor: AmountMinor): AdsMicros {
  return centsToMicros(assertAmountMinor(amountMinor));
}

export function microsToMinorFloor(micros: AdsMicros): AmountMinor {
  return microsToCentsFloor(micros);
}

export function formatAudMinor(amountMinor: AmountMinor): string {
  assertAmountMinor(amountMinor);
  const dollars = Math.floor(amountMinor / 100);
  const cents = (amountMinor % 100).toString().padStart(2, "0");
  return `A$${dollars}.${cents}`;
}
