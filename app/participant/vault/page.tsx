import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { getOrDraftVault } from "@/lib/access-vault/vault";
import { listPackagesForParticipant } from "@/lib/access-vault/packages";
import { listActiveDirectivesForSubject } from "@/lib/consent-v2/directives";

export const dynamic = "force-dynamic";

export default async function ParticipantVaultPage() {
  const user = await requirePermission("vault:read:self");
  const vault = await getOrDraftVault(user.id);
  const packages = await listPackagesForParticipant(user.id);
  const activeDirectives = await listActiveDirectivesForSubject(user.id);

  return (
    <div className="mx-auto max-w-4xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">Your access vault</h1>
        <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
          <strong>Not a government record.</strong> MapAble credentials are
          platform attestations only. They are not NDIS credentials, not medical
          records and not disability status certificates. Federation to external
          apps is opt-in and simulator-only unless you have explicitly enabled
          it.
        </p>
      </header>

      <section className="rounded border p-4">
        <h2 className="font-heading text-lg font-semibold">Vault status</h2>
        <dl className="mt-2 grid grid-cols-2 gap-2 text-sm">
          <dt>Status</dt>
          <dd>{vault.status}</dd>
          <dt>Privacy default</dt>
          <dd>{vault.privacyModeDefault}</dd>
          <dt>External issuance opt-in</dt>
          <dd>{vault.externalIssuanceOptIn ? "Yes" : "No"}</dd>
          <dt>Active directives</dt>
          <dd>{activeDirectives.length}</dd>
          <dt>Data packages</dt>
          <dd>{packages.length}</dd>
        </dl>
      </section>

      <nav aria-label="Vault sections" className="grid grid-cols-2 gap-3 md:grid-cols-3">
        {[
          ["Packages", "/participant/vault/packages"],
          ["Consent", "/participant/vault/consent"],
          ["Access history", "/participant/vault/access-history"],
          ["Delegates", "/participant/vault/delegates"],
          ["Credentials", "/participant/vault/credentials"],
          ["Wallet", "/participant/vault/wallet"],
          ["Devices", "/participant/vault/devices"],
          ["Recovery", "/participant/vault/recovery"],
          ["Presentations", "/participant/vault/presentations"],
          ["Exports", "/participant/vault/exports"],
          ["Import", "/participant/vault/import"],
          ["Emergency", "/participant/vault/emergency"],
          ["Disputes", "/participant/vault/disputes"],
        ].map(([label, href]) => (
          <Link
            key={href}
            href={href}
            className="rounded border p-3 text-sm font-medium underline"
          >
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
