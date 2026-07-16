type ActiveCapabilityListProps = {
  leases: Array<{
    id: string;
    purposeCode: string;
    permittedFields: string[];
    expiresAt: string | Date;
    status: string;
  }>;
  capsules: Array<{
    id: string;
    purposeCode: string;
    status: string;
    expiresAt: string | Date | null;
  }>;
  onRevokeLease?: (leaseId: string) => void;
};

export function ActiveCapabilityList({
  leases,
  capsules,
  onRevokeLease,
}: ActiveCapabilityListProps) {
  if (leases.length === 0 && capsules.length === 0) {
    return <p className="text-sm text-muted-foreground">No active access grants.</p>;
  }

  return (
    <div className="space-y-6">
      {leases.length > 0 ? (
        <section aria-labelledby="active-leases-heading">
          <h2 id="active-leases-heading" className="font-heading text-lg font-semibold">
            Active capability leases
          </h2>
          <ul className="mt-3 divide-y rounded-lg border">
            {leases.map((lease) => (
              <li key={lease.id} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <p className="font-medium">{lease.purposeCode}</p>
                  <p className="text-sm text-muted-foreground">
                    Fields: {lease.permittedFields.join(", ") || "none"}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(lease.expiresAt).toLocaleString("en-AU")}
                  </p>
                </div>
                {onRevokeLease ? (
                  <button
                    type="button"
                    className="rounded-md border px-3 py-2 text-sm font-medium hover:bg-muted"
                    onClick={() => onRevokeLease(lease.id)}
                  >
                    Revoke
                  </button>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {capsules.length > 0 ? (
        <section aria-labelledby="active-capsules-heading">
          <h2 id="active-capsules-heading" className="font-heading text-lg font-semibold">
            Active Access Capsules
          </h2>
          <ul className="mt-3 divide-y rounded-lg border">
            {capsules.map((capsule) => (
              <li key={capsule.id} className="p-4">
                <p className="font-medium">{capsule.purposeCode}</p>
                <p className="text-sm text-muted-foreground">Status: {capsule.status}</p>
                {capsule.expiresAt ? (
                  <p className="text-xs text-muted-foreground">
                    Expires {new Date(capsule.expiresAt).toLocaleString("en-AU")}
                  </p>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </div>
  );
}
