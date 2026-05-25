import { hash } from "bcryptjs";

import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { assignProfileRole } from "@/lib/db/profile-spine-service";
import { getDbClient } from "@/lib/db/db-client";
import type { MapAbleUserRole } from "@prisma/client";

export interface RegisterBaseInput {
  email: string;
  password: string;
  name: string;
  phone?: string;
}

export async function registerBaseProfile(input: RegisterBaseInput) {
  const existing = await getDbClient().user.findUnique({
    where: { email: input.email.toLowerCase() },
  });
  if (existing) {
    throw new Error("EMAIL_IN_USE");
  }

  const passwordHash = await hash(input.password, 12);
  const user = await getDbClient().user.create({
    data: {
      email: input.email.toLowerCase(),
      name: input.name,
      phone: input.phone,
      passwordHash,
      primaryRole: "participant",
    },
  });

  await createAuditEvent({
    actorUserId: user.id,
    action: "user.created",
    entityType: "profiles",
    entityId: user.id,
    metadata: { source: "registration.base" },
  });

  return user;
}

export async function completeRoleOnboarding(params: {
  profileId: string;
  role: MapAbleUserRole;
  actorUserId: string;
}) {
  const assignment = await assignProfileRole({
    profileId: params.profileId,
    role: params.role,
    isPrimary: true,
    actorUserId: params.actorUserId,
  });

  await getDbClient().user.update({
    where: { id: params.profileId },
    data: { primaryRole: params.role },
  });

  await createAuditEvent({
    actorUserId: params.actorUserId,
    action: "onboarding.role_selected",
    entityType: "profile_roles",
    entityId: assignment.id,
    participantId: params.profileId,
    metadata: { role: params.role, status: assignment.status },
  });

  return assignment;
}
