import { Prisma } from "@prisma/client";

/**
 * Multiply quantity × unit price (cents) with Decimal arithmetic.
 * Returns integer cents (half-up). Never uses floating-point multiplication.
 */
export function multiplyQuantityCents(
  quantity: number | string | Prisma.Decimal,
  unitPriceCents: number
): number {
  if (!Number.isInteger(unitPriceCents)) {
    throw new Error("UNIT_PRICE_MUST_BE_INTEGER_CENTS");
  }
  const product = new Prisma.Decimal(quantity).mul(unitPriceCents);
  return product.toDecimalPlaces(0, Prisma.Decimal.ROUND_HALF_UP).toNumber();
}

/** Assert a cents value is a finite integer greater than zero. */
export function assertPositiveCents(cents: number, label = "amount"): number {
  if (!Number.isInteger(cents) || !Number.isFinite(cents)) {
    throw new Error(`${label.toUpperCase()}_MUST_BE_INTEGER_CENTS`);
  }
  if (cents <= 0) {
    throw new Error(`${label.toUpperCase()}_MUST_BE_POSITIVE`);
  }
  return cents;
}

/** Sum integer cents without float drift. */
export function sumCents(values: readonly number[]): number {
  let total = new Prisma.Decimal(0);
  for (const value of values) {
    if (!Number.isInteger(value)) {
      throw new Error("CENTS_MUST_BE_INTEGER");
    }
    total = total.add(value);
  }
  return total.toNumber();
}

/** Assert non-negative integer cents (zero allowed). */
export function assertNonNegativeCents(cents: number, label = "amount"): number {
  if (!Number.isInteger(cents) || !Number.isFinite(cents)) {
    throw new Error(`${label.toUpperCase()}_MUST_BE_INTEGER_CENTS`);
  }
  if (cents < 0) {
    throw new Error(`${label.toUpperCase()}_MUST_BE_NON_NEGATIVE`);
  }
  return cents;
}
