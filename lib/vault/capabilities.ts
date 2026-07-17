import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import {
  isVaultCapabilitiesEnabled,
  vaultConfig,
} from "@/lib/vault/config";
import { compileDisclosureRequest } from "@/lib/vault/disclosure-compiler";
import {
  getOrCreatePersonalVault,
  VaultDisabledError,
  VaultForbiddenError,
} from "@/lib/vault/registry";

function assertCapabilitiesEnabled() {
  if (!isVaultCapabilitiesEnabled()) {
    throw new VaultDisabledError("VAULT_CAPABILITIES_DISABLED");
  }
}

export async function listVaultCapabilities(ownerUserId: string) {
  assertCapabilitiesEnabled();
  const vault = await getOrCreatePersonalVault(ownerUserId);
  return prisma.vaultCapability.findMany({
    where: { vaultId: vault.id },
    orderBy: { issuedAt: "desc" },
  });
}

/**
 * Shadow-capable broker: compiles minimal fields and records a VaultCapability.
 * In shadow/demo mode status is always `shadow` and does not change live sharing.
 */
export async function requestVaultCapability(params: {
  ownerUserId: string;
  purposeCode: string;
  requestedFields: string[];
  itemId?: string;
  recipientOrganisationId?: string;
  recipientServiceId?: string;
  expiresAt?: Date;
}) {
  assertCapabilitiesEnabled();
  const compiled = compileDisclosureRequest({
    purposeCode: params.purposeCode,
    requestedFields: params.requestedFields,
  });

  if (compiled.permittedFields.length === 0) {
    return { compiled, capability: null as null };
  }

  const vault = await getOrCreatePersonalVault(params.ownerUserId);
  const shadow =
    vaultConfig.mode === "demo" ||
    vaultConfig.mode === "shadow" ||
    !vaultConfig.selectiveDisclosureEnabled;

  const capability = await prisma.vaultCapability.create({
    data: {
      vaultId: vault.id,
      itemId: params.itemId,
      holderUserId: params.ownerUserId,
      purposeCode: params.purposeCode,
      recipientOrganisationId: params.recipientOrganisationId,
      recipientServiceId: params.recipientServiceId,
      fieldSet: compiled.permittedFields,
      allowedOperations: ["read"],
      status: shadow ? "shadow" : "active",
      expiresAt:
        params.expiresAt ?? new Date(Date.now() + 6 * 60 * 60 * 1000),
      delegationRule: "non_transferable",
      onwardSharingRule: "prohibited",
      auditCorrelationId: crypto.randomUUID(),
    },
  });

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.capability_issued",
    entityType: "VaultCapability",
    entityId: capability.id,
    participantId: params.ownerUserId,
    metadata: {
      purposeCode: params.purposeCode,
      fieldCount: compiled.permittedFields.length,
      deniedCount: compiled.deniedFields.length,
      status: capability.status,
    },
  });

  return { compiled, capability };
}

export async function revokeVaultCapability(
  capabilityId: string,
  ownerUserId: string
) {
  assertCapabilitiesEnabled();
  const capability = await prisma.vaultCapability.findUnique({
    where: { id: capabilityId },
    include: { vault: true },
  });
  if (!capability) return null;
  if (capability.vault.ownerUserId !== ownerUserId) {
    throw new VaultForbiddenError("VAULT_CAPABILITY_CROSS_USER");
  }

  const updated = await prisma.vaultCapability.update({
    where: { id: capabilityId },
    data: { status: "revoked", revokedAt: new Date() },
  });

  await createAuditEvent({
    actorUserId: ownerUserId,
    action: "vault.capability_revoked",
    entityType: "VaultCapability",
    entityId: capabilityId,
    participantId: ownerUserId,
  });

  return updated;
}
