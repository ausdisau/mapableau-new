import type {
  MapAbleUserRole,
  OrganisationType,
  ProfileRoleStatus,
} from "@prisma/client";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { getDbClient } from "@/lib/db/db-client";
import { runInTransaction } from "@/lib/db/transaction-service";
import type { Profile } from "@/types/core";
import { roleRequiresApproval } from "@/types/roles";

export async function getProfileById(profileId: string): Promise<Profile | null> {
  const user = await getDbClient().user.findUnique({
    where: { id: profileId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      timezone: true,
      locale: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  if (!user) return null;
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    phone: user.phone,
    timezone: user.timezone,
    locale: user.locale,
    status: "active",
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

export async function assignProfileRole(params: {
  profileId: string;
  role: MapAbleUserRole;
  isPrimary?: boolean;
  actorUserId?: string;
}): Promise<{ id: string; status: ProfileRoleStatus }> {
  const status: ProfileRoleStatus = roleRequiresApproval(params.role)
    ? "pending"
    : "active";

  const assignment = await getDbClient().userRoleAssignment.upsert({
    where: {
      userId_role: { userId: params.profileId, role: params.role },
    },
    create: {
      userId: params.profileId,
      role: params.role,
      status,
      isPrimary: params.isPrimary ?? false,
      ...(status === "active" ? { approvedAt: new Date() } : {}),
    },
    update: {
      status,
      isPrimary: params.isPrimary,
    },
  });

  if (params.actorUserId) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "profile.role_assigned",
      entityType: "profile_roles",
      entityId: assignment.id,
      participantId: params.profileId,
      metadata: { role: params.role, status },
    });
  }

  return { id: assignment.id, status: assignment.status };
}

export async function linkOrganisationMember(params: {
  profileId: string;
  organisationId: string;
  role?: MapAbleUserRole;
  actorUserId?: string;
}): Promise<{ id: string }> {
  const member = await getDbClient().organisationMember.upsert({
    where: {
      userId_organisationId: {
        userId: params.profileId,
        organisationId: params.organisationId,
      },
    },
    create: {
      userId: params.profileId,
      organisationId: params.organisationId,
      role: params.role ?? "provider_admin",
    },
    update: {
      role: params.role ?? undefined,
    },
  });

  if (params.actorUserId) {
    await createAuditEvent({
      actorUserId: params.actorUserId,
      action: "organisation.member_linked",
      entityType: "organisation_members",
      entityId: member.id,
      organisationId: params.organisationId,
      metadata: { profileId: params.profileId },
    });
  }

  return { id: member.id };
}

export async function createOrganisationWithAudit(params: {
  name: string;
  organisationType: OrganisationType;
  actorUserId: string;
  abn?: string;
}) {
  return runInTransaction(async (tx) => {
    const org = await tx.organisation.create({
      data: {
        name: params.name,
        organisationType: params.organisationType,
        abn: params.abn,
      },
    });
    await tx.auditEvent.create({
      data: {
        actorUserId: params.actorUserId,
        action: "organisation.created",
        entityType: "organisations",
        entityId: org.id,
        organisationId: org.id,
      },
    });
    return org;
  });
}
