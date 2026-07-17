import type { QsCapabilityCode } from "@prisma/client";

import type { CurrentUser } from "@/lib/auth/current-user";
import { apiForbidden } from "@/lib/auth/guards";
import { hasPermission, type Permission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

import {
  PERMISSION_TO_QS_CAPABILITY,
  QS_CAPABILITY_TO_PERMISSION,
} from "./types";

export function permissionForCapability(
  capability: QsCapabilityCode
): Permission {
  return QS_CAPABILITY_TO_PERMISSION[capability];
}

export function capabilityForPermission(
  permission: Permission
): QsCapabilityCode | undefined {
  return PERMISSION_TO_QS_CAPABILITY[permission];
}

/** Role permission OR org-scoped grant. mapable_admin short-circuits. */
export async function userHasQsCapability(
  user: CurrentUser,
  capability: QsCapabilityCode,
  organisationId?: string | null
): Promise<boolean> {
  if (isAdminRole(user.primaryRole)) return true;

  const permission = permissionForCapability(capability);
  if (hasPermission(user.primaryRole, permission)) return true;

  const now = new Date();
  const grant = await prisma.qsCapabilityGrant.findFirst({
    where: {
      userId: user.id,
      capability,
      activeFrom: { lte: now },
      AND: [
        { OR: [{ activeTo: null }, { activeTo: { gt: now } }] },
        ...(organisationId
          ? [
              {
                OR: [{ organisationId }, { organisationId: null }],
              },
            ]
          : []),
      ],
    },
  });

  return Boolean(grant);
}

export async function requireQsCapability(
  user: CurrentUser,
  capability: QsCapabilityCode,
  organisationId?: string | null
): Promise<true | Response> {
  const allowed = await userHasQsCapability(user, capability, organisationId);
  if (!allowed) return apiForbidden("Missing Quality & Safeguards capability");
  return true;
}

/** Persona presets mapped to capability codes (not new MapAbleUserRole values). */
export const QS_ROLE_PRESETS: Record<string, QsCapabilityCode[]> = {
  quality_officer: [
    "qs_ops_read",
    "qs_signal_triage",
    "incident_triage",
    "complaint_investigate",
    "complaint_resolve",
    "evidence_add",
    "capa_approve",
    "analytics_view_deidentified",
  ],
  safeguarding_lead: [
    "qs_ops_read",
    "qs_signal_triage",
    "incident_triage",
    "incident_confirm_reportability",
    "complaint_view_identity",
    "evidence_add",
    "evidence_export",
    "analytics_view_identified",
  ],
  incident_manager: [
    "qs_ops_read",
    "qs_signal_triage",
    "incident_triage",
    "incident_confirm_reportability",
    "incident_close",
    "evidence_add",
    "evidence_export",
  ],
  complaints_officer: [
    "qs_ops_read",
    "qs_signal_triage",
    "complaint_investigate",
    "complaint_resolve",
    "complaint_view_identity",
    "evidence_add",
  ],
  hr_credential_officer: [
    "qs_ops_read",
    "credential_verify",
    "worker_restrict_assignment",
  ],
  behaviour_support_lead: [
    "qs_ops_read",
    "restrictive_practice_view",
    "restrictive_practice_manage",
    "evidence_add",
  ],
  executive: [
    "qs_ops_read",
    "analytics_view_deidentified",
    "audit_view",
    "capa_approve",
  ],
  board_viewer: ["qs_ops_read", "analytics_view_deidentified", "audit_view"],
  external_auditor: ["audit_view", "analytics_view_deidentified"],
  system_admin: Object.keys(QS_CAPABILITY_TO_PERMISSION) as QsCapabilityCode[],
};

export function assertTenantMatch(
  resourceOrganisationId: string | null | undefined,
  requestedOrganisationId: string | null | undefined
): boolean {
  if (!resourceOrganisationId || !requestedOrganisationId) {
    // Platform admins may see unscoped records; callers must still check role.
    return true;
  }
  return resourceOrganisationId === requestedOrganisationId;
}
