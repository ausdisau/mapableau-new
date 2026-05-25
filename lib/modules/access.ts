import type { CurrentUser } from "@/lib/auth/current-user";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { hasPermission } from "@/lib/auth/permissions";
import { isAdminRole } from "@/lib/auth/roles";

type ModuleAccessTarget = {
  participantId?: string | null;
  organisationId?: string | null;
  operatorOrgId?: string | null;
  employerOrgId?: string | null;
};

export type ModuleAccessResult =
  | { ok: true; organisationIds: string[] }
  | { ok: false; reason: "forbidden" };

async function actorOrganisationIds(actor: CurrentUser) {
  return getUserOrganisationIds(actor.id);
}

function selfAllowed(actor: CurrentUser, participantId?: string | null) {
  return Boolean(participantId && participantId === actor.id);
}

function orgAllowed(orgIds: string[], organisationId?: string | null) {
  return Boolean(organisationId && orgIds.includes(organisationId));
}

export async function resolveCareAccess(
  actor: CurrentUser,
  target: ModuleAccessTarget,
): Promise<ModuleAccessResult> {
  const organisationIds = await actorOrganisationIds(actor);
  const allowed =
    isAdminRole(actor.primaryRole) ||
    (selfAllowed(actor, target.participantId) &&
      hasPermission(actor.primaryRole, "care:read:self")) ||
    (orgAllowed(organisationIds, target.organisationId) &&
      hasPermission(actor.primaryRole, "care:read:org"));
  return allowed
    ? { ok: true, organisationIds }
    : { ok: false, reason: "forbidden" };
}

export async function resolveTransportAccess(
  actor: CurrentUser,
  target: ModuleAccessTarget,
): Promise<ModuleAccessResult> {
  const organisationIds = await actorOrganisationIds(actor);
  const allowed =
    isAdminRole(actor.primaryRole) ||
    (selfAllowed(actor, target.participantId) &&
      hasPermission(actor.primaryRole, "transport:read:self")) ||
    (orgAllowed(
      organisationIds,
      target.operatorOrgId ?? target.organisationId,
    ) &&
      hasPermission(actor.primaryRole, "transport:read:org"));
  return allowed
    ? { ok: true, organisationIds }
    : { ok: false, reason: "forbidden" };
}

export async function resolveEmploymentAccess(
  actor: CurrentUser,
  target: ModuleAccessTarget,
): Promise<ModuleAccessResult> {
  const organisationIds = await actorOrganisationIds(actor);
  const allowed =
    isAdminRole(actor.primaryRole) ||
    selfAllowed(actor, target.participantId) ||
    (orgAllowed(
      organisationIds,
      target.employerOrgId ?? target.organisationId,
    ) &&
      hasPermission(actor.primaryRole, "jobs:manage:employer"));
  return allowed
    ? { ok: true, organisationIds }
    : { ok: false, reason: "forbidden" };
}
