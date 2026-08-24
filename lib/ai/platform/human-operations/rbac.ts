/**
 * Human Operations RBAC — category + tenant gates without admin universal bypass.
 */

import type { Permission } from "@/lib/auth/permissions";
import { getPermissionsForRole } from "@/lib/auth/permissions";
import type { UserRole } from "@/types/mapable";

import type {
  HumanOpsCategory,
  HumanOpsOperatorContext,
  HumanOpsReviewItem,
} from "./types";

export const CATEGORY_READ_PERMISSIONS: Record<
  HumanOpsCategory,
  readonly Permission[]
> = {
  care_coordination: [
    "admin:participants:read",
    "care:manage:any",
    "case:manage:any",
    "case:manage:self",
  ],
  transport_continuity: [
    "admin:bookings:read",
    "transport:manage:any",
    "transport:manage:org",
    "operator_dispatch:manage",
  ],
  access_evidence: [
    "admin:participants:read",
    "accessibility:read:any",
    "ambassador:audit",
  ],
  authority_review: ["admin:compliance:read", "ai_governance:read"],
  financial_review: [
    "admin:billing:read",
    "finance:review",
    "billing:view_all",
  ],
  credential_exception: [
    "admin:workers:read",
    "verification:manage:any",
    "verification:manage:org",
  ],
  employment_disclosure_review: [
    "admin:compliance:read",
    "jobs:manage:any",
    "fairness:review",
  ],
  safeguarding: ["admin:safeguarding:read", "safeguards:manage"],
  general_coordination: [
    "admin:command-centre:read",
    "admin:participants:read",
    "support:manage:any",
  ],
};

export const CATEGORY_WRITE_PERMISSIONS: Record<
  HumanOpsCategory,
  readonly Permission[]
> = {
  care_coordination: ["admin:actions:write", "care:manage:any", "case:manage:any"],
  transport_continuity: [
    "admin:actions:write",
    "transport:manage:any",
    "operator_dispatch:manage",
  ],
  access_evidence: ["admin:actions:write", "accessibility_map:manage"],
  authority_review: ["admin:actions:write", "ai_governance:read"],
  financial_review: [
    "admin:actions:write",
    "finance:approve_for_processing",
    "billing:audit",
  ],
  credential_exception: ["admin:actions:write", "verification:manage:any"],
  employment_disclosure_review: ["admin:actions:write", "fairness:review"],
  safeguarding: ["safeguards:manage", "admin:actions:write"],
  general_coordination: ["admin:actions:write", "support:manage:any"],
};

export const CATEGORY_REQUIRED_ROLE_LABEL: Record<HumanOpsCategory, string> = {
  care_coordination: "care_coordinator_or_case_operator",
  transport_continuity: "transport_ops_operator",
  access_evidence: "access_evidence_reviewer",
  authority_review: "authority_compliance_reviewer",
  financial_review: "finance_reviewer",
  credential_exception: "credential_verifier",
  employment_disclosure_review: "employment_disclosure_reviewer",
  safeguarding: "safeguarding_officer",
  general_coordination: "coordination_operator",
};

function asPermissionSet(permissions: readonly string[]): Set<string> {
  return new Set(permissions);
}

function hasAnyPermission(
  held: Set<string>,
  required: readonly Permission[],
): boolean {
  return required.some((p) => held.has(p));
}

export function buildOperatorContextFromRole(input: {
  operatorId: string;
  primaryRole: UserRole;
  tenantIds: string[];
  extraPermissions?: string[];
}): HumanOpsOperatorContext {
  const rolePerms = getPermissionsForRole(input.primaryRole);
  return {
    operatorId: input.operatorId,
    primaryRole: input.primaryRole,
    permissions: [...new Set([...rolePerms, ...(input.extraPermissions ?? [])])],
    tenantIds: [...input.tenantIds],
  };
}

export function canReadCategory(
  operator: HumanOpsOperatorContext,
  category: HumanOpsCategory,
): boolean {
  return hasAnyPermission(
    asPermissionSet(operator.permissions),
    CATEGORY_READ_PERMISSIONS[category],
  );
}

export function canWriteCategory(
  operator: HumanOpsOperatorContext,
  category: HumanOpsCategory,
): boolean {
  return hasAnyPermission(
    asPermissionSet(operator.permissions),
    CATEGORY_WRITE_PERMISSIONS[category],
  );
}

export function canAccessTenant(
  operator: HumanOpsOperatorContext,
  tenantId: string,
): boolean {
  if (!tenantId) return false;
  if (operator.tenantIds.length === 0) return false;
  return operator.tenantIds.includes(tenantId);
}

export function assertCanViewReview(
  operator: HumanOpsOperatorContext,
  item: HumanOpsReviewItem,
): { ok: true } | { ok: false; reason: string } {
  if (!canAccessTenant(operator, item.tenantId)) {
    return { ok: false, reason: "TENANT_ISOLATION" };
  }
  if (!canReadCategory(operator, item.category)) {
    return { ok: false, reason: "CATEGORY_FORBIDDEN" };
  }
  return { ok: true };
}

export function assertCanMutateReview(
  operator: HumanOpsOperatorContext,
  item: HumanOpsReviewItem,
): { ok: true } | { ok: false; reason: string } {
  const view = assertCanViewReview(operator, item);
  if (!view.ok) return view;
  if (!canWriteCategory(operator, item.category)) {
    return { ok: false, reason: "WRITE_FORBIDDEN" };
  }
  return { ok: true };
}

export function listReadableCategories(
  operator: HumanOpsOperatorContext,
): HumanOpsCategory[] {
  return (Object.keys(CATEGORY_READ_PERMISSIONS) as HumanOpsCategory[]).filter(
    (c) => canReadCategory(operator, c),
  );
}

export function filterQueueForOperator(
  items: HumanOpsReviewItem[],
  operator: HumanOpsOperatorContext,
): HumanOpsReviewItem[] {
  return items.filter((item) => assertCanViewReview(operator, item).ok);
}
