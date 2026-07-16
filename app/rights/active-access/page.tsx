import { ActiveCapabilityList } from "@/components/rights/ActiveCapabilityList";
import { RevokeLeaseButton } from "@/components/rights/RevokeLeaseButton";
import { requireAuth } from "@/lib/auth/guards";
import { isRightsLedgerEnabled, isRightsOsEnabled } from "@/lib/rights-os/config";
import { getActiveAccess } from "@/lib/rights-os/ledger/ledger-service";

export default async function ActiveAccessPage() {
  const user = await requireAuth();

  if (!isRightsOsEnabled() || !isRightsLedgerEnabled()) {
    return <p>Rights ledger is not enabled.</p>;
  }

  const access = await getActiveAccess(user.id);

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-xl font-semibold">Active access</h2>
      <p className="text-sm text-muted-foreground">
        These are time-limited permissions currently allowing access to your information.
        You can revoke at any time.
      </p>
      <ActiveCapabilityList
        leases={access.leases.map((l) => ({
          id: l.id,
          purposeCode: l.purposeCode,
          permittedFields: l.permittedFields,
          expiresAt: l.expiresAt,
          status: l.status,
        }))}
        capsules={access.capsules.map((c) => ({
          id: c.id,
          purposeCode: c.purposeCode,
          status: c.status,
          expiresAt: c.expiresAt,
        }))}
      />
      <ul className="space-y-2">
        {access.leases.map((lease) => (
          <li key={lease.id} className="flex items-center justify-between rounded border p-3">
            <span className="text-sm">{lease.purposeCode}</span>
            <RevokeLeaseButton leaseId={lease.id} />
          </li>
        ))}
      </ul>
    </div>
  );
}
