import type { MapAbleUserRole } from "@prisma/client";

import type { UserRole } from "@/types/mapable";

export const ALL_ROLES: UserRole[] = [
  "participant",
  "family_member",
  "support_coordinator",
  "support_worker",
  "provider_admin",
  "transport_operator",
  "driver",
  "employer",
  "plan_manager",
  "mapable_admin",
  "quality_lead",
  "finance_lead",
  "board_viewer",
];

export const ADMIN_ROLES: UserRole[] = ["mapable_admin"];

export const PARTICIPANT_FAMILY_ROLES: UserRole[] = [
  "participant",
  "family_member",
];

export const SUPPORT_ROLES: UserRole[] = [
  "support_coordinator",
  "support_worker",
  "family_member",
];

export function isAdminRole(role: UserRole | MapAbleUserRole): boolean {
  return role === "mapable_admin";
}

export function roleLabel(role: UserRole | MapAbleUserRole): string {
  const labels: Record<string, string> = {
    participant: "Participant",
    family_member: "Family member",
    support_coordinator: "Support coordinator",
    support_worker: "Support worker",
    provider_admin: "Provider admin",
    transport_operator: "Transport operator",
    driver: "Driver",
    employer: "Employer",
    plan_manager: "Plan manager",
    mapable_admin: "MapAble admin",
    quality_lead: "Quality lead",
    finance_lead: "Finance lead",
    board_viewer: "Board viewer",
  };
  return labels[role] ?? role;
}

export function defaultDashboardPath(role: UserRole | MapAbleUserRole): string {
  if (isAdminRole(role)) return "/admin";
  if (role === "quality_lead") return "/quality/reports";
  if (role === "finance_lead") return "/finance/reports";
  if (role === "board_viewer") return "/admin/reports/board_pack";
  if (role === "provider_admin" || role === "transport_operator") {
    return "/provider/onboarding";
  }
  return "/dashboard";
}
