import Link from "next/link";

import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderWorkersPage() {
  const user = await requireAuth();
  const orgIds = await getUserOrganisationIds(user.id);
  const workers = await prisma.workerProfile.findMany({
    where: { organisationId: { in: orgIds } },
  });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Workers</h1>
      <Link href="/provider/workers/new" className="text-primary underline">
        Add worker
      </Link>
      <ul>
        {workers.map((w) => (
          <li key={w.id}>
            <Link href={`/provider/workers/${w.id}`}>{w.displayName}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
