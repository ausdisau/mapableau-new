import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { remainingSystemsConfig } from "@/lib/config/remaining-systems";
import { prisma } from "@/lib/prisma";

export async function upsertOrganisationSsoConfig(params: {
  organisationId: string;
  tenantId?: string;
  clientId?: string;
  defaultRole?: string;
  actorId: string;
}) {
  if (!remainingSystemsConfig.enterpriseSsoEnabled) {
    throw new Error("SSO_DISABLED");
  }

  const config = await prisma.organisationSsoConfig.upsert({
    where: { organisationId: params.organisationId },
    create: {
      organisationId: params.organisationId,
      tenantId: params.tenantId,
      clientId: params.clientId,
      defaultRole: params.defaultRole ?? "provider_staff",
      active: false,
    },
    update: {
      tenantId: params.tenantId,
      clientId: params.clientId,
      defaultRole: params.defaultRole,
    },
  });

  await createAuditEvent({
    actorUserId: params.actorId,
    action: "sso.config_updated",
    entityType: "OrganisationSsoConfig",
    entityId: config.id,
    organisationId: params.organisationId,
  });

  return config;
}

export async function requestDomainVerification(
  organisationId: string,
  domain: string
) {
  return prisma.organisationVerifiedDomain.create({
    data: { organisationId, domain, status: "pending" },
  });
}

export async function createSsoAccessRequest(params: {
  userId: string;
  organisationId: string;
  requestedRole: string;
}) {
  return prisma.ssoAccessRequest.create({
    data: {
      userId: params.userId,
      organisationId: params.organisationId,
      requestedRole: params.requestedRole,
      status: "pending",
    },
  });
}

export async function reviewSsoAccessRequest(
  requestId: string,
  reviewerId: string,
  approve: boolean
) {
  const status = approve ? "approved" : "rejected";
  const request = await prisma.ssoAccessRequest.update({
    where: { id: requestId },
    data: { status, reviewedBy: reviewerId },
  });

  await createAuditEvent({
    actorUserId: reviewerId,
    action: approve ? "sso.access_approved" : "sso.access_rejected",
    entityType: "SsoAccessRequest",
    entityId: requestId,
  });

  return request;
}
