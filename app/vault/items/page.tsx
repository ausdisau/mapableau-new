import { VaultItemCard } from "@/components/vault/VaultItemCard";
import { requirePermission } from "@/lib/auth/guards";
import { isVaultItemRegistryEnabled } from "@/lib/vault/config";
import { listVaultItems } from "@/lib/vault/registry";

export default async function VaultItemsPage() {
  const user = await requirePermission("vault:read:self");

  if (!isVaultItemRegistryEnabled()) {
    return <p>Vault item registry is disabled.</p>;
  }

  const items = await listVaultItems(user.id);

  return (
    <section className="space-y-4" aria-labelledby="vault-items-title">
      <h2 id="vault-items-title" className="font-heading text-xl font-semibold">
        Vault items
      </h2>
      <ul className="space-y-3">
        {items.map((item) => (
          <VaultItemCard
            key={item.id}
            id={item.id}
            displayName={item.displayName}
            itemType={item.itemType}
            category={item.category}
            canonicalDomain={item.canonicalDomain}
            vaultTreatment={item.vaultTreatment}
            classification={item.classification}
          />
        ))}
      </ul>
    </section>
  );
}
