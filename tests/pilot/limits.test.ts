import { Prisma } from "@prisma/client";
import { describe, expect, it } from "vitest";

import { multiplyQuantityCents } from "@/lib/ndis-gateway/billing/money";
import {
  assertWithinTransactionLimit,
  computeReservationBalances,
} from "@/lib/pilot/limits/limit-policy";

describe("pilot limits integer cents", () => {
  it("reservation math reserve/commit/release", () => {
    const afterReserve = computeReservationBalances({
      reservedCents: 0,
      committedCents: 0,
      amountCents: 1500,
      action: "reserve",
    });
    expect(afterReserve).toEqual({ reservedCents: 1500, committedCents: 0 });

    const afterCommit = computeReservationBalances({
      reservedCents: 1500,
      committedCents: 0,
      amountCents: 1500,
      action: "commit",
    });
    expect(afterCommit).toEqual({ reservedCents: 0, committedCents: 1500 });

    const afterRelease = computeReservationBalances({
      reservedCents: 1500,
      committedCents: 200,
      amountCents: 500,
      action: "release",
    });
    expect(afterRelease).toEqual({ reservedCents: 1000, committedCents: 200 });
  });

  it("uses Decimal-safe quantity × cents without float drift", () => {
    expect(multiplyQuantityCents(new Prisma.Decimal("1.5"), 3333)).toBe(5000);
    expect(multiplyQuantityCents("2.25", 400)).toBe(900);
  });

  it("zero max transaction denies", () => {
    expect(() => assertWithinTransactionLimit(0, 100)).toThrow(
      /MAX_TRANSACTION_CENTS_ZERO_DENY/
    );
  });
});
