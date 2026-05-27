import type { MapAbleUserRole, ReportCategory } from "@prisma/client";

import { isAdminRole } from "@/lib/auth/roles";

const CATEGORY_PERMISSIONS: Partial<Record<ReportCategory, string[]>> = {
  participant_activity: ["report:run", "reporting:manage"],
  provider_operations: ["report:run", "care:read:org", "reporting:manage"],
  care_delivery: ["report:run", "care:read:org", "reporting:manage"],
  transport_delivery: ["report:run", "transport:read:org", "reporting:manage"],
  employment_outcomes: ["report:run", "reporting:manage"],
  marketplace_activity: ["report:run", "reporting:manage"],
  food_delivery: ["report:run", "reporting:manage"],
  billing_finance: ["report:run", "invoice:read:any", "plan_manager:portal", "reporting:manage"],
  plan_manager_review: ["report:run", "plan_manager:portal", "reporting:manage"],
  quality_safeguards: ["report:run", "provider_quality:read", "reporting:manage"],
  privacy_security: ["report:run", "privacy:breach:manage", "reporting:manage"],
  peer_community: ["report:run", "reporting:manage"],
  access_map: ["report:run", "accessibility_map:read", "reporting:manage"],
  board_pack: ["report:run", "board:reporting", "reporting:manage"],
};

const ROLE_CATEGORY_ALLOWLIST: Partial<Record<MapAbleUserRole, ReportCategory[]>> = {
  board_viewer: ["board_pack"],
  finance_lead: ["billing_finance", "plan_manager_review"],
  plan_manager: ["billing_finance", "plan_manager_review"],
  quality_lead: ["quality_safeguards", "privacy_security"],
  provider_admin: [
    "provider_operations",
    "care_delivery",
    "transport_delivery",
    "employment_outcomes",
  ],
  participant: ["participant_activity"],
};

export function canRunReportCategory(
  role: MapAbleUserRole,
  category: ReportCategory,
  permissions: string[]
): boolean {
  if (isAdminRole(role)) return true;

  const allowedCategories = ROLE_CATEGORY_ALLOWLIST[role];
  if (allowedCategories && !allowedCategories.includes(category)) {
    return false;
  }

  const required = CATEGORY_PERMISSIONS[category] ?? ["report:run"];
  return required.some((p) => permissions.includes(p));
}

export function canExportReport(role: MapAbleUserRole, permissions: string[]): boolean {
  if (isAdminRole(role)) return true;
  return permissions.includes("report:export");
}

export function requiresDeidentifiedView(role: MapAbleUserRole): boolean {
  return role === "board_viewer";
}

export function canViewRawAuditLogs(role: MapAbleUserRole, permissions: string[]): boolean {
  if (isAdminRole(role)) return permissions.includes("audit:read:privileged");
  return permissions.includes("audit:read:privileged");
}

export function canViewOrgAudit(role: MapAbleUserRole, permissions: string[]): boolean {
  if (isAdminRole(role)) return true;
  return permissions.includes("audit:read:org") || permissions.includes("audit:read");
}
