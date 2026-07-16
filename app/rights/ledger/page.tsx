import { requireAuth } from "@/lib/auth/guards";
import { DownloadLedgerButton } from "@/components/rights/DownloadLedgerButton";
import { isRightsLedgerEnabled, isRightsOsEnabled } from "@/lib/rights-os/config";
import { getRightsHistory } from "@/lib/rights-os/ledger/ledger-service";

export default async function RightsLedgerPage() {
  const user = await requireAuth();

  if (!isRightsOsEnabled() || !isRightsLedgerEnabled()) {
    return <p>Rights ledger is not enabled.</p>;
  }

  const history = await getRightsHistory(user.id);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Rights ledger</h2>
      <p className="text-sm text-muted-foreground">
        Participant-readable replay of policy decisions, approvals, and disclosures.
        Sensitive payloads are not shown — only field manifests and outcomes.
      </p>
      <div className="rounded-lg border p-4">
        <p className="text-sm">
          <span className="font-medium">Events recorded:</span> {history.auditEvents.length}
        </p>
        <p className="text-sm">
          <span className="font-medium">Data-use requests:</span> {history.requests.length}
        </p>
      </div>
      <DownloadLedgerButton />
    </div>
  );
}
