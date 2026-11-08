import { afterEach, describe, expect, it } from "vitest";

import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { createDoohSandboxAdapter } from "@/lib/ads/connectors/dooh-sandbox";
import { createMapAbleOwnedConnector } from "@/lib/ads/connectors/mapable-owned";
import { loadSeedProviderRegistry } from "@/lib/ads/discovery/provider-discovery";
import { searchPlacementOpportunities } from "@/lib/ads/placement/search";

const ORIGINAL = { ...process.env };

afterEach(() => {
  process.env = { ...ORIGINAL };
});

describe("ads manager flags", () => {
  it("defaults new manager flags to false", () => {
    delete process.env.MAPABLE_ADS_ENABLED;
    delete process.env.MAPABLE_ADS_MANAGER_ENABLED;
    delete process.env.MAPABLE_ADS_PLACEMENT_API_ENABLED;
    delete process.env.MAPABLE_ADS_PROVIDER_DISCOVERY_ENABLED;
    delete process.env.MAPABLE_ADS_DOOH_SANDBOX_ENABLED;
    expect(adsFlagsConfig.isManagerEnabled({})).toBe(false);
    expect(adsFlagsConfig.isPlacementApiEnabled({})).toBe(false);
    expect(adsFlagsConfig.isProviderDiscoveryEnabled({})).toBe(false);
    expect(adsFlagsConfig.isDoohSandboxEnabled({})).toBe(false);
  });

  it("requires parent MAPABLE_ADS_ENABLED", () => {
    expect(
      adsFlagsConfig.isManagerEnabled({
        MAPABLE_ADS_MANAGER_ENABLED: "true",
      }),
    ).toBe(false);
    expect(
      adsFlagsConfig.isManagerEnabled({
        MAPABLE_ADS_ENABLED: "true",
        MAPABLE_ADS_MANAGER_ENABLED: "true",
      }),
    ).toBe(true);
  });
});

describe("synthetic connectors", () => {
  it("mapable connector accepts creative with alt text", async () => {
    const c = createMapAbleOwnedConnector();
    const ok = await c.validateCreative({ altText: "Community event", format: "image" });
    expect(ok.ok).toBe(true);
    const bad = await c.validateCreative({ format: "image" });
    expect(bad.ok).toBe(false);
  });

  it("dooh sandbox never reports enabled buying", async () => {
    const caps = await createDoohSandboxAdapter().getCapabilities();
    expect(caps.enabled).toBe(false);
    expect(caps.countries).toContain("AU");
  });

  it("dooh unknown idempotency freezes as submission_unknown", async () => {
    const adapter = createDoohSandboxAdapter();
    const result = await adapter.submitApprovedOrder({
      internalOrderId: "ord-1",
      quoteId: "q-1",
      termsHash: "abc",
      idempotencyKey: "key-unknown",
    });
    expect(result.state).toBe("submission_unknown");
  });
});

describe("seed registry", () => {
  it("loads checked-in registry with live spend false", () => {
    const seed = loadSeedProviderRegistry();
    expect(seed.providers.length).toBeGreaterThan(0);
    expect(seed.providers.every((p) => p.live_spend_enabled === false)).toBe(
      true,
    );
    expect(seed.providers.every((p) => p.production_enabled === false)).toBe(
      true,
    );
  });
});

describe("placement search fixtures", () => {
  it("returns mapable owned opportunities when placement search runs", async () => {
    process.env.MAPABLE_ADS_ENABLED = "true";
    process.env.MAPABLE_ADS_DOOH_SANDBOX_ENABLED = "true";
    const result = await searchPlacementOpportunities({
      channels: ["mapable", "dooh"],
      region: { country: "AU" },
      budget: { amountMinor: 500000, currency: "AUD" },
      creative: { format: "image", aspectRatio: "16:9" },
      targeting: { kind: "contextual" },
    });
    expect(result.opportunities.length).toBeGreaterThan(0);
    expect(result.opportunities.every((o) => o.buyable === false)).toBe(true);
    expect(
      result.opportunities.some((o) => o.channel === "mapable"),
    ).toBe(true);
  });
});
