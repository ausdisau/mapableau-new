import { prisma } from "@/lib/prisma";

export type EntitlementEnvironment = "sandbox" | "staging" | "limited_production" | "production";

export interface EntitlementInput {
  organisationId: string;
  featureKey: string;
  environment: EntitlementEnvironment;
  grantedById?: string;
  expiresAt?: Date | null;
  configJson?: unknown;
}

export async function grantEntitlement(input: EntitlementInput) {
  return prisma.tenantFeatureEntitlement.upsert({
    where: {
      organisationId_featureKey_environment: {
        organisationId: input.organisationId,
        featureKey: input.featureKey,
        environment: input.environment,
      },
    },
    create: {
      organisationId: input.organisationId,
      featureKey: input.featureKey,
      environment: input.environment,
      status: "active",
      grantedById: input.grantedById ?? null,
      grantedAt: new Date(),
      expiresAt: input.expiresAt ?? null,
      configJson: (input.configJson as never) ?? undefined,
    },
    update: {
      status: "active",
      grantedById: input.grantedById ?? null,
      grantedAt: new Date(),
      expiresAt: input.expiresAt ?? null,
      configJson: (input.configJson as never) ?? undefined,
    },
  });
}

export async function revokeEntitlement(input: {
  organisationId: string;
  featureKey: string;
  environment: EntitlementEnvironment;
}) {
  return prisma.tenantFeatureEntitlement.updateMany({
    where: {
      organisationId: input.organisationId,
      featureKey: input.featureKey,
      environment: input.environment,
    },
    data: { status: "revoked" },
  });
}

export async function getActiveEntitlement(input: {
  organisationId: string;
  featureKey: string;
  environment: EntitlementEnvironment;
}) {
  const now = new Date();
  const row = await prisma.tenantFeatureEntitlement.findUnique({
    where: {
      organisationId_featureKey_environment: {
        organisationId: input.organisationId,
        featureKey: input.featureKey,
        environment: input.environment,
      },
    },
  });
  if (!row) return null;
  if (row.status !== "active") return null;
  if (row.expiresAt && row.expiresAt.getTime() <= now.getTime()) return null;
  return row;
}

export async function listActiveEntitlements(organisationId: string) {
  const now = new Date();
  return prisma.tenantFeatureEntitlement.findMany({
    where: {
      organisationId,
      status: "active",
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
    },
    orderBy: { featureKey: "asc" },
  });
}
