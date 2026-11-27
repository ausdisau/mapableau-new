import { describe, expect, it, vi } from "vitest";

vi.mock("@/lib/payouts/config", () => ({
  paymentsMode: () => "test",
}));

vi.mock("@/lib/prisma", () => ({
  prisma: {},
}));

import {
  assertLivemodeMatches,
  StripeLivemodeMismatchError,
} from "@/lib/billing/core/webhook-handler";

describe("assertLivemodeMatches", () => {
  it("rejects live/test mismatch instead of warning", () => {
    expect(() =>
      assertLivemodeMatches({
        id: "evt_live",
        livemode: true,
      } as never),
    ).toThrow(StripeLivemodeMismatchError);
  });

  it("allows matching test mode", () => {
    expect(() =>
      assertLivemodeMatches({
        id: "evt_test",
        livemode: false,
      } as never),
    ).not.toThrow();
  });
});
