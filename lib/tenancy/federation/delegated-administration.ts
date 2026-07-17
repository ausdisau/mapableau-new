import { prisma } from "@/lib/prisma";

export async function proposeDelegatedAuthority(input: {
  fromOrganisationId: string;
  toOrganisationId: string;
  scope: "operational_read" | "operational_write" | "billing_read" | "incident_read" | "reporting_read" | "service_management";
  reason: string;
  expiresAt?: Date;
}) {
  if (input.fromOrganisationId === input.toOrganisationId) {
    throw new Error("DELEGATED_AUTHORITY_SAME_TENANT_DENIED");
  }
  if (!input.reason || input.reason.trim().length < 20) {
    throw new Error("DELEGATED_AUTHORITY_REASON_TOO_SHORT");
  }
  return prisma.delegatedTenantAuthority.create({
    data: {
      fromOrganisationId: input.fromOrganisationId,
      toOrganisationId: input.toOrganisationId,
      scope: input.scope,
      reason: input.reason,
      expiresAt: input.expiresAt ?? null,
      status: "proposed",
    },
  });
}

export async function approveDelegatedAuthority(input: {
  id: string;
  approvedByUserId: string;
}) {
  const existing = await prisma.delegatedTenantAuthority.findUnique({
    where: { id: input.id },
  });
  if (!existing) throw new Error("DELEGATED_AUTHORITY_NOT_FOUND");
  if (existing.status !== "proposed") {
    throw new Error(`DELEGATED_AUTHORITY_INVALID_STATE:${existing.status}`);
  }
  return prisma.delegatedTenantAuthority.update({
    where: { id: input.id },
    data: {
      status: "active",
      approvedByUserId: input.approvedByUserId,
      approvedAt: new Date(),
      effectiveFrom: new Date(),
    },
  });
}

export async function isDelegatedAuthorityActive(
  fromOrganisationId: string,
  toOrganisationId: string,
  scope: "operational_read" | "operational_write" | "billing_read" | "incident_read" | "reporting_read" | "service_management"
): Promise<boolean> {
  const now = new Date();
  const row = await prisma.delegatedTenantAuthority.findFirst({
    where: {
      fromOrganisationId,
      toOrganisationId,
      scope,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
  });
  return Boolean(row);
}
