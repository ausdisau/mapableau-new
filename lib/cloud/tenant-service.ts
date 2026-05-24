import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export async function getOrCreateCloudTenant(organisationId: string, name: string) {
  if (!remainingSystemsConfig.cloudModuleEnabled) {
    throw new Error("CLOUD_DISABLED");
  }

  return prisma.cloudTenant.upsert({
    where: { organisationId },
    create: { organisationId, name },
    update: { name },
  });
}

export async function addTenantUser(
  tenantId: string,
  userId: string,
  role: string,
  actorId: string
) {
  const member = await prisma.tenantUser.upsert({
    where: { tenantId_userId: { tenantId, userId } },
    create: { tenantId, userId, role },
    update: { role },
  });

  await createAuditEvent({
    actorUserId: actorId,
    action: "cloud.tenant_user_added",
    entityType: "TenantUser",
    entityId: member.id,
  });

  return member;
}

export async function assertTenantAccess(tenantId: string, userId: string) {
  const member = await prisma.tenantUser.findUnique({
    where: { tenantId_userId: { tenantId, userId } },
  });
  if (!member) throw new Error("TENANT_ACCESS_DENIED");
  return member;
}
