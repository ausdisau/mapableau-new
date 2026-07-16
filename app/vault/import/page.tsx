import { requirePermission } from "@/lib/auth/guards";
import { vaultConfig, VAULT_ESSENTIAL_SERVICES_NOTE } from "@/lib/vault/config";

export default async function VaultPage() {
  await requirePermission("vault:read:self");
  const enabled = vaultConfig.importEnabled;
  return (
    <section className="space-y-3" aria-labelledby="vault-section-title">
      <h2 id="vault-section-title" className="font-heading text-xl font-semibold">
        Import
      </h2>
      <p className="text-sm text-muted-foreground">
        Mode: {vaultConfig.mode}. This section flag is {enabled ? "on" : "off"}.
      </p>
      <p>{VAULT_ESSENTIAL_SERVICES_NOTE}</p>
      
      
      <p className="text-sm">
        APIs under <code>/api/vault</code> enforce the same server-side flags. Browser
        parameters cannot enable Vault enforcement.
      </p>
    </section>
  );
}
