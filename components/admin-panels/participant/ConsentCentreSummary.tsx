import Link from "next/link";

import { PanelSection } from "@/components/admin-panels/PanelSection";
import { StatusBadge } from "@/components/ui/status-badge";
import type { ConsentRecord, Organisation, User } from "@prisma/client";

type Record = ConsentRecord & {
  grantedToOrganisation: Pick<Organisation, "id" | "name"> | null;
  grantedToUser: Pick<User, "id" | "name"> | null;
};

export function ConsentCentreSummary({
  records,
  active,
  expiringSoon,
}: {
  records: Record[];
  active: number;
  expiringSoon: number;
}) {
  return (
    <PanelSection title="Consent centre">
      <p className="text-sm">
        <strong>{active}</strong> active grants
        {expiringSoon > 0 ? (
          <span className="text-amber-700"> · {expiringSoon} expiring within 30 days</span>
        ) : null}
      </p>
      <ul className="mt-4 space-y-2">
        {records.slice(0, 8).map((r) => (
          <li
            key={r.id}
            className="flex flex-wrap items-center justify-between gap-2 rounded-lg border border-border px-3 py-2 text-sm"
          >
            <span>
              {r.scope} →{" "}
              {r.grantedToOrganisation?.name ?? r.grantedToUser?.name ?? "—"}
            </span>
            <StatusBadge status={r.status} />
          </li>
        ))}
      </ul>
      <Link href="/dashboard/consent/new" className="mt-3 inline-block text-sm text-primary hover:underline">
        Grant new consent →
      </Link>
    </PanelSection>
  );
}
