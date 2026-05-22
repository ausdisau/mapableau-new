import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { phase9Config } from "@/lib/config/phase9";
import { listVaultRequestsForUser } from "@/lib/personal-data-vault/vault-service";

export default async function DataVaultPage() {
  const user = await requirePermission("data_vault:self");
  const requests = await listVaultRequestsForUser(user.id).catch(() => []);

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <h1 className="font-heading text-2xl font-bold">Personal data vault</h1>
      {!phase9Config.personalDataVaultEnabled ? (
        <p>Data vault is disabled in this environment.</p>
      ) : (
        <p className="text-muted-foreground">
          Request export or portability of your data. Deletion requests require
          human review — POST /api/data-vault to queue a request.
        </p>
      )}
      <Link href="/dashboard" className="text-sm text-primary underline">
        Back to dashboard
      </Link>
      <ul className="space-y-2">
        {requests.map((r) => (
          <li key={r.id} className="rounded border p-3 text-sm">
            {r.requestType} — {r.status}
            <span className="ml-2 text-xs text-muted-foreground">
              {r.createdAt.toLocaleDateString("en-AU")}
            </span>
          </li>
        ))}
      </ul>
    </main>
  );
}
