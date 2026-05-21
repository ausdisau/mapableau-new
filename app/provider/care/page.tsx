import Link from "next/link";

import { StatusTextBadge } from "@/components/phase3/StatusTextBadge";
import { requireAuth } from "@/lib/auth/guards";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
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
      <h1 className="font-heading text-2xl font-bold">Assigned care requests</h1>
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
