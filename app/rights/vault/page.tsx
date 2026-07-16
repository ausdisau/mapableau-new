import { requireAuth } from "@/lib/auth/guards";
import {
  isPersonalVaultEnabled,
  isRightsOsEnabled,
} from "@/lib/rights-os/config";
import { getOrCreateVault } from "@/lib/rights-os/vault/vault-service";

export default async function VaultPage() {
  const user = await requireAuth();

  if (!isRightsOsEnabled() || !isPersonalVaultEnabled()) {
    return <p>Personal Access Vault is not enabled.</p>;
  }

  const vault = await getOrCreateVault(user.id);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Personal Access Vault</h2>
      <p className="text-sm text-muted-foreground">
        Your reusable sensitive information, encrypted and under your control.
      </p>
      <div className="rounded-lg border p-4 text-sm">
        <p>
          <span className="font-medium">Encryption:</span> {vault.encryptionState}
        </p>
        <p className="mt-1">
          <span className="font-medium">Items:</span> {vault.items.length}
        </p>
        <p className="mt-1">
          <span className="font-medium">Registered devices:</span> {vault.devices.length}
        </p>
      </div>
      <ul className="divide-y rounded-lg border">
        {vault.items.length === 0 ? (
          <li className="p-4 text-sm text-muted-foreground">No vault items yet.</li>
        ) : (
          vault.items.map((item) => (
            <li key={item.id} className="p-4">
              <p className="font-medium">{item.category}</p>
              <p className="text-sm text-muted-foreground">
                Source: {item.source} · Sensitivity: {item.sensitivity}
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
