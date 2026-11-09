import type { CurrentUser } from "@/lib/auth/current-user";
import {
  coverageCareConfig,
  ensureCoverageCareEnabled,
} from "@/lib/config/coverage-care";
import { recordCoverageCareAudit } from "@/lib/coverage-care/core-bridge";
import {
  assertProviderTenantAdmin,
  CoverageCarePermissionError,
} from "@/lib/coverage-care/permissions";
import {
  getCoverageCareMemoryState,
  memoryCreateId,
  memoryNow,
} from "@/lib/coverage-care/store/memory-store";
import { getCoverageCareTenant } from "@/lib/coverage-care/tenant-context";
import type {
  CoverageCareBrandApprovalStatus,
  CoverageCareBrandContentItem,
  CoverageCareContentKind,
} from "@/lib/coverage-care/types";

function assertBrandOsEnabled() {
  ensureCoverageCareEnabled();
  if (!coverageCareConfig.brandOsEnabled) {
    throw new Error("COVERAGE_CARE_BRANDOS_DISABLED");
  }
}

export function listBrandContent(
  tenantId?: string,
): CoverageCareBrandContentItem[] {
  assertBrandOsEnabled();
  const scoped = tenantId ?? getCoverageCareTenant().id;
  return getCoverageCareMemoryState()
    .brandItems.filter((item) => item.tenantId === scoped)
    .map((item) => ({ ...item }));
}

export function createBrandContent(input: {
  actor: CurrentUser;
  actorTenantId: string;
  kind: CoverageCareContentKind;
  title: string;
  body: string;
}): CoverageCareBrandContentItem {
  assertBrandOsEnabled();
  const tenant = getCoverageCareTenant();
  assertProviderTenantAdmin(input.actor, input.actorTenantId, tenant.id);

  const ts = memoryNow();
  const item: CoverageCareBrandContentItem = {
    id: memoryCreateId("brand"),
    tenantId: tenant.id,
    kind: input.kind,
    title: input.title.trim(),
    body: input.body.trim(),
    approvalStatus: "pending_approval",
    createdAt: ts,
    updatedAt: ts,
    reviewedAt: null,
    reviewedByUserId: null,
  };
  getCoverageCareMemoryState().brandItems.push(item);
  void recordCoverageCareAudit({
    actorUserId: input.actor.id,
    action: "coverage_care.brandos.created",
    entityType: "CoverageCareBrandContentItem",
    entityId: item.id,
  });
  return { ...item };
}

export function reviewBrandContent(input: {
  actor: CurrentUser;
  actorTenantId: string;
  itemId: string;
  approvalStatus: Extract<
    CoverageCareBrandApprovalStatus,
    "approved" | "rejected"
  >;
}): CoverageCareBrandContentItem {
  assertBrandOsEnabled();
  const tenant = getCoverageCareTenant();
  assertProviderTenantAdmin(input.actor, input.actorTenantId, tenant.id);

  const item = getCoverageCareMemoryState().brandItems.find(
    (row) => row.id === input.itemId,
  );
  if (!item) throw new Error("BRAND_CONTENT_NOT_FOUND");
  if (item.tenantId !== tenant.id) {
    throw new CoverageCarePermissionError(
      "Cross-tenant BrandOS access denied.",
      "TENANT_MISMATCH",
    );
  }

  item.approvalStatus = input.approvalStatus;
  item.reviewedAt = memoryNow();
  item.reviewedByUserId = input.actor.id;
  item.updatedAt = item.reviewedAt;

  void recordCoverageCareAudit({
    actorUserId: input.actor.id,
    action: `coverage_care.brandos.${input.approvalStatus}`,
    entityType: "CoverageCareBrandContentItem",
    entityId: item.id,
  });

  return { ...item };
}

export function getBrandMessaging(tenantId?: string) {
  assertBrandOsEnabled();
  const scoped = tenantId ?? getCoverageCareTenant().id;
  return (
    getCoverageCareMemoryState().brandMessaging[scoped] ?? {
      tagline: "",
      values: [],
      approvalStatus: "draft",
    }
  );
}
