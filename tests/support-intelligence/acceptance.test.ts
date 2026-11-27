import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("@/lib/audit/audit-event-service", () => ({
  createAuditEvent: vi.fn().mockResolvedValue(undefined),
}));

import {
  aggregateSupportDemand,
  SYNTHETIC_DEMAND_ROWS,
} from "@/lib/support-intelligence/demand/aggregates";
import {
  hardDenyOperationalActions,
  isCapabilityEnabled,
  supportIntelligenceFlags,
} from "@/lib/support-intelligence/config/feature-flags";
import {
  clearHumanReviewTicketsForTests,
  enqueueHumanReview,
  listHumanReviewTickets,
} from "@/lib/support-intelligence/human-review";
import {
  lookupRegulatoryEvidence,
  SYNTHETIC_REG_CONFLICT_ABN,
} from "@/lib/support-intelligence/regulatory/gateway";
import { enhanceSearchResponse } from "@/lib/support-intelligence/search-integration";
import { runServiceMatching } from "@/lib/support-intelligence/sma/matcher";
import { prepareSnaForMatching } from "@/lib/support-intelligence/sna/snapshot";
import {
  findAllowlistEntry,
  isHostBlocked,
  isPathDisallowedByRobots,
} from "@/lib/support-intelligence/spider/crawl-allowlist";
import { dedupeSpiderRecords } from "@/lib/support-intelligence/spider/dedupe";
import {
  createFixtureSpiderAdapter,
  SYNTHETIC_SPIDER_FIXTURES,
} from "@/lib/support-intelligence/spider/fixture-adapter";
import {
  crawlApprovedUrls,
  stripHtmlToExcerpt,
} from "@/lib/support-intelligence/spider/crawlee-runner";
import { runSpiderDiscovery } from "@/lib/support-intelligence/spider/orchestrator";
import { mapServicesToTaxonomy } from "@/lib/support-intelligence/spider/taxonomy";
import { lookupWorkerVerification } from "@/lib/support-intelligence/worker-verification/gateway";
import { navigationSearch } from "@/lib/search/mapable-search-core";

const FLAG_KEYS = [
  "MAPABLE_SUPPORT_INTEL_ENABLED",
  "MAPABLE_SUPPORT_INTEL_KILL_SWITCH",
  "MAPABLE_SUPPORT_INTEL_SPIDER_ENABLED",
  "MAPABLE_SUPPORT_INTEL_SPIDER_CRAWL_ENABLED",
  "MAPABLE_SUPPORT_INTEL_SNA_ENABLED",
  "MAPABLE_SUPPORT_INTEL_SMA_ENABLED",
  "MAPABLE_SUPPORT_INTEL_REG_GATEWAY_ENABLED",
  "MAPABLE_SUPPORT_INTEL_WVG_ENABLED",
  "MAPABLE_SUPPORT_INTEL_DEMAND_ENABLED",
  "MAPABLE_SUPPORT_INTEL_SEARCH_ENABLED",
] as const;

function enableAll() {
  process.env.MAPABLE_SUPPORT_INTEL_ENABLED = "true";
  process.env.MAPABLE_SUPPORT_INTEL_KILL_SWITCH = "false";
  process.env.MAPABLE_SUPPORT_INTEL_SPIDER_ENABLED = "true";
  process.env.MAPABLE_SUPPORT_INTEL_SNA_ENABLED = "true";
  process.env.MAPABLE_SUPPORT_INTEL_SMA_ENABLED = "true";
  process.env.MAPABLE_SUPPORT_INTEL_REG_GATEWAY_ENABLED = "true";
  process.env.MAPABLE_SUPPORT_INTEL_WVG_ENABLED = "true";
  process.env.MAPABLE_SUPPORT_INTEL_DEMAND_ENABLED = "true";
  process.env.MAPABLE_SUPPORT_INTEL_SEARCH_ENABLED = "true";
}

function clearFlags() {
  for (const key of FLAG_KEYS) delete process.env[key];
}

