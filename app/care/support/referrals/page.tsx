import Link from "next/link";

import { ReferralActions } from "@/components/care-support/ReferralActions";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CareSupportReferralsPage() {
  const user = await requirePermission("care:read:self");

  const referrals = await prisma.supportReferral.findMany({
    where: { participantId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
  });

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-heading text-2xl font-bold">Referrals</h1>
        <Link
          href="/care/support/referrals/new"
          className="inline-flex rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground"
        >
          New referral
        </Link>
      </div>

      <ul className="space-y-4">
        {referrals.map((r) => (
          <li key={r.id} className="rounded-lg border p-4">
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-medium">{r.summary}</p>
                <p className="text-sm text-muted-foreground">
                  {r.referralType.replace(/_/g, " ")} — {r.status} — {r.priority}
                </p>
              </div>
            </div>
            <div className="mt-3">
              <ReferralActions referral={r} />
            </div>
          </li>
        ))}
        {referrals.length === 0 ? (
          <li className="text-sm text-muted-foreground">No referrals yet.</li>
        ) : null}
      </ul>
    </div>
  );
}
