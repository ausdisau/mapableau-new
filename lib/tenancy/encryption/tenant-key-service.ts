import { prisma } from "@/lib/prisma";

/**
 * Manages TenantEncryptionProfile records. Does NOT create real cryptographic
 * material — that lives with an external KMS. This service records the
 * intent (algorithm, key reference, rotation cadence) and audits changes.
 */
export async function ensureEncryptionProfile(input: {
  organisationId: string;
  keyReference: string;
  kmsProvider?: string;
  algorithm?: "aes_256_gcm_envelope" | "aes_256_gcm_double_wrapped" | "external_kms_managed";
  rotationDays?: number;
}) {
  const existing = await prisma.tenantEncryptionProfile.findFirst({
    where: { organisationId: input.organisationId, active: true },
  });
  if (existing) return existing;

  return prisma.tenantEncryptionProfile.create({
    data: {
      organisationId: input.organisationId,
      algorithm: input.algorithm ?? "aes_256_gcm_envelope",
      keyReference: input.keyReference,
      kmsProvider: input.kmsProvider ?? null,
      rotationDays: input.rotationDays ?? 90,
      nextRotationAt: new Date(
        Date.now() + (input.rotationDays ?? 90) * 24 * 3600 * 1000
      ),
    },
  });
}