describe("Support Intelligence v0.1 acceptance", () => {
  beforeEach(() => {
    clearFlags();
    clearHumanReviewTicketsForTests();
  });

  afterEach(() => {
    clearFlags();
  });

  it("fails closed when master flag is off", async () => {
    expect(isCapabilityEnabled("spider")).toBe(false);
    const discovery = await runSpiderDiscovery({ includeFixtures: true });
    expect(discovery.ok).toBe(false);
    if (!discovery.ok) expect(discovery.reasonCode).toBe("feature_flag_disabled");
  });

  it("paginates directory / fixture discovery", async () => {
    enableAll();
    const adapter = createFixtureSpiderAdapter();
    const page1 = await adapter.fetchPage({ pagination: { limit: 2, cursor: "0" } });
    expect(page1.items).toHaveLength(2);
    expect(page1.nextCursor).toBe("2");
    const page2 = await adapter.fetchPage({
      pagination: { limit: 2, cursor: page1.nextCursor ?? undefined },
    });
    expect(page2.items.length).toBeGreaterThan(0);
    expect(page1.provenance.sourceKind).toBe("synthetic_fixture");
  });

  it("detects duplicates and excludes demo rows from kept set", () => {
    const { kept, duplicates, excluded } = dedupeSpiderRecords(
      SYNTHETIC_SPIDER_FIXTURES,
    );
    expect(kept).toHaveLength(0);
    expect(excluded.length).toBeGreaterThan(0);
    expect(duplicates.length + excluded.length).toBe(
      SYNTHETIC_SPIDER_FIXTURES.length,
    );

    const liveDupes = dedupeSpiderRecords([
      {
        ...SYNTHETIC_SPIDER_FIXTURES[0]!,
        sourceId: "a",
        isDemo: false,
      },
      {
        ...SYNTHETIC_SPIDER_FIXTURES[0]!,
        sourceId: "b",
        isDemo: false,
        providerName: "Synthetic Harbour Supports Dup",
      },
      {
        ...SYNTHETIC_SPIDER_FIXTURES[2]!,
        sourceId: "c",
        isDemo: false,
      },
    ]);
    expect(liveDupes.kept).toHaveLength(2);
    expect(liveDupes.duplicates).toHaveLength(1);
  });

  it("maps taxonomy labels and leaves unknowns explicit", () => {
    const mapped = mapServicesToTaxonomy([
      "Daily personal activities",
      "Obscure custom service XYZ",
    ]);
    expect(mapped.mapped[0]?.state).toBe("mapped");
    expect(mapped.unknown).toContain("Obscure custom service XYZ");
  });

  it("never maps negative service declarations to positive taxonomy slugs", () => {
    const mapped = mapServicesToTaxonomy([
      "No transport",
      "Does not provide support coordination",
      "Transport assistance",
    ]);
    expect(mapped.negative).toEqual(
      expect.arrayContaining([
        "No transport",
        "Does not provide support coordination",
      ]),
    );
    expect(mapped.mapped.find((m) => m.input === "No transport")?.slug).toBeNull();
    expect(
      mapped.mapped.find((m) => m.input === "Transport assistance")?.slug,
    ).toBe("transport");
  });

  it("flags stale directory provenance", async () => {
    enableAll();
    const result = await runSpiderDiscovery({
      includeFixtures: true,
      adapters: [createFixtureSpiderAdapter()],
    });
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.stale).toBe(true);
  });

  it("queues human review on registration conflicts", async () => {
    enableAll();
    const reg = await lookupRegulatoryEvidence({
      abn: SYNTHETIC_REG_CONFLICT_ABN,
      directoryActive: 1,
    });
    expect(reg.ok).toBe(true);
    if (reg.ok) {
      expect(reg.registration).toBe("conflict");
      expect(reg.humanReviewRequired).toBe(true);
      expect(reg.humanReviewReasons).toContain("regulatory_conflict");
    }
  });

  it("requires human review for ambiguous worker identity", async () => {
    enableAll();
    const wvg = await lookupWorkerVerification({
      workerProfileId: "wp_test",
      actorUserId: "user_test",
      consentGranted: true,
      identityTokens: ["ambiguous-identity-fixture"],
      internalScreeningStatus: "pending_review",
    });
    expect(wvg.ok).toBe(true);
    if (wvg.ok) {
      expect(wvg.humanReviewRequired).toBe(true);
      expect(wvg.screening).toBe("unknown");
      expect(wvg.claims.some((c) => c.field === "live_worker_screening")).toBe(
        true,
      );
    }
  });

  it("blocks worker verification after consent withdrawal", async () => {
    enableAll();
    const wvg = await lookupWorkerVerification({
      workerProfileId: "wp_test",
      actorUserId: "user_test",
      consentGranted: true,
      consentWithdrawn: true,
    });
    expect(wvg.ok).toBe(false);
    if (!wvg.ok) expect(wvg.reasonCode).toBe("consent_withdrawn");
  });

  it("applies mandatory eligibility gates before preference ranking", async () => {
    enableAll();
    const sna = prepareSnaForMatching({
      participantId: "p1",
      consentDraftProcessing: true,
      answers: [
        { domainId: "self_care", intensity: "some" },
        { domainId: "community_social_civic_life", intensity: "a_little" },
      ],
    });
    expect(sna.ok).toBe(true);
    if (!sna.ok) return;

    const ineligible = SYNTHETIC_SPIDER_FIXTURES[0]!;
    const eligible = {
      ...SYNTHETIC_SPIDER_FIXTURES[0]!,
      sourceId: "eligible-1",
      isDemo: false,
      abn: "51824753556",
      services: ["Daily personal activities", "Community participation"],
    };

    const match = await runServiceMatching({
      sna,
      sources: [
        { record: ineligible, orgEligible: true, directoryActive: 1 },
        { record: eligible, orgEligible: true, directoryActive: 1 },
        {
          record: {
            ...eligible,
            sourceId: "org-blocked",
            abn: "53004085616",
          },
          orgEligible: false,
          directoryActive: 1,
        },
        {
          record: {
            ...eligible,
            sourceId: "conflict-row",
            abn: SYNTHETIC_REG_CONFLICT_ABN,
          },
          orgEligible: true,
          directoryActive: 1,
        },
      ],
    });

    expect(match.ok).toBe(true);
    if (!match.ok) return;
    expect(match.eligibilityBlockedCount).toBeGreaterThanOrEqual(2);
    expect(match.candidates.every((c) => c.eligibilityPassed)).toBe(true);
    expect(match.candidates[0]?.displayRank).toBe(1);
    expect(match.candidates[0]?.explanation.unknown.length).toBeGreaterThan(0);
    expect(match.operationalActions.booking).toBe(false);
    expect(match.operationalActions.payment).toBe(false);
    expect(match.operationalActions.dispatch).toBe(false);
  });

  it("blocks matching when consent is withdrawn", async () => {
    enableAll();
    const sna = prepareSnaForMatching({
      participantId: "p1",
      consentDraftProcessing: true,
      answers: [{ domainId: "mobility", intensity: "a_lot" }],
    });
    if (!sna.ok) throw new Error("sna");
    const match = await runServiceMatching({
      sna,
      sources: [],
      consentWithdrawn: true,
    });
    expect(match.ok).toBe(false);
    if (!match.ok) expect(match.reasonCode).toBe("consent_withdrawn");
  });

  it("suppresses small-cell demand aggregates", () => {
    enableAll();
    const result = aggregateSupportDemand({
      rows: SYNTHETIC_DEMAND_ROWS,
      kAnonymityThreshold: 5,
    });
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    const suppressed = result.cells.find(
      (c) => c.serviceSlug === "support-coordination",
    );
    expect(suppressed?.suppressed).toBe(true);
    expect(suppressed?.unmetNeedCount).toBeNull();
    const open = result.cells.find(
      (c) => c.serviceSlug === "daily-personal-activities",
    );
    expect(open?.suppressed).toBe(false);
    expect(open?.unmetNeedCount).toBe(12);
  });

  it("never allowlists screening or private hosts for crawl", () => {
    expect(isHostBlocked("workercheck.example")).toBe(true);
    expect(isHostBlocked("127.0.0.1")).toBe(true);
    expect(
      findAllowlistEntry(
        "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider",
      ),
    ).not.toBeNull();
    expect(
      findAllowlistEntry("https://evil.example/providers/"),
    ).toBeNull();
    expect(isPathDisallowedByRobots("User-agent: *\nDisallow: /secret\n", "/secret")).toBe(
      true,
    );
  });

  it("keeps operational actions hard-denied regardless of env", () => {
    process.env.MAPABLE_SUPPORT_INTEL_BOOKING_ENABLED = "true";
    process.env.MAPABLE_SUPPORT_INTEL_PAYMENT_ENABLED = "true";
    process.env.MAPABLE_SUPPORT_INTEL_DISPATCH_ENABLED = "true";
    const ops = hardDenyOperationalActions();
    expect(ops.booking).toBe(false);
    expect(ops.payment).toBe(false);
    expect(ops.dispatch).toBe(false);
    delete process.env.MAPABLE_SUPPORT_INTEL_BOOKING_ENABLED;
    delete process.env.MAPABLE_SUPPORT_INTEL_PAYMENT_ENABLED;
    delete process.env.MAPABLE_SUPPORT_INTEL_DISPATCH_ENABLED;
  });

  it("exposes accessible navigation modules and SI search warnings when enabled", () => {
    enableAll();
    const base = {
      results: navigationSearch({ q: "support", vertical: "all" }),
      sourceState: "navigation_only" as const,
      providerIndexEnabled: false,
      resultCount: 0,
      warnings: [] as string[],
    };
    base.resultCount = base.results.length;
    const enhanced = enhanceSearchResponse({ base });
    expect(enhanced.results.length).toBeGreaterThan(0);
    expect(enhanced.supportIntelligence.enabled).toBe(true);
    expect(
      enhanced.warnings.some((w) => w.includes("Support Intelligence")),
    ).toBe(true);
  });

  it("queues human review tickets for complex support", async () => {
    const ticket = await enqueueHumanReview({
      reasons: ["complex_support_requirement"],
      entityType: "Participant",
      entityId: "p1",
    });
    expect(ticket.status).toBe("queued");
    const listed = await listHumanReviewTickets();
    expect(listed.some((t) => t.id === ticket.id)).toBe(true);
  });

  it("reads flag object defaults as false", () => {
    expect(supportIntelligenceFlags.enabled).toBe(false);
    expect(supportIntelligenceFlags.spiderEnabled).toBe(false);
  });

  it("strips script and style blocks even when closing tags have whitespace", () => {
    const excerpt = stripHtmlToExcerpt(
      "<p>Hello</p><script>alert(1)</script ><style>body{}</style >World",
    );
    expect(excerpt).toBe("Hello World");
    expect(excerpt).not.toContain("alert");
    expect(excerpt).not.toContain("body{}");
  });

  it("stops crawl when kill switch is on even if crawl flag remains true", async () => {
    process.env.MAPABLE_SUPPORT_INTEL_ENABLED = "true";
    process.env.MAPABLE_SUPPORT_INTEL_SPIDER_ENABLED = "true";
    process.env.MAPABLE_SUPPORT_INTEL_SPIDER_CRAWL_ENABLED = "true";
    process.env.MAPABLE_SUPPORT_INTEL_KILL_SWITCH = "true";
    const results = await crawlApprovedUrls({
      urls: [
        "https://www.ndiscommission.gov.au/provider-registration/find-registered-provider",
      ],
    });
    expect(results[0]?.allowed).toBe(false);
    expect(results[0]?.denialReason).toBe("kill_switch");
  });
});
