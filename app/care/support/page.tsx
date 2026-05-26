import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function CareSupportHubPage() {
  const user = await requirePermission("care:read:self");

  const [latestAssessment, openReferrals] = await Promise.all([
    prisma.supportNeedsAssessment.findFirst({
      where: { participantId: user.id },
      orderBy: { updatedAt: "desc" },
    }),
    prisma.supportReferral.count({
      where: {
        participantId: user.id,
        status: { in: ["submitted", "triaged", "accepted"] },
      },
    }),
  ]);

  return (
    <div className="space-y-8">
      <h1 className="font-heading text-3xl font-bold">Care &amp; support</h1>
      <p className="text-muted-foreground">
        Assess your support needs, request referrals, and see how services connect to your care
        bookings.
      </p>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <Link
          href="/care/support/assessment"
          className="rounded-lg border p-5 transition-colors hover:bg-muted/50"
        >
          <h2 className="font-semibold">My support needs</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {latestAssessment
              ? `Latest: ${latestAssessment.status.replace(/_/g, " ")}`
              : "Start your assessment"}
          </p>
        </Link>
        <Link
          href="/care/support/referrals"
          className="rounded-lg border p-5 transition-colors hover:bg-muted/50"
        >
          <h2 className="font-semibold">Referrals</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {openReferrals} open referral{openReferrals === 1 ? "" : "s"}
          </p>
        </Link>
        <Link
          href="/care/support/coordination"
          className="rounded-lg border p-5 transition-colors hover:bg-muted/50"
        >
          <h2 className="font-semibold">Coordination</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Timeline of assessments, referrals, and care activity
          </p>
        </Link>
      </div>

      <Link href="/care/bookings" className="text-sm text-primary underline">
        View care bookings
      </Link>
    </div>
  );
}
