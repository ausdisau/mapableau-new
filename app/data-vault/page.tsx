import Link from "next/link";

import {
  CoreEmptyState,
  CorePageContainer,
  CorePageHeader,
  CoreRecordCard,
} from "@/components/core";
import { requirePermission } from "@/lib/auth/guards";
import { phase9Config } from "@/lib/config/phase9";
import { listVaultRequestsForUser } from "@/lib/personal-data-vault/vault-service";

export default async function DataVaultPage() {
  const user = await requirePermission("data_vault:self");
  const requests = await listVaultRequestsForUser(user.id).catch(() => []);

  return (
    <CorePageContainer variant="narrow">
      <CorePageHeader
        eyebrow="Your services"
        title="Personal data vault"
        description={
          phase9Config.personalDataVaultEnabled
            ? "Request export or portability of your data. Deletion requests require human review — POST /api/data-vault to queue a request."
            : "Data vault is disabled in this environment."
        }
      >
        <Link
          href="/dashboard"
          className="inline-flex text-sm font-medium text-primary hover:underline"
        >
          Back to control panel
        </Link>
      </CorePageHeader>
      {!phase9Config.personalDataVaultEnabled ? (
        <CoreEmptyState
          title="Data vault unavailable"
          description="This feature is not enabled in the current environment."
          actionHref="/dashboard"
          actionLabel="Return to control panel"
        />
      ) : requests.length === 0 ? (
        <CoreEmptyState
          title="No vault requests yet"
          description="Export or portability requests you submit will appear here with their status."
        />
      ) : (
        <ul className="space-y-4">
          {requests.map((r) => (
            <li key={r.id}>
              <CoreRecordCard
                title={`${r.requestType} — ${r.status}`}
                meta={r.createdAt.toLocaleDateString("en-AU")}
              />
            </li>
          ))}
        </ul>
      )}
    </CorePageContainer>
  );
}
