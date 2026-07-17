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
  | "admin:command-centre:read"
  | "admin:participants:read"
  | "admin:workers:read"
  | "admin:bookings:read"
  | "admin:safeguarding:read"
  | "admin:billing:read"
  | "admin:compliance:read"
  | "admin:agent-runs:read"
  | "admin:actions:write"
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
  | "provider:ndia:claim"
  | "provider:ndis:claim"
  | "provider:ndis:claim:view"
  | "provider:ndis:claim:create"
  | "provider:ndis:claim:approve"
  | "provider:ndis:claim:revoke"
  | "admin:ndis:claim:break_glass"
  | "provider:billing:view"
  | "provider:billing:create"
  | "provider:billing:validate"
  | "provider:billing:approve"
  | "provider:billing:correct"
  | "provider:billing:void"
  | "provider:evidence:view"
  | "provider:evidence:exception"
  | "participant:billing:view"
  | "participant:evidence:confirm"
  | "participant:billing:dispute"
  | "admin:billing:break_glass"
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
  | "assurance:read"
  | "assurance:manage"
  | "assurance:evidence:write"
  | "assurance:exceptions:manage"
  | "assurance:registration:manage"
  | "assurance:ndia-application:manage"
  | "assurance:go-live:decide"
  | "platform_trust:workers:read"
  | "platform_trust:workers:assess"
  | "ndia:readiness"
  | "launch:readiness"
  | "dispatch:manage"
  | "provider_quality:read"
  | "ai_governance:read"
  | "partner_sandbox:manage"
  | "board:reporting"
  | "community_governance:manage"
  | "open_data:export"
  | "government_reporting:manage"
  | "tenant:manage"
  | "reconciliation:manage"
  | "operator_dispatch:manage"
  | "enterprise:console"
  | "government:portal"
  | "public_beta:manage"
  | "social_impact:read"
  | "scale_plan:manage"
  | "ndia:pilot"
  | "transparency:publish"
  | "app_store:manage"
  | "transport_network:manage"
  | "compliance_renewal:manage"
  | "settlement:manage"
  | "national_insights:publish"
  | "api_versioning:manage"
  | "sla:report"
  | "grant:report"
  | "security_audit:manage"
  | "assessor:portal"
  | "platform_status:read"
  | "data_trust:manage"
  | "partner_marketplace:manage"
  | "national_rollout:manage"
  | "partner_billing:manage"
  | "partner_api:manage"
  | "assessor_network:manage"
  | "decision_register:publish"
  | "data_vault:self"
  | "data_vault:manage"
  | "research_safe_room:manage"
  | "provider_benchmark:read"
  | "governance_charter:manage"
  | "i18n:manage"
  | "longitudinal_impact:publish"
  | "api_certification:manage"
  | "algorithm_register:publish"
  | "oversight_board:read"
  | "oversight_board:manage"
  | "privacy_analytics:run"
  | "federated_research:manage"
  | "provider_academy:enroll"
  | "data_trust_report:publish"
  | "sustainability:manage"
  | "outcomes:read"
  | "accountability:publish"
  | "safeguards:read"
  | "safeguards:manage"
  | "membership:read"
  | "membership:manage"
  | "transport_investment:read"
  | "transport_investment:manage"
  | "api_ecosystem:manage"
  | "research_federation:manage"
  | "continuity:manage"
  | "continuity:read:self"
  | "continuity:manage:self"
  | "continuity:read:org"
  | "continuity:manage:org"
  | "continuity:signals:read"
  | "continuity:signals:manage"
  | "continuity:cases:read"
  | "continuity:cases:manage"
  | "continuity:cases:approve"
  | "continuity:recovery:draft"
  | "continuity:recovery:approve"
  | "continuity:recovery:execute"
  | "continuity:reservations:manage"
  | "continuity:life-events:read:self"
  | "continuity:life-events:manage:self"
  | "continuity:life-events:read:org"
  | "continuity:life-events:manage:org"
  | "continuity:standing-instructions:manage:self"
  | "continuity:standing-instructions:read:org"
  | "continuity:standing-instructions:manage:org"
  | "continuity:civic-feed:manage"
  | "civic_audit:publish"
  | "federation_partner:manage"
  | "case:read:self"
  | "case:read:any"
  | "case:manage:self"
  | "case:manage:any"
  | "case:ai:run"
  | "engagement:read:self"
  | "engagement:submit:self"
  | "engagement:manage:any"
  | "engagement:provider:read"
  | "pilot:view"
  | "pilot:create"
  | "pilot:approve"
  | "pilot:start"
  | "pilot:advance"
  | "pilot:pause"
  | "pilot:resume"
  | "pilot:terminate"
  | "pilot:participant:invite"
  | "pilot:participant:enrol"
  | "pilot:worker:authorise"
  | "pilot:operations:view"
  | "pilot:financial:view"
  | "pilot:reconciliation:resolve"
  | "pilot:incident:manage"
  | "pilot:complaint:manage"
  | "pilot:change:approve"
  | "participant:pilot:view"
  | "participant:pilot:consent"
  | "participant:pilot:withdraw"
  | "participant:pilot:complaint"
  | "participant:pilot:feedback"
  // Wave 8: governed multi-organisation production scale
  | "platform:tenants:read"
  | "platform:tenants:manage"
  | "platform:tenants:lifecycle"
  | "platform:entitlements:manage"
  | "platform:releases:read"
  | "platform:releases:manage"
  | "platform:releases:approve"
  | "platform:capacity:read"
  | "platform:capacity:manage"
  | "platform:continuous-assurance:read"
  | "platform:ga:read"
  | "platform:ga:decide"
  | "platform:federations:manage"
  | "platform:sre:read"
  | "platform:break-glass:request"
  | "platform:break-glass:approve"
  | "platform:regulatory:manage"
  | "tenant:admin:read"
  | "tenant:admin:manage"
  | "tenant:entitlements:read"
  | "tenant:policies:read"
  | "tenant:policies:manage"
  | "tenant:quotas:read"
  | "tenant:assurance:read"
  | "tenant:switch"
  // Wave 9: participant-controlled credentials and consent federation
  | "vault:read:self"
  | "vault:manage:self"
  | "vault:package:read:self"
  | "vault:package:manage:self"
  | "vault:access-history:read:self"
  | "vault:delegate:manage:self"
  | "vault:emergency:invoke:self"
  | "vault:read:any"
  | "vault:manage:any"
  | "consent_directive:read:self"
  | "consent_directive:manage:self"
  | "consent_directive:read:any"
  | "consent_directive:manage:any"
  | "consent_receipt:read:self"
  | "consent_receipt:read:any"
  | "delegate:read:self"
  | "delegate:manage:self"
  | "delegate:read:any"
  | "delegate:manage:any"
  | "wallet:read:self"
  | "wallet:activate:self"
  | "wallet:manage:self"
  | "wallet:recovery:self"
  | "wallet:read:any"
  | "wallet:manage:any"
  | "credential:read:self"
  | "credential:present:self"
  | "credential:issue:self"
  | "credential:read:any"
  | "credential:issue:any"
  | "credential:verify:any"
  | "credential:trust:manage"
  | "credential:schema:manage"
  | "credential:statuslist:manage"
  | "federation:read:any"
  | "federation:manage:any"
  | "federation:verifier:manage"
  | "federation:issuer:manage"
  | "federation:conformance:run"
  | "federation:disclosure:read:self"
  | "federation:disclosure:manage:any"
  | "federation:emergency:review"
  | "portability:export:self"
  | "portability:import:self"
  | "provider:federation:read"
  | "provider:federation:issue"
  | "provider:federation:verify"
  | "provider:federation:disclose"
  // Wave 13: public-interest governance
  | "governance:system:read"
  | "governance:system:manage"
  | "governance:system:assess"
  | "governance:system:publish"
  | "governance:system:suspend"
  | "governance:decision:read:self"
  | "governance:appeal:create"
  | "governance:appeal:read:self"
  | "governance:appeal:evidence:self"
  | "governance:appeal:withdraw:self"
  | "governance:appeal:read"
  | "governance:appeal:assign"
  | "governance:appeal:decide"
  | "governance:appeal:remedy"
  | "governance:community:read"
  | "governance:community:recommend"
  | "governance:community:respond";

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
    "data_vault:self",
    "outcomes:read",
    "safeguards:read",
    "membership:read",
    "transport_investment:read",
    "case:read:self",
    "engagement:read:self",
    "engagement:submit:self",
    "participant:billing:view",
    "participant:evidence:confirm",
    "participant:billing:dispute",
    "participant:pilot:view",
    "participant:pilot:consent",
    "participant:pilot:withdraw",
    "participant:pilot:complaint",
    "participant:pilot:feedback",
    "vault:read:self",
    "vault:manage:self",
    "vault:package:read:self",
    "vault:package:manage:self",
    "vault:access-history:read:self",
    "vault:delegate:manage:self",
    "vault:emergency:invoke:self",
    "consent_directive:read:self",
    "consent_directive:manage:self",
    "consent_receipt:read:self",
    "delegate:read:self",
    "delegate:manage:self",
    "wallet:read:self",
    "wallet:activate:self",
    "wallet:manage:self",
    "wallet:recovery:self",
    "credential:read:self",
    "credential:present:self",
    "credential:issue:self",
    "federation:disclosure:read:self",
    "portability:export:self",
    "portability:import:self",
    "continuity:read:self",
    "continuity:manage:self",
    "continuity:life-events:read:self",
    "continuity:life-events:manage:self",
    "continuity:standing-instructions:manage:self",
    "governance:decision:read:self",
    "governance:appeal:create",
    "governance:appeal:read:self",
    "governance:appeal:evidence:self",
    "governance:appeal:withdraw:self",
    "governance:community:read",
    "governance:community:recommend",
  ],
  family_member: [
    "profile:read:self",
    "booking:read:self",
    "transport:read:self",
    "notification:read:self",
    "engagement:read:self",
    "engagement:submit:self",
  ],
  support_coordinator: [
    "profile:read:any",
    "booking:read:any",
    "notification:read:self",
    "coordinator:portal",
    "document:read",
    "invoice:read:self",
    "case:read:any",
    "case:manage:self",
    "case:ai:run",
    "admin:command-centre:read",
    "admin:participants:read",
    "admin:bookings:read",
    "continuity:read:org",
    "continuity:manage:org",
    "continuity:signals:read",
    "continuity:signals:manage",
    "continuity:cases:read",
    "continuity:cases:manage",
    "continuity:cases:approve",
    "continuity:recovery:draft",
    "continuity:recovery:approve",
    "continuity:recovery:execute",
    "continuity:reservations:manage",
    "continuity:life-events:read:org",
    "continuity:life-events:manage:org",
    "continuity:standing-instructions:read:org",
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
    "enterprise:console",
    "operator_dispatch:manage",
    "provider_academy:enroll",
    "provider:ndia:claim",
    "provider:ndis:claim",
    "provider:ndis:claim:view",
    "provider:ndis:claim:create",
    "provider:ndis:claim:approve",
    "provider:ndis:claim:revoke",
    "provider:billing:view",
    "provider:billing:create",
    "provider:billing:validate",
    "provider:billing:approve",
    "provider:billing:correct",
    "provider:billing:void",
    "provider:evidence:view",
    "provider:evidence:exception",
    "provider:federation:read",
    "provider:federation:issue",
    "provider:federation:verify",
    "provider:federation:disclose",
    "engagement:provider:read",
    "platform_trust:workers:read",
    "platform_trust:workers:assess",
    "pilot:view",
    "pilot:participant:invite",
    "pilot:participant:enrol",
    "pilot:worker:authorise",
    "pilot:operations:view",
    "pilot:financial:view",
    "pilot:incident:manage",
    "pilot:complaint:manage",
    "tenant:admin:read",
    "tenant:admin:manage",
    "tenant:entitlements:read",
    "tenant:policies:read",
    "tenant:quotas:read",
    "tenant:assurance:read",
    "tenant:switch",
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
    "operator_dispatch:manage",
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
    "case:read:any",
    "case:manage:self",
    "case:ai:run",
    "admin:command-centre:read",
    "admin:billing:read",
    "admin:bookings:read",
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
    "provider:ndia:claim",
    "provider:ndis:claim",
    "provider:ndis:claim:view",
    "provider:ndis:claim:create",
    "provider:ndis:claim:approve",
    "provider:ndis:claim:revoke",
    "admin:ndis:claim:break_glass",
    "provider:billing:view",
    "provider:billing:create",
    "provider:billing:validate",
    "provider:billing:approve",
    "provider:billing:correct",
    "provider:billing:void",
    "provider:evidence:view",
    "provider:evidence:exception",
    "admin:billing:break_glass",
    "xero:manage",
    "stripe:manage",
    "route:manage",
    "accessibility_map:manage",
    "reporting:manage",
    "developer:manage",
    "compliance:manage",
    "security:readiness",
    "assurance:read",
    "assurance:manage",
    "assurance:evidence:write",
    "assurance:exceptions:manage",
    "assurance:registration:manage",
    "assurance:ndia-application:manage",
    "assurance:go-live:decide",
    "platform_trust:workers:read",
    "platform_trust:workers:assess",
    "ndia:readiness",
    "admin:analytics",
    "engagement:manage:any",
    "launch:readiness",
    "dispatch:manage",
    "provider_quality:read",
    "ai_governance:read",
    "partner_sandbox:manage",
    "board:reporting",
    "community_governance:manage",
    "open_data:export",
    "government_reporting:manage",
    "tenant:manage",
    "reconciliation:manage",
    "operator_dispatch:manage",
    "enterprise:console",
    "government:portal",
    "public_beta:manage",
    "social_impact:read",
    "scale_plan:manage",
    "ndia:pilot",
    "transparency:publish",
    "app_store:manage",
    "transport_network:manage",
    "compliance_renewal:manage",
    "settlement:manage",
    "national_insights:publish",
    "api_versioning:manage",
    "sla:report",
    "grant:report",
    "security_audit:manage",
    "assessor:portal",
    "platform_status:read",
    "data_trust:manage",
    "partner_marketplace:manage",
    "national_rollout:manage",
    "partner_billing:manage",
    "partner_api:manage",
    "assessor_network:manage",
    "decision_register:publish",
    "data_vault:manage",
    "research_safe_room:manage",
    "provider_benchmark:read",
    "governance_charter:manage",
    "i18n:manage",
    "longitudinal_impact:publish",
    "api_certification:manage",
    "algorithm_register:publish",
    "oversight_board:read",
    "oversight_board:manage",
    "privacy_analytics:run",
    "federated_research:manage",
    "provider_academy:enroll",
    "data_trust_report:publish",
    "sustainability:manage",
    "outcomes:read",
    "accountability:publish",
    "safeguards:read",
    "safeguards:manage",
    "membership:read",
    "membership:manage",
    "transport_investment:read",
    "transport_investment:manage",
    "api_ecosystem:manage",
    "research_federation:manage",
    "continuity:manage",
    "continuity:read:org",
    "continuity:manage:org",
    "continuity:signals:read",
    "continuity:signals:manage",
    "continuity:cases:read",
    "continuity:cases:manage",
    "continuity:cases:approve",
    "continuity:recovery:draft",
    "continuity:recovery:approve",
    "continuity:recovery:execute",
    "continuity:reservations:manage",
    "continuity:life-events:read:org",
    "continuity:life-events:manage:org",
    "continuity:standing-instructions:read:org",
    "continuity:standing-instructions:manage:org",
    "continuity:civic-feed:manage",
    "civic_audit:publish",
    "federation_partner:manage",
    "case:read:any",
    "case:manage:any",
    "case:ai:run",
    "admin:command-centre:read",
    "admin:participants:read",
    "admin:workers:read",
    "admin:bookings:read",
    "admin:safeguarding:read",
    "admin:billing:read",
    "admin:compliance:read",
    "admin:agent-runs:read",
    "admin:actions:write",
    "pilot:view",
    "pilot:create",
    "pilot:approve",
    "pilot:start",
    "pilot:advance",
    "pilot:pause",
    "pilot:resume",
    "pilot:terminate",
    "pilot:participant:invite",
    "pilot:participant:enrol",
    "pilot:worker:authorise",
    "pilot:operations:view",
    "pilot:financial:view",
    "pilot:reconciliation:resolve",
    "pilot:incident:manage",
    "pilot:complaint:manage",
    "pilot:change:approve",
    "platform:tenants:read",
    "platform:tenants:manage",
    "platform:tenants:lifecycle",
    "platform:entitlements:manage",
    "platform:releases:read",
    "platform:releases:manage",
    "platform:releases:approve",
    "platform:capacity:read",
    "platform:capacity:manage",
    "platform:continuous-assurance:read",
    "platform:ga:read",
    "platform:ga:decide",
    "platform:federations:manage",
    "platform:sre:read",
    "platform:break-glass:request",
    "platform:break-glass:approve",
    "platform:regulatory:manage",
    "tenant:admin:read",
    "tenant:admin:manage",
    "tenant:entitlements:read",
    "tenant:policies:read",
    "tenant:policies:manage",
    "tenant:quotas:read",
    "tenant:assurance:read",
    "tenant:switch",
    "vault:read:any",
    "vault:manage:any",
    "consent_directive:read:any",
    "consent_directive:manage:any",
    "consent_receipt:read:any",
    "delegate:read:any",
    "delegate:manage:any",
    "wallet:read:any",
    "wallet:manage:any",
    "credential:read:any",
    "credential:issue:any",
    "credential:verify:any",
    "credential:trust:manage",
    "credential:schema:manage",
    "credential:statuslist:manage",
    "federation:read:any",
    "federation:manage:any",
    "federation:verifier:manage",
    "federation:issuer:manage",
    "federation:conformance:run",
    "federation:disclosure:manage:any",
    "federation:emergency:review",
    "governance:system:read",
    "governance:system:manage",
    "governance:system:assess",
    "governance:system:publish",
    "governance:system:suspend",
    "governance:decision:read:self",
    "governance:appeal:create",
    "governance:appeal:read:self",
    "governance:appeal:evidence:self",
    "governance:appeal:withdraw:self",
    "governance:appeal:read",
    "governance:appeal:assign",
    "governance:appeal:decide",
    "governance:appeal:remedy",
    "governance:community:read",
    "governance:community:recommend",
    "governance:community:respond",
  ],
};

