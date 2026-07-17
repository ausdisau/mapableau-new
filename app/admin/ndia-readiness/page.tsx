import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { phase5Config } from "@/lib/config/phase5";
import { prisma } from "@/lib/prisma";

export default async function NdiaReadinessPage() {
  await requireAdmin();

  const bundles = await prisma.ndiaClaimEvidenceBundle.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      invoiceId: true,
      linkageStatus: true,
      status: true,
      billableItemIds: true,
    },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">NDIA API readiness</h1>
      <p className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-100">
        <strong>Not submitted to NDIA.</strong> Feature flags are not readiness. Evidence
        bundles require exact Wave 4 billable-item linkage; ambiguous or unsafe linkage
        cannot support approval.
      </p>
      <p className="text-sm">
        Also see{" "}
        <Link className="underline" href="/admin/assurance/ndia-application">
          NDIA digital partnership
        </Link>{" "}
        and{" "}
        <Link className="underline" href="/admin/assurance/go-live">
          go-live assessments
        </Link>
        .
      </p>
      <ul className="list-disc pl-6 text-sm">
        <li>
          Real submission:{" "}
          {phase5Config.ndiaRealSubmissionEnabled
            ? "enabled (should be false without certified activation)"
            : "disabled"}
        </li>
        <li>
          Readiness module: {phase5Config.ndiaReadinessEnabled ? "on" : "off"}
        </li>
      </ul>
      <section>
        <h2 className="font-semibold">Recent evidence bundles</h2>
        <ul className="mt-2 space-y-2 text-sm">
          {bundles.map((b) => (
            <li key={b.id}>
              {b.id.slice(0, 8)}… linkage={b.linkageStatus} status={b.status} items=
              {b.billableItemIds.length}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
