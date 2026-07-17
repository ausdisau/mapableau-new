import { createAuditEvent } from "@/lib/audit/audit-event-service";
import { prisma } from "@/lib/prisma";
import {
  isVaultEncryptedStoreEnabled,
  VAULT_NON_E2E_DISCLAIMER,
} from "@/lib/vault/config";
import {
  getOrCreatePersonalVault,
  VaultDisabledError,
} from "@/lib/vault/registry";

/**
 * Wave 6 scaffold: envelope metadata only.
 * Does not create production KMS keys or claim end-to-end encryption.
 */
export async function createEnvelopeMetadata(params: {
  ownerUserId: string;
  itemId?: string;
  encryptedPayloadReference?: string;
  keyReference?: string;
  keyVersion?: string;
  payloadHash?: string;
  metadataHash?: string;
}) {
  if (!isVaultEncryptedStoreEnabled()) {
    throw new VaultDisabledError("VAULT_ENCRYPTED_STORE_DISABLED");
  }

  if (!params.keyReference) {
    throw new Error("VAULT_KEY_REFERENCE_REQUIRED");
  }

  const vault = await getOrCreatePersonalVault(params.ownerUserId);
  const envelope = await prisma.vaultEncryptedEnvelope.create({
    data: {
      vaultId: vault.id,
      itemId: params.itemId,
      encryptedPayloadReference: params.encryptedPayloadReference,
      keyReference: params.keyReference,
      keyVersion: params.keyVersion ?? "1",
      payloadHash: params.payloadHash,
      metadataHash: params.metadataHash,
      algorithm: "aes-256-gcm",
    },
  });

  await createAuditEvent({
    actorUserId: params.ownerUserId,
    action: "vault.item_updated",
    entityType: "VaultEncryptedEnvelope",
    entityId: envelope.id,
    participantId: params.ownerUserId,
    metadata: {
      custodial: true,
      disclaimer: VAULT_NON_E2E_DISCLAIMER,
    },
  });

  return {
    envelope,
    disclaimer: VAULT_NON_E2E_DISCLAIMER,
  };
}
