import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const metadata = { title: "Care requests | MapAble Core" };

export default async function CareRequestsPage() {
  const user = await requireAuth();
  const requests = await prisma.careRequest.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <header className="flex flex-wrap justify-between gap-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Care requests</h1>
          <p className="text-muted-foreground">
            Request disability support services. Linked transport can be added
            after submission.
          </p>
        </div>
        <Link
          href="/dashboard/care/new"
          className="inline-flex min-h-11 items-center rounded-lg bg-primary px-4 font-medium text-primary-foreground focus-visible:ring-2 focus-visible:ring-ring"
        >
          New care request
        </Link>
      </header>
      {requests.length === 0 ? (
        <p role="status">No care requests yet.</p>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li key={r.id}>
              <Link
                href={`/dashboard/care/${r.id}`}
                className="block rounded-xl border border-border bg-card p-4 hover:border-primary/40 focus-visible:ring-2 focus-visible:ring-ring"
              >
                <div className="flex flex-wrap justify-between gap-2">
                  <span className="font-medium">{r.title}</span>
                  <StatusTextBadge status={r.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">
                  {r.requestType.replace(/_/g, " ")}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
