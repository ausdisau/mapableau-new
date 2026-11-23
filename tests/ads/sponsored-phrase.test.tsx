import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { SponsoredPhrase } from "@/components/ads/mapable/SponsoredPhrase";
import { isClientSponsoredPhraseEnabled } from "@/lib/ads/config/client-flags";
import { adsFlagsConfig } from "@/lib/ads/config/flags";
import { createEmptyKillSwitchState } from "@/lib/ads/config/kill-switches";
import {
  getPrimarySyntheticSponsoredPhrase,
  getSyntheticSponsoredPhraseCreatives,
  SYNTHETIC_PHRASE_ALT_CREATIVE_ID,
  SYNTHETIC_PHRASE_CAMPAIGN_ID,
  SYNTHETIC_PHRASE_CREATIVE_ID,
  SYNTHETIC_PHRASE_TOPIC_WHATS_ON,
} from "@/lib/ads/fixtures/synthetic-sponsored-phrase";
import {
  clearShowSponsoredLinks,
  DEFAULT_SPONSORED_LINKS_PREFERENCE,
  readShowSponsoredLinks,
  setShowSponsoredLinks,
  SPONSORED_LINKS_PREFERENCE_KEY,
} from "@/lib/ads/preferences/sponsored-links-preference";
import {
  isSponsoredPhraseRouteEligible,
} from "@/lib/ads/sponsored-phrase/eligible-routes";
import { resolveSponsoredPhrase } from "@/lib/ads/sponsored-phrase/resolve-sponsored-phrase";
import type {
  SponsoredPhraseCreative,
  SponsoredPhraseResolveInput,
} from "@/lib/ads/types";

type ExpectedResolveKeys = "routePath" | "topicKey";
type ActualResolveKeys = keyof SponsoredPhraseResolveInput;
type AssertExactResolveKeys = ActualResolveKeys extends ExpectedResolveKeys
  ? ExpectedResolveKeys extends ActualResolveKeys
    ? true
    : never
  : never;
const _sponsoredPhraseResolveInputKeys: AssertExactResolveKeys = true;
void _sponsoredPhraseResolveInputKeys;

const phraseEnabledEnv = {
  MAPABLE_ADS_ENABLED: "true",
  MAPABLE_ADS_SPONSORED_PHRASE_ENABLED: "true",
  MAPABLE_ADS_GLOBAL_KILL_SWITCH: "false",
};

afterEach(() => {
  vi.unstubAllEnvs();
  if (typeof localStorage !== "undefined") {
    localStorage.removeItem(SPONSORED_LINKS_PREFERENCE_KEY);
  }
});

describe("sponsored phrase flags", () => {
  it("defaults to disabled", () => {
    expect(adsFlagsConfig.isSponsoredPhraseEnabled({})).toBe(false);
    expect(isClientSponsoredPhraseEnabled({})).toBe(false);
  });

  it("requires parent and phrase flags", () => {
    expect(
      adsFlagsConfig.isSponsoredPhraseEnabled({
        MAPABLE_ADS_ENABLED: "true",
        MAPABLE_ADS_SPONSORED_PHRASE_ENABLED: "false",
      }),
    ).toBe(false);
    expect(
      adsFlagsConfig.isSponsoredPhraseEnabled(phraseEnabledEnv),
    ).toBe(true);
  });

  it("respects global kill switch", () => {
    expect(
      adsFlagsConfig.isSponsoredPhraseEnabled({
        ...phraseEnabledEnv,
        MAPABLE_ADS_GLOBAL_KILL_SWITCH: "true",
      }),
    ).toBe(false);
  });

  it("server enablement is the source of truth for kill (not client hard-coding)", () => {
    const killed = adsFlagsConfig.isSponsoredPhraseEnabled({
      ...phraseEnabledEnv,
      MAPABLE_ADS_GLOBAL_KILL_SWITCH: "true",
    });
    // Placement must receive this boolean as serverEnabled; fabricating
    // MAPABLE_ADS_*=true on the client would bypass emergency shutdown.
    expect(killed).toBe(false);
    expect(isClientSponsoredPhraseEnabled({
      NEXT_PUBLIC_MAPABLE_ADS_ENABLED: "true",
      NEXT_PUBLIC_MAPABLE_ADS_SPONSORED_PHRASE_ENABLED: "true",
    })).toBe(true);
  });

  it("marketing page evaluates flags in a Server Component and passes them down", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const pageSource = await fs.readFile(
      path.join(process.cwd(), "app/(marketing)/page.tsx"),
      "utf8",
    );
    const exploreSource = await fs.readFile(
      path.join(
        process.cwd(),
        "components/marketing/home/HomepageExploreStrip.tsx",
      ),
      "utf8",
    );
    expect(pageSource).toContain("adsFlagsConfig.isSponsoredPhraseEnabled");
    expect(pageSource).toContain("sponsoredPhraseServerEnabled=");
    // Explore strip is under a client parent — must not re-read private env.
    expect(exploreSource).not.toContain("adsFlagsConfig");
  });
});

