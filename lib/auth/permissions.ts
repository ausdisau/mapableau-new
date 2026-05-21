import type { MapAbleUserRole } from "@prisma/client";

import type { UserRole } from "@/types/mapable";

import { isAdminRole } from "./roles";

export type Permission =
  | "profile:read:self"
  | "profile:read:any"
  | "profile:write:self"
  | "profile:write:any"
  | "accessibility:read:self"
  | "accessibility:read:any"
  | "accessibility:write:self"
  | "consent:manage:self"
  | "consent:read:any"
  | "organisation:manage"
  | "booking:create"
  | "booking:read:self"
  | "booking:read:any"
  | "booking:manage:any"
  | "notification:read:self"
  | "audit:read"
  | "admin:dashboard"

  | "message:read"
  | "message:send"
  | "support:create"
  | "support:read:self"
  | "support:manage:any"
  | "document:read"
  | "document:upload"
  | "funding:manage:self"
  | "funding:read:any"
  | "invoice:read:self"
  | "invoice:read:org"
  | "invoice:manage:any"
  | "provider:booking:respond"
  | "admin:operations"
  | "care:read:self"
  | "care:manage:self"
  | "care:read:org"
  | "care:manage:org"
  | "care:manage:any"
  | "care:shift:work"
  | "transport:read:self"
  | "transport:manage:self"
  | "transport:read:org"
  | "transport:manage:org"
  | "transport:manage:any"
  | "transport:drive"
  | "worker:manage:org"
  | "worker:read:any"
  | "vehicle:manage:org"
  | "vehicle:read:any"
  | "driver:manage:org"
  | "driver:read:any"
  | "availability:manage:org"
  | "jobs:read:public"
  | "jobs:manage:employer"
  | "jobs:manage:any"
  | "jobs:apply"
  | "calendar:read:self"
  | "calendar:read:org"
  | "calendar:manage:any"
  | "admin:service-ops"
  | "matching:run"
  | "matching:select"
  | "search:providers"
  | "tracking:read:self"
  | "tracking:update:driver"
  | "tracking:update:admin"
  | "timesheet:manage:org"
  | "timesheet:read:self"
  | "timesheet:approve:self"
  | "incident:create"
  | "incident:read:self"
  | "incident:manage:any"
  | "agreement:read:self"
  | "agreement:manage:org"
  | "agreement:manage:any"
  | "ndis:manage"
  | "contracts:manage"
  | "attestation:read:self"
  | "attestation:read:any"
  | "admin:analytics"
  | "driver:trips"
  | "ai_matching:run"
  | "fairness:review"
  | "verification:manage:org"
  | "verification:manage:any"
  | "ndis:pricing:manage"
  | "xero:manage"
  | "stripe:manage"
  | "route:manage"
  | "accessibility_map:read"
  | "accessibility_map:manage"
  | "coordinator:portal"
  | "plan_manager:portal"
  | "employer:ats"
  | "reporting:manage"
  | "developer:manage"
  | "compliance:manage"
  | "security:readiness"
  | "ndia:readiness";

const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  participant: [
    "profile:read:self",
    "message:read",
    "message:send",
    "support:create",
    "support:read:self",
    "document:read",
    "document:upload",
    "funding:manage:self",
    "invoice:read:self",
    "profile:write:self",
    "accessibility:read:self",
    "accessibility:write:self",
    "consent:manage:self",
    "booking:create",
    "booking:read:self",
    "notification:read:self",
    "care:read:self",
    "care:manage:self",
    "transport:read:self",
    "transport:manage:self",
    "jobs:read:public",
    "jobs:apply",
    "calendar:read:self",
    "search:providers",
    "tracking:read:self",
    "timesheet:read:self",
    "timesheet:approve:self",
    "incident:create",
    "incident:read:self",
    "agreement:read:self",
    "attestation:read:self",
  ],
  family_member: [
    "profile:read:self",
    "booking:read:self",
    "notification:read:self",
  ],
  support_coordinator: [
    "profile:read:any",
    "booking:read:any",
    "notification:read:self",
    "coordinator:portal",
    "document:read",
    "invoice:read:self",
  ],
  support_worker: [
    "booking:read:any",
    "notification:read:self",
    "care:shift:work",
    "calendar:read:org",
    "timesheet:manage:org",
    "incident:create",
  ],
  provider_admin: [
    "booking:read:any",
    "notification:read:self",
    "message:read",
    "message:send",
    "support:create",
    "document:read",
    "document:upload",
    "invoice:read:org",
    "provider:booking:respond",
    "care:read:org",
    "care:manage:org",
    "worker:manage:org",
    "availability:manage:org",
    "calendar:read:org",
    "timesheet:manage:org",
    "agreement:manage:org",
    "incident:create",
    "verification:manage:org",
  ],
  transport_operator: [
    "booking:read:any",
    "notification:read:self",
    "message:read",
    "message:send",
    "support:create",
    "provider:booking:respond",
    "transport:read:org",
    "transport:manage:org",
    "vehicle:manage:org",
    "driver:manage:org",
    "availability:manage:org",
    "calendar:read:org",
  ],
  driver: [
    "booking:read:any",
    "notification:read:self",
    "transport:drive",
    "driver:trips",
    "tracking:update:driver",
    "incident:create",
    "calendar:read:org",
  ],
  employer: [
    "notification:read:self",
    "jobs:manage:employer",
    "employer:ats",
    "calendar:read:org",
    "message:read",
  ],
  plan_manager: [
    "plan_manager:portal",
    "invoice:read:self",
    "booking:read:any",
    "notification:read:self",
  ],
  mapable_admin: [
    "profile:read:any",
    "profile:write:any",
    "accessibility:read:any",
    "consent:read:any",
    "organisation:manage",
    "booking:read:any",
    "booking:manage:any",
    "audit:read",
    "admin:dashboard",
    "admin:operations",
    "message:read",
    "message:send",
    "support:manage:any",
    "document:read",
    "document:upload",
    "funding:read:any",
    "invoice:manage:any",
    "notification:read:self",
    "care:manage:any",
    "transport:manage:any",
    "worker:read:any",
    "vehicle:read:any",
    "driver:read:any",
    "jobs:manage:any",
    "calendar:manage:any",
    "admin:service-ops",
    "matching:run",
    "matching:select",
    "search:providers",
    "tracking:update:admin",
    "incident:manage:any",
    "agreement:manage:any",
    "ndis:manage",
    "contracts:manage",
    "attestation:read:any",
    "ai_matching:run",
    "fairness:review",
    "verification:manage:any",
    "ndis:pricing:manage",
    "xero:manage",
    "stripe:manage",
    "route:manage",
    "accessibility_map:manage",
    "reporting:manage",
    "developer:manage",
    "compliance:manage",
    "security:readiness",
    "ndia:readiness",
    "admin:analytics",
  ],
};

export function getPermissionsForRole(
  role: UserRole | MapAbleUserRole
): Permission[] {
  return ROLE_PERMISSIONS[role as UserRole] ?? [];
}

export function hasPermission(
  role: UserRole | MapAbleUserRole,
  permission: Permission
): boolean {
  if (isAdminRole(role)) return true;
  return getPermissionsForRole(role).includes(permission);
}

export function canViewParticipantProfile(
  actorRole: UserRole | MapAbleUserRole,
  actorId: string,
  participantUserId: string
): boolean {
  if (actorId === participantUserId) return true;
  if (isAdminRole(actorRole)) return true;
  if (
    actorRole === "support_coordinator" ||
    actorRole === "family_member"
  ) {
    return true;
  }
  return false;
}
