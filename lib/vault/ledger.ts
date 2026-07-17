import { prisma } from "@/lib/prisma";
import { isVaultLedgerEnabled } from "@/lib/vault/config";
import type { VaultLedgerEntry } from "@/lib/vault/types";
import { VaultDisabledError } from "@/lib/vault/registry";

const VAULT_ACTION_PREFIXES = ["vault.", "rights.vault_"];

function summarise(action: string, entityType: string): string {
  switch (action) {
    case "vault.created":
      return "Personal Access Vault created";
    case "vault.item_registered":
      return "Vault item registered";
    case "vault.item_routed":
      return "Vault item routed to canonical domain";
    case "vault.device_registered":
      return "Trusted Vault device registered";
    case "vault.device_revoked":
      return "Vault device revoked";
    case "vault.device_reported_lost":
      return "Vault device reported lost";
    case "vault.capability_issued":
      return "Capability issued (shadow or live)";
    case "vault.capability_revoked":
      return "Capability revoked";
    case "vault.disclosure_compiled":
      return "Disclosure compiled";
    case "vault.disclosure_approved":
      return "Disclosure approved";
    case "vault.recovery_started":
      return "Recovery started";
    case "vault.recovery_completed":
      return "Recovery completed";
    case "vault.export_created":
      return "Export package created";
    case "vault.import_received":
      return "Import received";
    case "vault.deletion_requested":
      return "Deletion requested";
    case "vault.deletion_completed":
      return "Deletion completed";
    default:
      return `${action} on ${entityType}`;
  }
}

export async function listVaultLedger(
  ownerUserId: string,
  options?: { itemId?: string; take?: number }
): Promise<VaultLedgerEntry[]> {
  if (!isVaultLedgerEnabled()) {
    throw new VaultDisabledError("VAULT_LEDGER_DISABLED");
  }

  const take = Math.min(options?.take ?? 50, 200);
  const events = await prisma.auditEvent.findMany({
    where: {
      participantId: ownerUserId,
      OR: VAULT_ACTION_PREFIXES.map((prefix) => ({
        action: { startsWith: prefix },
      })),
      ...(options?.itemId
        ? { entityId: options.itemId, entityType: "VaultItem" }
        : {}),
    },
    orderBy: { createdAt: "desc" },
    take,
    select: {
      id: true,
      action: true,
      entityType: true,
      entityId: true,
      createdAt: true,
      metadata: true,
    },
  });

  return events.map((e) => ({
    id: e.id,
    action: e.action,
    entityType: e.entityType,
    entityId: e.entityId,
    createdAt: e.createdAt.toISOString(),
    summary: summarise(e.action, e.entityType),
  }));
}
