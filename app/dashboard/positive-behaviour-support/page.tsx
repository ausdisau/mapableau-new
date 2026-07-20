import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { pbsConfig } from "@/lib/config/positive-behaviour-support";
import { PBS_POSITIONING } from "@/lib/positive-behaviour-support";
import { prisma } from "@/lib/prisma";

export const metadata = {
  title: "Positive Behaviour Support | Dashboard",
};
export const dynamic = "force-dynamic";

export default async function DashboardPbsPage() {
  if (!pbsConfig.enabled) {
    return (
      <div className="rounded-xl border border-border bg-card p-6">
        <h1 className="font-heading text-2xl font-bold">
          Positive Behaviour Support
        </h1>
        <p className="mt-2 text-muted-foreground">
          Controlled pilot is disabled. Set{" "}
          <code className="rounded bg-muted px-1">MAPABLE_PBS_ENABLED=true</code>{" "}
          to enable in non-production environments only after governance approval.
        </p>
      </div>
    );
  }

  const user = await requireAuth();
  const engagements = await prisma.pbsEngagement.findMany({
    where: { participantUserId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 50,
    include: {
      plans: {
        select: { id: true, status: true, planType: true },
        take: 5,
        orderBy: { updatedAt: "desc" },
      },
    },
  });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">
          Positive Behaviour Support
        </h1>
        <p className="mt-2 text-muted-foreground">{PBS_POSITIONING}</p>
        <p className="mt-2 text-sm">
          You remain the primary decision-maker. You can review, correct,
          disagree with, and challenge information. Chat or AI is never the only
          pathway.
        </p>
      </header>

      <nav className="flex flex-wrap gap-4 text-sm">
        <Link
          className="underline"
          href="/dashboard/positive-behaviour-support/profile"
        >
          Preferences profile
        </Link>
      </nav>

      <section aria-labelledby="engagements-heading">
        <h2 id="engagements-heading" className="text-lg font-semibold">
          Your engagements
        </h2>
        {engagements.length === 0 ? (
          <p className="mt-2 text-sm text-muted-foreground">
            No engagements yet.
          </p>
        ) : (
          <ul className="mt-4 space-y-3">
            {engagements.map((e) => (
              <li key={e.id} className="rounded-lg border p-4">
                <p className="font-medium">Engagement {e.id.slice(0, 8)}</p>
                <p className="text-sm text-muted-foreground">Status: {e.status}</p>
                <ul className="mt-2 space-y-1 text-sm">
                  {e.plans.map((p) => (
                    <li key={p.id}>
                      <Link
                        className="underline"
                        href={`/dashboard/positive-behaviour-support/plans/${p.id}`}
                      >
                        {p.planType} plan · {p.status}
                      </Link>
                    </li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
