import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";

export const dynamic = "force-dynamic";

export default async function VaultDisputesPage() {
  await requirePermission("vault:read:self");
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Dispute access</h1>
      <p className="text-sm">
        If you believe someone accessed your data without a valid directive,
        raise a dispute. Disputes are reviewed by a human and never by AI.
      </p>
      <p className="text-sm">
        Wave 13 routes consequential decision challenges through the dedicated{" "}
        <Link href="/participant/appeals" className="underline">
          participant appeals pathway
        </Link>
        . Access disputes that involve a governed decision should use that page
        so non-retaliation, independent review and remedies are tracked.
      </p>
    </div>
  );
}
