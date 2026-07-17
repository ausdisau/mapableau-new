import { describe, expect, it } from "vitest";

import { selectModel } from "@/lib/ai-platform/routing/select";
import { chooseFallback } from "@/lib/ai-platform/fallback/strategy";
import { applyUsage, withinCaps } from "@/lib/ai-platform/usage/counter";

describe("AI platform routing / fallback / usage", () => {
  it("no usable models -> no_usable_model_registered", () => {
    const result = selectModel([], {
      candidateSlugs: ["a"],
      requireToolSupport: false,
    });
    expect(result.selected).toBeNull();
    expect(result.reason).toBe("no_usable_model_registered");
  });

  it("filters disabled provider", () => {
    const result = selectModel(
      [
        {
          id: "m1",
          slug: "d",
          provider: "disabled",
          modelName: "d",
          versionKey: "1",
          contextWindow: 0,
          supportsTools: true,
          productionActivated: true,
        },
      ],
      { candidateSlugs: ["d"], requireToolSupport: false }
    );
    expect(result.selected).toBeNull();
  });

  it("chooses candidate match first", () => {
    const models = [
      {
        id: "m1",
        slug: "primary",
        provider: "vendor_api" as const,
        modelName: "p",
        versionKey: "1",
        contextWindow: 1,
        supportsTools: true,
        productionActivated: true,
      },
      {
        id: "m2",
        slug: "secondary",
        provider: "internal" as const,
        modelName: "s",
        versionKey: "1",
        contextWindow: 1,
        supportsTools: true,
        productionActivated: true,
      },
    ];
    const result = selectModel(models, {
      candidateSlugs: ["primary", "secondary"],
      requireToolSupport: true,
    });
    expect(result.selected?.slug).toBe("primary");
    expect(result.fallback?.slug).toBe("secondary");
  });

  it("policy_blocked fallback => abort", () => {
    const decision = chooseFallback("policy_blocked", true);
    expect(decision.action).toBe("abort");
  });

  it("model_error with simulation available => cached_simulation", () => {
    const decision = chooseFallback("model_error", true);
    expect(decision.action).toBe("cached_simulation");
  });

  it("model_error without simulation => human_handoff", () => {
    const decision = chooseFallback("model_error", false);
    expect(decision.action).toBe("human_handoff");
  });

  it("usage caps trigger correctly", () => {
    const usage = applyUsage(
      { sessionCalls: 4, dayCalls: 4, totalSpendDollars: 0 },
      { additionalCalls: 1 }
    );
    const check = withinCaps(usage, {
      perSessionCallCap: 5,
      perDayCallCap: 100,
      envelopeSpendCap: null,
    });
    expect(check.ok).toBe(true);
    const check2 = withinCaps(
      { sessionCalls: 6, dayCalls: 6, totalSpendDollars: 0 },
      { perSessionCallCap: 5, perDayCallCap: 100, envelopeSpendCap: null }
    );
    expect(check2.ok).toBe(false);
  });
});
