import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderCarePage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const requests = await prisma.careRequest.findMany({
    where: { assignedOrganisationId: { in: orgIds } },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Care</h1>
      <nav className="flex flex-wrap gap-3 text-sm">
        <Link href="/provider/care/requests" className="underline">
          Request inbox
        </Link>
        <Link href="/provider/care/roster" className="underline">
          Roster
        </Link>
        <Link href="/provider/care/service-logs" className="underline">
          Service logs
        </Link>
        <Link href="/provider/care/allocations" className="underline">
          Allocation review
        </Link>
      </nav>
      <h2 className="text-lg font-semibold">Assigned care requests</h2>
      <ul className="space-y-3">
        {requests.map((r) => (
          <li key={r.id}>
            <Link href={`/provider/care/${r.id}`} className="block rounded-xl border p-4">
              {r.title}
              <StatusTextBadge status={r.status} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
