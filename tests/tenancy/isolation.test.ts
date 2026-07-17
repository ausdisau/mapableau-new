import { describe, expect, it } from "vitest";

import { tenantScopedWhere, tenantScopedWhereMany } from "@/lib/tenancy/storage/tenant-query";
import { buildTenantContext } from "@/lib/tenancy/context/tenant-context";
import {
  assertSafeTenantKey,
  tenantObjectPath,
} from "@/lib/tenancy/storage/object-path";
import { evaluatePrivateFileAccess } from "@/lib/tenancy/storage/private-file-policy";
import {
  isTransitionAllowed,
  allowedNextStatuses,
} from "@/lib/tenancy/lifecycle/status-transitions";
import { MODEL_CLASSIFICATION_REGISTRY } from "@/lib/tenancy/storage/model-classification";
import { computeFairShare } from "@/lib/capacity/queue-fairness";
import { evaluateBackpressure } from "@/lib/capacity/backpressure";
import { assertNoSponsoredBoostInOrganic, computeOrganicScore } from "@/lib/market-integrity/ranking-governance";
import { sanitiseAnalyticsRow } from "@/lib/analytics/privacy";
import { assertCohortSize } from "@/lib/analytics/aggregation";
import { redactForLogging } from "@/lib/observability/privacy";

describe("tenant isolation helpers (Wave 8)", () => {
  it("tenantScopedWhere fails closed without a tenant scope", () => {
    const ctx = buildTenantContext({
      organisationId: null,
      actor: { kind: "user", userId: "u1", role: "mapable_admin" },
    });
    expect(() => tenantScopedWhere(ctx)).toThrow(/TENANT_CONTEXT_MISSING/);
  });

  it("tenantScopedWhere injects organisationId", () => {
    const ctx = buildTenantContext({
      organisationId: "org_1",
      actor: { kind: "user", userId: "u1", role: "provider_admin" },
    });
    expect(tenantScopedWhere(ctx, { status: "open" })).toEqual({
      status: "open",
      organisationId: "org_1",
    });
  });

  it("tenantScopedWhereMany includes additional orgIds", () => {
    const ctx = buildTenantContext({
      organisationId: "org_1",
      actor: { kind: "user", userId: "u1", role: "provider_admin" },
    });
    const w = tenantScopedWhereMany(ctx, ["org_2"], { active: true });
    expect(w.active).toBe(true);
    expect(w.organisationId.in.sort()).toEqual(["org_1", "org_2"]);
  });

  it("object paths are anchored to a tenant key", () => {
    expect(() => assertSafeTenantKey("../evil")).toThrow();
    expect(() => assertSafeTenantKey("ab")).toThrow();
    expect(assertSafeTenantKey("acme_ndis")).toBeUndefined();
    const p = tenantObjectPath("acme_ndis", "private", "docs", "abc.pdf");
    expect(p).toBe("tenants/acme_ndis/private/docs/abc.pdf");
  });

  it("private file access denies when file has no owner", () => {
    const ctx = buildTenantContext({
      organisationId: "org_1",
      actor: { kind: "user", userId: "u1", role: "provider_admin" },
    });
    expect(evaluatePrivateFileAccess(ctx, { organisationId: null }).allowed).toBe(false);
    expect(
      evaluatePrivateFileAccess(ctx, { organisationId: "org_2" }).allowed
    ).toBe(false);
    expect(
      evaluatePrivateFileAccess(ctx, { organisationId: "org_1" }).allowed
    ).toBe(true);
  });

  it("participant data requires break-glass for platform admin", () => {
    const ctx = buildTenantContext({
      organisationId: "org_1",
      actor: { kind: "user", userId: "u1", role: "mapable_admin" },
    });
    const decision = evaluatePrivateFileAccess(ctx, {
      organisationId: "org_1",
      classification: "participant_data",
    });
    expect(decision.allowed).toBe(false);
    expect(decision.reason).toBe("sensitive_needs_break_glass");
  });

  it("tenant lifecycle transitions are enforced", () => {
    expect(isTransitionAllowed("active_limited", "active")).toBe(true);
    expect(isTransitionAllowed("archived", "active")).toBe(false);
    expect(allowedNextStatuses("active")).toContain("restricted");
  });

  it("model classification registry classifies participant data as organisation-scoped", () => {
    const care = MODEL_CLASSIFICATION_REGISTRY.find(
      (m) => m.modelName === "CareRequest"
    );
    expect(care?.classification).toBe("participant_data");
    expect(care?.organisationScoped).toBe(true);
  });

  it("queue fair share respects concurrency", () => {
    const share = computeFairShare(
      [
        { organisationId: "org_1", pending: 5 },
        { organisationId: "org_2", pending: 2 },
      ],
      4
    );
    const total = share.reduce((acc, s) => acc + s.slots, 0);
    expect(total).toBeLessThanOrEqual(4);
    expect(share.length).toBe(2);
  });

  it("backpressure sheds at hard limit", () => {
    expect(evaluateBackpressure({ current: 10, warnAt: 5, hardAt: 10 }).action).toBe("shed");
    expect(evaluateBackpressure({ current: 6, warnAt: 5, hardAt: 10 }).action).toBe("throttle");
    expect(evaluateBackpressure({ current: 1, warnAt: 5, hardAt: 10 }).action).toBe("accept");
  });

  it("ranking rejects sponsored boost in organic score", () => {
    expect(() =>
      assertNoSponsoredBoostInOrganic({
        qualitySignals: 1,
        accessibilityFit: 1,
        distancePenalty: 0,
        waitTimePenalty: 0,
        sponsoredBoost: 5,
      })
    ).toThrow(/SPONSORED_BOOST_NOT_ALLOWED_IN_ORGANIC/);
    const r = computeOrganicScore({
      qualitySignals: 1,
      accessibilityFit: 1,
      distancePenalty: 0,
      waitTimePenalty: 0,
    });
    expect(r.usedSponsoredBoost).toBe(false);
  });

  it("analytics privacy rejects NDIS numbers and complaint text", () => {
    expect(() =>
      sanitiseAnalyticsRow({ x: "hello 431234567 world" })
    ).toThrow(/ndis_number_in/);
    expect(() =>
      sanitiseAnalyticsRow({ complaintText: "safe" })
    ).toThrow(/forbidden_field/);
  });

  it("aggregation refuses small cohorts", () => {
    expect(() => assertCohortSize(3)).toThrow(/ANALYTICS_COHORT_TOO_SMALL/);
    expect(() => assertCohortSize(20)).not.toThrow();
  });

  it("observability redacts risky keys", () => {
    const r = redactForLogging({ password: "s3cret", other: "ok", ndisNumber: "431234567" });
    expect(r.password).toBe("[REDACTED]");
    expect(r.ndisNumber).toBe("[REDACTED]");
    expect(r.other).toBe("ok");
  });
});