/** Back-of-house admin API/page permissions */
export const ADMIN_SCOPE_PERMISSIONS: Permission[] = [
  "admin:command-centre:read",
  "admin:participants:read",
  "admin:workers:read",
  "admin:bookings:read",
  "admin:safeguarding:read",
  "admin:billing:read",
  "admin:compliance:read",
  "admin:agent-runs:read",
  "admin:actions:write",
];

export function hasAnyAdminScopePermission(
  role: UserRole | MapAbleUserRole,
): boolean {
  if (isAdminRole(role)) return true;
  return ADMIN_SCOPE_PERMISSIONS.some((p) =>
    getPermissionsForRole(role).includes(p),
  );
}

export function getPermissionsForRole(
  role: UserRole | MapAbleUserRole,
): Permission[] {
  return ROLE_PERMISSIONS[role as UserRole] ?? [];
}

export function hasPermission(
  role: UserRole | MapAbleUserRole,
  permission: Permission,
): boolean {
  if (isAdminRole(role)) return true;
  return getPermissionsForRole(role).includes(permission);
}

export function canViewParticipantProfile(
  actorRole: UserRole | MapAbleUserRole,
  actorId: string,
  participantUserId: string,
): boolean {
  if (actorId === participantUserId) return true;
  if (isAdminRole(actorRole)) return true;
  if (actorRole === "support_coordinator" || actorRole === "family_member") {
    return true;
  }
  return false;
}
