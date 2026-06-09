import { describe, expect, it } from "vitest";

import {
  coreModules,
  roadmapModules,
} from "@/app/lib/modules";
import {
  getActiveY1UxPaths,
  getY1PilotEnvBundle,
  isY1WedgePilotActive,
  Y1_WEDGE_SUCCESS_METRICS,
} from "@/lib/pilot/y1-wedge-pilot";
import { isParticipantMatchReviewEnabled } from "@/lib/config/y1-wedge";
import {
  annotateBriefForCache,
  isBriefCacheStale,
  validateBriefSyncPayload,
} from "@/lib/mobile/offline-brief-cache";
import { resolveInvoiceLinePricing } from "@/lib/ndis-pricing/price-lookup-service";
import { createLLMCaseAIEngine } from "@/lib/cases/ai/llm-engine";
import { apiUsageMeteringConfig } from "@/lib/developer-api/usage-metering-service";

describe("Y1 wedge pilot", () => {
  it("is inactive by default", () => {
    expect(isY1WedgePilotActive()).toBe(false);
  });

  it("documents success metrics aligned to masterplan", () => {
    expect(Y1_WEDGE_SUCCESS_METRICS.map((m) => m.key)).toContain(
      "match_dispute_rate"
    );
  });

  it("returns pilot env bundle for staging", () => {
    const bundle = getY1PilotEnvBundle();
    expect(bundle.SUPPORT_PROFILE_ENABLED).toBe("true");
    expect(bundle.PARTICIPANT_MATCH_REVIEW_ENABLED).toBe("true");
  });

  it("returns no UX paths when flags are off", () => {
    expect(getActiveY1UxPaths()).toHaveLength(0);
  });
});

describe("Match review gating", () => {
  it("is disabled by default", () => {
    expect(isParticipantMatchReviewEnabled()).toBe(false);
  });
});

describe("Module hub taxonomy", () => {
  it("separates core and roadmap modules", () => {
    expect(coreModules.map((m) => m.key)).toEqual([
      "care",
      "transport",
      "jobs",
    ]);
    expect(roadmapModules.map((m) => m.key)).toEqual([
      "foods",
      "moves",
      "marketplace",
      "kids",
    ]);
  });

  it("roadmap modules have reduced marketing claims", () => {
    for (const mod of roadmapModules) {
      expect(mod.roadmapFeatures?.length).toBeGreaterThan(0);
    }
  });
});

describe("NDIS pricing lookup", () => {
  it("exports resolveInvoiceLinePricing helper", async () => {
    expect(typeof resolveInvoiceLinePricing).toBe("function");
  });
});

describe("LLM case AI engine", () => {
  it("caps confidence and requires review", () => {
    const engine = createLLMCaseAIEngine();
    expect(engine.maxConfidence).toBeLessThanOrEqual(0.7);
    expect(engine.id).toContain("llm");
  });
});

describe("Mobile offline brief cache", () => {
  it("detects stale cache", () => {
    const stale = isBriefCacheStale(
      new Date(Date.now() - 48 * 3600000).toISOString()
    );
    expect(stale).toBe(true);
  });

  it("annotates brief with cachedAt", () => {
    const brief = annotateBriefForCache({ displayLabel: "Morning shift", tasks: [] });
    expect(brief.cachedAt).toBeDefined();
  });

  it("validates sync payload", () => {
    expect(
      validateBriefSyncPayload({ shiftId: "abc", cachedAt: new Date().toISOString() })
        .valid
    ).toBe(true);
  });
});

describe("Developer API metering config", () => {
  it("is off by default", () => {
    expect(apiUsageMeteringConfig.enabled).toBe(false);
  });
});
