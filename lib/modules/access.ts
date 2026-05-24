import type { MapAbleUserRole } from "@prisma/client";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import type { CurrentUser } from "@/lib/auth/current-user";
import { isAdminRole } from "@/lib/auth/roles";
import { prisma } from "@/lib/prisma";

export type ModuleAccessResult = {
  participantId?: string;
  organisationId?: string;
  viewAsDelegate?: boolean;
};

async function hasDelegateConsent(
  participantId: string,
  delegateUserId: string,
): Promise<boolean> {
  const consent = await prisma.consentRecord.findFirst({
    where: {
      subjectUserId: participantId,
      grantedToUserId: delegateUserId,
      status: "active",
      scope: {
        in: [
          "profile_read",
          "booking_read",
          "booking_manage",
          "support_coordination_access",
        ],
      },
    },
    select: { id: true },
  });
  return Boolean(consent);
}

function isParticipantFamilyRole(role: MapAbleUserRole): boolean {
  return role === "participant" || role === "family_member";
}

function isCoordinatorRole(role: MapAbleUserRole): boolean {
  return role === "support_coordinator";
}

export async function resolveCareAccess(
  actor: CurrentUser,
  opts?: { participantId?: string | null; organisationId?: string | null },
): Promise<ModuleAccessResult | null> {
  const requestedParticipant = opts?.participantId?.trim();
  const requestedOrg = opts?.organisationId?.trim();
  const role = actor.primaryRole as MapAbleUserRole;

  if (isAdminRole(role)) {
    return {
      participantId: requestedParticipant,
      organisationId: requestedOrg,
      viewAsDelegate: true,
    };
  }

  if (requestedParticipant) {
    if (actor.id === requestedParticipant) {
      return { participantId: requestedParticipant, viewAsDelegate: false };
    }
    if (
      isCoordinatorRole(role) ||
      isParticipantFamilyRole(role) ||
      actor.roles.includes("support_coordinator")
    ) {
      const ok = await hasDelegateConsent(requestedParticipant, actor.id);
      if (!ok) return null;
      return { participantId: requestedParticipant, viewAsDelegate: true };
    }
    if (requestedOrg) {
      const orgIds = await getUserOrganisationIds(actor.id);
      if (orgIds.includes(requestedOrg)) {
        return {
          participantId: requestedParticipant,
          organisationId: requestedOrg,
          viewAsDelegate: false,
        };
      }
    }
    return null;
  }

  if (role === "participant" || actor.roles.includes("participant")) {
    return { participantId: actor.id, viewAsDelegate: false };
  }

  if (requestedOrg || role === "provider_admin" || role === "support_worker") {
    const orgIds = await getUserOrganisationIds(actor.id);
    if (requestedOrg && !orgIds.includes(requestedOrg)) return null;
    if (orgIds.length > 0) {
      return { organisationId: requestedOrg ?? orgIds[0], viewAsDelegate: false };
    }
  }

  return null;
}

export async function resolveTransportAccess(
  actor: CurrentUser,
  opts?: {
    participantId?: string | null;
    operatorOrganisationId?: string | null;
  },
): Promise<ModuleAccessResult | null> {
  const requestedParticipant = opts?.participantId?.trim();
  const requestedOp = opts?.operatorOrganisationId?.trim();
  const role = actor.primaryRole as MapAbleUserRole;

  if (isAdminRole(role)) {
    return {
      participantId: requestedParticipant,
      organisationId: requestedOp,
      viewAsDelegate: true,
    };
  }

  if (requestedParticipant) {
    if (actor.id === requestedParticipant) {
      return { participantId: requestedParticipant, viewAsDelegate: false };
    }
    if (isCoordinatorRole(role) || isParticipantFamilyRole(role)) {
      const ok = await hasDelegateConsent(requestedParticipant, actor.id);
      if (!ok) return null;
      return { participantId: requestedParticipant, viewAsDelegate: true };
    }
    return null;
  }

  if (role === "participant" || actor.roles.includes("participant")) {
    return { participantId: actor.id, viewAsDelegate: false };
  }

  if (
    role === "transport_operator" ||
    role === "driver" ||
    role === "provider_admin"
  ) {
    const orgIds = await getUserOrganisationIds(actor.id);
    if (requestedOp && !orgIds.includes(requestedOp)) return null;
    if (orgIds.length > 0) {
      return { organisationId: requestedOp ?? orgIds[0], viewAsDelegate: false };
    }
  }

  return null;
}

export async function resolveEmploymentAccess(
  actor: CurrentUser,
  opts?: {
    participantId?: string | null;
    employerOrganisationId?: string | null;
  },
): Promise<ModuleAccessResult | null> {
  const requestedParticipant = opts?.participantId?.trim();
  const requestedEmployer = opts?.employerOrganisationId?.trim();
  const role = actor.primaryRole as MapAbleUserRole;

  if (isAdminRole(role)) {
    return {
      participantId: requestedParticipant,
      organisationId: requestedEmployer,
      viewAsDelegate: true,
    };
  }

  if (requestedParticipant) {
    if (actor.id === requestedParticipant) {
      return { participantId: requestedParticipant, viewAsDelegate: false };
    }
    const ok = await hasDelegateConsent(requestedParticipant, actor.id);
    if (!ok) return null;
    return { participantId: requestedParticipant, viewAsDelegate: true };
  }

  if (role === "participant" || actor.roles.includes("participant")) {
    return { participantId: actor.id, viewAsDelegate: false };
  }

  if (role === "employer" || role === "provider_admin") {
    const orgIds = await getUserOrganisationIds(actor.id);
    if (requestedEmployer && !orgIds.includes(requestedEmployer)) return null;
    if (orgIds.length > 0) {
      return {
        organisationId: requestedEmployer ?? orgIds[0],
        viewAsDelegate: false,
      };
    }
  }

  return null;
}
