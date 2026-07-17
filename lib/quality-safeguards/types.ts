import type {
  QsCapabilityCode,
  SafeguardSignalSourceType,
  SafeguardSignalStatus,
  SafeguardSignalUrgency,
  SafeguardServiceVertical,
} from "@prisma/client";

import type { Permission } from "@/lib/auth/permissions";

export type QualitySafeguardsRole =
  | "participant"
  | "participant_nominee"
  | "advocate"
  | "worker"
  | "provider_manager"
  | "quality_officer"
  | "safeguarding_lead"
  | "incident_manager"
  | "complaints_officer"
  | "hr_credential_officer"
  | "behaviour_support_lead"
  | "executive"
  | "board_viewer"
  | "external_auditor"
  | "system_admin";

export type QualitySafeguardsCapability =
  | "incident:create"
  | "incident:view_assigned"
  | "incident:view_all"
  | "incident:triage"
  | "incident:confirm_reportability"
  | "incident:close"
  | "complaint:create"
  | "complaint:investigate"
  | "complaint:resolve"
  | "complaint:view_identity"
  | "evidence:add"
  | "evidence:export"
  | "credential:verify"
  | "worker:restrict_assignment"
  | "capa:approve"
  | "audit:manage"
  | "audit:view"
  | "policy:publish"
  | "restrictive_practice:view"
  | "restrictive_practice:manage"
  | "analytics:view_identified"
  | "analytics:view_deidentified"
  | "qs:ops:read"
  | "qs:signal:triage";

export interface RuleTrigger {
  code: string;
  version: string;
  triggeredAt: string;
  advisory: boolean;
  summary: string;
  confidence?: number;
  suggestedAction?: string;
  requiredReviewerRole?: string;
}

export interface SafeguardSignalInput {
  organisationId?: string | null;
  sourceType: SafeguardSignalSourceType;
  sourceId?: string | null;
  participantId?: string | null;
  workerId?: string | null;
  providerId?: string | null;
  serviceVertical?: SafeguardServiceVertical;
  summary: string;
  observedAt: Date;
  urgency?: SafeguardSignalUrgency;
  immediateSafetyConcern?: boolean;
  ruleTriggers?: RuleTrigger[];
  createdById?: string | null;
  isAnonymous?: boolean;
  assignedTeam?: string | null;
  assignedUserId?: string | null;
}

export type SignalTriageAction =
  | "triage"
  | "link"
  | "convert_to_case"
  | "dismiss_with_reason"
  | "request_more_info"
  | "record_immediate_action";

export interface SignalTriageInput {
  action: SignalTriageAction;
  reason?: string;
  notes?: string;
  linkedSignalId?: string;
  convertedResourceType?: string;
  convertedResourceId?: string;
  assignedUserId?: string | null;
  urgency?: SafeguardSignalUrgency;
  immediateSafetyConcern?: boolean;
}

export interface DeadlineDuration {
  kind: "hours" | "businessDays" | "calendarDays";
  value: number;
}

export interface DeadlineRuleDefinition {
  code: string;
  version: string;
  triggerEvent: string;
  duration: DeadlineDuration;
  jurisdiction?: string;
  priority: "critical" | "high" | "normal";
  escalationPath: string[];
  sourceReference?: string;
  effectiveFrom: string;
  effectiveTo?: string;
}

export const QS_CAPABILITY_TO_PERMISSION: Record<
  QsCapabilityCode,
  Permission
> = {
  qs_ops_read: "qs:ops:read",
  qs_signal_triage: "qs:signal:triage",
  incident_triage: "incident:triage",
  incident_confirm_reportability: "incident:confirm_reportability",
  incident_close: "incident:close",
  complaint_investigate: "complaint:investigate",
  complaint_resolve: "complaint:resolve",
  complaint_view_identity: "complaint:view_identity",
  evidence_add: "evidence:add",
  evidence_export: "evidence:export",
  credential_verify: "credential:verify",
  worker_restrict_assignment: "worker:restrict_assignment",
  capa_approve: "capa:approve",
  audit_manage: "audit:manage",
  audit_view: "audit:view",
  policy_publish: "policy:publish",
  restrictive_practice_view: "restrictive_practice:view",
  restrictive_practice_manage: "restrictive_practice:manage",
  analytics_view_identified: "analytics:view_identified",
  analytics_view_deidentified: "analytics:view_deidentified",
};

export const PERMISSION_TO_QS_CAPABILITY: Partial<
  Record<Permission, QsCapabilityCode>
> = Object.fromEntries(
  Object.entries(QS_CAPABILITY_TO_PERMISSION).map(([cap, perm]) => [
    perm,
    cap as QsCapabilityCode,
  ])
) as Partial<Record<Permission, QsCapabilityCode>>;

export type { SafeguardSignalStatus };
