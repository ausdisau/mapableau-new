import Link from "next/link";

import { VaultItemCard } from "@/components/vault/VaultItemCard";
import { requirePermission } from "@/lib/auth/guards";
import {
  isVaultItemRegistryEnabled,
  VAULT_ESSENTIAL_SERVICES_NOTE,
  vaultConfig,
} from "@/lib/vault/config";
import {
  backfillAccessibilityProfileReference,
  getVaultOverview,
} from "@/lib/vault/registry";

export default async function VaultOverviewPage() {
  const user = await requirePermission("vault:read:self");

  if (!isVaultItemRegistryEnabled()) {
    return (
      <section className="space-y-4" aria-labelledby="vault-disabled-title">
        <h2 id="vault-disabled-title" className="font-heading text-xl font-semibold">
          Vault is not enabled
        </h2>
        <p>
          The Personal Access Vault registry is disabled in this environment
          (mode: {vaultConfig.mode}).
        </p>
        <p>{VAULT_ESSENTIAL_SERVICES_NOTE}</p>
        <p>
          Civic export and deletion requests remain available at{" "}
          <Link href="/data-vault" className="text-primary underline">
            Personal data vault
          </Link>
          .
        </p>
      </section>
    );
  }

  await backfillAccessibilityProfileReference(user.id).catch(() => null);
  const overview = await getVaultOverview(user.id);

  return (
    <section className="space-y-6" aria-labelledby="vault-overview-title">
      <div>
        <h2 id="vault-overview-title" className="font-heading text-xl font-semibold">
          Overview
        </h2>
        <p className="text-sm text-muted-foreground">
          Mode: {overview.vault.mode}. Reference-only items:{" "}
          {overview.referenceOnlyCount} of {overview.itemCount}.
        </p>
      </div>

      <p>{overview.essentialServicesNote}</p>

      <ul className="space-y-3">
        {overview.items.length === 0 ? (
          <li className="rounded border border-dashed p-4 text-sm">
            No Vault items indexed yet. Your Accessibility Profile will appear here
            when present.
          </li>
        ) : (
          overview.items.map((item) => <VaultItemCard key={item.id} {...item} />)
        )}
      </ul>

      <p>
        <Link href="/vault/items" className="text-primary underline">
          Browse all items
        </Link>
      </p>
    </section>
  );
}