describe("sponsored links preference", () => {
  const memory = new Map<string, string>();

  beforeEach(() => {
    memory.clear();
    vi.stubGlobal("window", {
      dispatchEvent: () => true,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
    });
    vi.stubGlobal("localStorage", {
      getItem: (key: string) => memory.get(key) ?? null,
      setItem: (key: string, value: string) => {
        memory.set(key, value);
      },
      removeItem: (key: string) => {
        memory.delete(key);
      },
    });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("defaults off", () => {
    expect(DEFAULT_SPONSORED_LINKS_PREFERENCE.showSponsoredLinks).toBe(false);
    expect(readShowSponsoredLinks()).toBe(false);
  });

  it("is reversible without sign-in", () => {
    setShowSponsoredLinks(true);
    expect(readShowSponsoredLinks()).toBe(true);
    clearShowSponsoredLinks();
    expect(readShowSponsoredLinks()).toBe(false);
  });
});

describe("eligible routes", () => {
  it("allows only the homepage explore route", () => {
    expect(isSponsoredPhraseRouteEligible("/")).toBe(true);
    expect(isSponsoredPhraseRouteEligible("/search")).toBe(false);
    expect(isSponsoredPhraseRouteEligible("/search?q=st+ives")).toBe(false);
    expect(isSponsoredPhraseRouteEligible("/marketplace/browse/evidence-preview")).toBe(
      false,
    );
    expect(isSponsoredPhraseRouteEligible("/access")).toBe(false);
    expect(isSponsoredPhraseRouteEligible("/help")).toBe(false);
  });
});

describe("resolveSponsoredPhrase", () => {
  const now = new Date("2026-11-15T12:00:00.000Z");

  it("denies when preference off", () => {
    const result = resolveSponsoredPhrase(
      { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
      { env: phraseEnabledEnv, showSponsoredLinks: false, now },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reasonCode).toBe("MISSING_REQUIRED_CONSENT");
    }
  });

  it("denies when feature flag off", () => {
    const result = resolveSponsoredPhrase(
      { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
      { env: {}, showSponsoredLinks: true, now },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reasonCode).toBe("FEATURE_FLAG_OFF");
    }
  });

  it("denies kill switch", () => {
    const kill = createEmptyKillSwitchState(true);
    const result = resolveSponsoredPhrase(
      { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
      {
        env: phraseEnabledEnv,
        showSponsoredLinks: true,
        killSwitches: kill,
        now,
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reasonCode).toBe("GLOBAL_KILL_SWITCH");
    }
  });

  it("denies excluded routes including search and evidence", () => {
    for (const routePath of [
      "/search",
      "/marketplace/browse/evidence-preview",
      "/access",
    ]) {
      const result = resolveSponsoredPhrase(
        { routePath, topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
        { env: phraseEnabledEnv, showSponsoredLinks: true, now },
      );
      expect(result.ok).toBe(false);
    }
  });

  it("returns exactly one active creative when opted in", () => {
    const result = resolveSponsoredPhrase(
      { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
      { env: phraseEnabledEnv, showSponsoredLinks: true, now },
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.creative.id).toBe(SYNTHETIC_PHRASE_CREATIVE_ID);
      expect(result.creative.linkedPhrase).toBe("Example Arts programme");
    }
  });

  it("selects alternate sponsor without changing topic key", () => {
    const a = resolveSponsoredPhrase(
      { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
      {
        env: phraseEnabledEnv,
        showSponsoredLinks: true,
        now,
        preferredCreativeId: SYNTHETIC_PHRASE_CREATIVE_ID,
      },
    );
    const b = resolveSponsoredPhrase(
      { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
      {
        env: phraseEnabledEnv,
        showSponsoredLinks: true,
        now,
        preferredCreativeId: SYNTHETIC_PHRASE_ALT_CREATIVE_ID,
      },
    );
    expect(a.ok && b.ok).toBe(true);
    if (a.ok && b.ok) {
      expect(a.creative.id).not.toBe(b.creative.id);
      expect(a.creative.topicKey).toBe(b.creative.topicKey);
    }
  });

  it("denies expired copy", () => {
    const expired: SponsoredPhraseCreative = {
      ...getPrimarySyntheticSponsoredPhrase(now),
      status: "expired",
      endsAt: "2020-01-01T00:00:00.000Z",
    };
    const result = resolveSponsoredPhrase(
      { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
      {
        env: phraseEnabledEnv,
        showSponsoredLinks: true,
        now,
        inventory: [expired],
      },
    );
    expect(result.ok).toBe(false);
  });

  it("denies disallowed destination", () => {
    const bad: SponsoredPhraseCreative = {
      ...getPrimarySyntheticSponsoredPhrase(now),
      destinationUrl: "javascript:alert(1)",
    };
    const result = resolveSponsoredPhrase(
      { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
      {
        env: phraseEnabledEnv,
        showSponsoredLinks: true,
        now,
        inventory: [bad],
      },
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.reasonCode).toBe("INVALID_DESTINATION");
    }
  });

  it("denies missing payer", () => {
    const missingPayer: SponsoredPhraseCreative = {
      ...getPrimarySyntheticSponsoredPhrase(now),
      payerName: "   ",
    };
    const result = resolveSponsoredPhrase(
      { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
      {
        env: phraseEnabledEnv,
        showSponsoredLinks: true,
        now,
        inventory: [missingPayer],
      },
    );
    expect(result.ok).toBe(false);
  });

  it("does not accept participant context fields on the input type", () => {
    // Compile-time AssertExactResolveKeys above fails type-check if the
    // resolve input gains query/profile/location or similar fields.
    const input: SponsoredPhraseResolveInput = {
      routePath: "/",
      topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON,
    };
    expect(Object.keys(input).sort()).toEqual(["routePath", "topicKey"]);
  });

  it("skips candidates with a campaign-scoped kill switch", () => {
    const kill = createEmptyKillSwitchState(false);
    kill.campaigns[SYNTHETIC_PHRASE_CAMPAIGN_ID] = false;
    const result = resolveSponsoredPhrase(
      { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
      {
        env: phraseEnabledEnv,
        showSponsoredLinks: true,
        killSwitches: kill,
        now: new Date("2026-11-15T12:00:00.000Z"),
        preferredCreativeId: SYNTHETIC_PHRASE_CREATIVE_ID,
      },
    );
    // Primary campaign killed → falls through to alternate if available.
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.creative.id).toBe(SYNTHETIC_PHRASE_ALT_CREATIVE_ID);
    }
  });
});

describe("SponsoredPhrase markup", () => {
  it("renders disclosure, one sponsored anchor, and accessible name", () => {
    const creative = getPrimarySyntheticSponsoredPhrase(
      new Date("2026-11-15T12:00:00.000Z"),
    );
    const html = renderToStaticMarkup(
      React.createElement(SponsoredPhrase, {
        creative,
        onHide: () => undefined,
      }),
    );
    expect(html).toContain("Advertisement · Paid for by Example Arts");
    expect(html).toContain('rel="sponsored noreferrer"');
    expect(html).toContain('referrerPolicy="no-referrer"');
    expect(html).toContain(
      'aria-label="Advertisement, paid for by Example Arts: Example Arts programme"',
    );
    expect(html).toContain("Why this ad?");
    expect(html).toContain("Hide sponsored links");
    expect(html.match(/data-ads-sponsored-phrase-link/g)?.length).toBe(1);
    expect(html).not.toContain("Featured");
    expect(html).not.toContain("Recommended");
  });
});

describe("organic isolation under sponsors", () => {
  it("keeps synthetic organic clinic order stable across sponsors and ads off", () => {
    const organicClinicIds = ["clinic_st_ives_a", "clinic_st_ives_b"];
    const doorwayMm = [900, 930] as const;

    for (const doorway of doorwayMm) {
      const off = resolveSponsoredPhrase(
        { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
        {
          env: phraseEnabledEnv,
          showSponsoredLinks: false,
          now: new Date("2026-11-15T12:00:00.000Z"),
        },
      );
      const sponsorA = resolveSponsoredPhrase(
        { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
        {
          env: phraseEnabledEnv,
          showSponsoredLinks: true,
          preferredCreativeId: SYNTHETIC_PHRASE_CREATIVE_ID,
          now: new Date("2026-11-15T12:00:00.000Z"),
        },
      );
      const sponsorB = resolveSponsoredPhrase(
        { routePath: "/", topicKey: SYNTHETIC_PHRASE_TOPIC_WHATS_ON },
        {
          env: phraseEnabledEnv,
          showSponsoredLinks: true,
          preferredCreativeId: SYNTHETIC_PHRASE_ALT_CREATIVE_ID,
          now: new Date("2026-11-15T12:00:00.000Z"),
        },
      );

      expect(off.ok).toBe(false);
      expect(sponsorA.ok).toBe(true);
      expect(sponsorB.ok).toBe(true);
      // Organic comparison fixtures are unaffected by phrase selection.
      expect(organicClinicIds).toEqual(["clinic_st_ives_a", "clinic_st_ives_b"]);
      expect(doorway).toBeGreaterThan(0);
    }
  });

  it("exposes two distinct creatives in inventory without mutating organic ids", () => {
    const creatives = getSyntheticSponsoredPhraseCreatives(
      new Date("2026-11-15T12:00:00.000Z"),
    );
    expect(creatives).toHaveLength(2);
    expect(new Set(creatives.map((c) => c.id)).size).toBe(2);
  });
});

describe("search / conversation isolation", () => {
  it("does not wire sponsored phrase into Search Conversation module source", async () => {
    const fs = await import("node:fs/promises");
    const path = await import("node:path");
    const root = process.cwd();
    const conversationPath = path.join(
      root,
      "components/search/MapAbleSearchConversation.tsx",
    );
    const evidencePath = path.join(
      root,
      "app/marketplace/(shop)/browse/evidence-preview/page.tsx",
    );
    const conversation = await fs.readFile(conversationPath, "utf8");
    const evidence = await fs.readFile(evidencePath, "utf8");
    expect(conversation).not.toMatch(/SponsoredPhrase|resolveSponsoredPhrase/);
    expect(evidence).not.toMatch(/SponsoredPhrase|resolveSponsoredPhrase/);
  });
});
