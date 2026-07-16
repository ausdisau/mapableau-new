import { requirePermission } from "@/lib/auth/guards";
import {
  isVaultLedgerEnabled,
  vaultConfig,
  VAULT_ESSENTIAL_SERVICES_NOTE,
} from "@/lib/vault/config";
import { listVaultLedger } from "@/lib/vault/ledger";

export default async function VaultHistoryPage() {
  const user = await requirePermission("vault:read:self");

  if (!isVaultLedgerEnabled()) {
    return (
      <section className="space-y-3" aria-labelledby="vault-section-title">
        <h2 id="vault-section-title" className="font-heading text-xl font-semibold">
          History
        </h2>
        <p className="text-sm text-muted-foreground">
          Mode: {vaultConfig.mode}. Ledger flag is off.
        </p>
        <p>{VAULT_ESSENTIAL_SERVICES_NOTE}</p>
      </section>
    );
  }

  const entries = await listVaultLedger(user.id);

  return (
    <section className="space-y-4" aria-labelledby="vault-section-title">
      <h2 id="vault-section-title" className="font-heading text-xl font-semibold">
        History
      </h2>
      <p className="text-sm text-muted-foreground">
        Participant-readable Vault ledger projected from audit events. Sensitive
        payloads and key material are not shown.
      </p>
      <ol className="space-y-3">
        {entries.length === 0 ? (
          <li className="rounded border border-dashed p-3 text-sm">
            No Vault ledger events yet.
          </li>
        ) : (
          entries.map((entry) => (
            <li key={entry.id} className="rounded border border-border p-3 text-sm">
              <p className="font-medium">{entry.summary}</p>
              <p className="text-muted-foreground">
                {entry.action} · {new Date(entry.createdAt).toLocaleString("en-AU")}
              </p>
            </li>
          ))
        )}
      </ol>
    </section>
  );
}
