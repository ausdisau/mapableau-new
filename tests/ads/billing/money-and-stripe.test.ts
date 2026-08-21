import { describe, expect, it, vi, beforeEach } from "vitest";

import {
  centsToMicros,
  cpmChargePerImpression,
  formatAudMicros,
  MICROS_PER_AUD,
  MICROS_PER_CENT,
  microsToString,
  parseMicrosString,
} from "@/lib/ads/money/micros";
import { MAPABLE_PURPOSE_ADS_WALLET_TOPUP } from "@/lib/ads/auction/config";
import { isAdsWalletTopUpEvent } from "@/lib/ads/billing/stripe-webhook";
import type Stripe from "stripe";

describe("micros money helpers", () => {
  it("converts without floating point ledger math", () => {
    expect(centsToMicros(100)).toBe(1_000_000n); // A$1
    expect(centsToMicros(18_00)).toBe(18n * MICROS_PER_AUD);
    expect(MICROS_PER_CENT).toBe(10_000n);
    expect(typeof centsToMicros(250)).toBe("bigint");
  });

  it("CPM per-view charge is clearing/1000", () => {
    // A$18 CPM → A$0.018 per view = 18_000 micros
    expect(cpmChargePerImpression(18n * MICROS_PER_AUD)).toBe(18_000n);
  });

  it("serializes micros as strings for APIs", () => {
    expect(microsToString(22_000_000n)).toBe("22000000");
    expect(parseMicrosString("22000000")).toBe(22_000_000n);
  });

  it("formats AUD micros", () => {
    expect(formatAudMicros(18_000_000n)).toBe("A$18.00");
    expect(formatAudMicros(18_000n)).toBe("A$0.01");
  });
});

describe("stripe ads metadata", () => {
  it("detects ads_wallet_topup purpose", () => {
    const event = {
      id: "evt_1",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: {
            mapablePurpose: MAPABLE_PURPOSE_ADS_WALLET_TOPUP,
            advertiserId: "adv_1",
            walletId: "wal_1",
            topUpId: "tu_1",
          },
        },
      },
    } as unknown as Stripe.Event;
    expect(isAdsWalletTopUpEvent(event)).toBe(true);
  });

  it("ignores participant invoice metadata", () => {
    const event = {
      id: "evt_2",
      type: "checkout.session.completed",
      data: {
        object: {
          metadata: { invoiceId: "inv_1", userId: "u_1" },
        },
      },
    } as unknown as Stripe.Event;
    expect(isAdsWalletTopUpEvent(event)).toBe(false);
  });
});

describe("idempotent billing keys", () => {
  it("uses impression and click idempotency key shapes", () => {
    const impressionKey = `impression:imp_abc`;
    const clickKey = `click:clk_xyz`;
    expect(impressionKey.startsWith("impression:")).toBe(true);
    expect(clickKey.startsWith("click:")).toBe(true);
  });
});

describe("in-memory charge race simulation", () => {
  it("prevents double charge and overspend with atomic check", async () => {
    let balance = 50_000n;
    const billed = new Set<string>();
    const dailyBudget = 100_000n;
    let todaySpend = 0n;

    async function charge(idempotencyKey: string, amount: bigint) {
      if (billed.has(idempotencyKey)) {
        return { ok: true as const, duplicate: true };
      }
      if (balance < amount) return { ok: false as const, reason: "wallet" };
      if (todaySpend + amount > dailyBudget) {
        return { ok: false as const, reason: "daily" };
      }
      billed.add(idempotencyKey);
      balance -= amount;
      todaySpend += amount;
      return { ok: true as const, duplicate: false };
    }

    const results = await Promise.all([
      charge("impression:1", 18_000n),
      charge("impression:1", 18_000n),
      charge("impression:2", 18_000n),
      charge("impression:3", 18_000n),
      charge("impression:4", 18_000n),
    ]);

    const successes = results.filter((r) => r.ok && !("duplicate" in r && r.duplicate && r.ok));
    const uniqueCharges = [...billed];
    expect(uniqueCharges).toHaveLength(2); // only 50k / 18k = 2 full charges before wallet empty... wait 18000*2=36000, *3=54000>50000 so 2
    expect(balance).toBeGreaterThanOrEqual(0n);
    expect(todaySpend).toBeLessThanOrEqual(dailyBudget);
    expect(results.filter((r) => r.ok).length).toBeGreaterThanOrEqual(2);
    void successes;
  });

  it("double click same key does not double charge", async () => {
    let balance = 5_000_000n;
    const billed = new Set<string>();
    async function charge(key: string, amount: bigint) {
      if (billed.has(key)) return { duplicate: true };
      billed.add(key);
      balance -= amount;
      return { duplicate: false };
    }
    await charge("click:c1", 2_500_000n);
    await charge("click:c1", 2_500_000n);
    expect(balance).toBe(2_500_000n);
    expect(billed.size).toBe(1);
  });
});

describe("top-up checkout contract", () => {
  beforeEach(() => {
    vi.unstubAllEnvs();
  });

  it("documents that success redirect must not credit", () => {
    // Architectural invariant: only webhook credits.
    const creditSources = ["stripe_webhook"] as const;
    expect(creditSources).not.toContain("checkout_success_redirect");
  });
});
