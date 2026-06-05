import Link from "next/link";

import { ProviderWorkerInviteForm } from "@/components/provider/ProviderWorkerInviteForm";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requireAuth } from "@/lib/auth/guards";
import { hasPermission } from "@/lib/auth/permissions";
import { prisma } from "@/lib/prisma";

export default async function NewWorkerPage() {
  const user = await requireAuth();
  if (!hasPermission(user.primaryRole, "worker:manage:org")) {
    return <p className="p-8">You do not have permission to invite workers.</p>;
  }

  const orgIds = await getUserOrganisationIds(user.id);
  const organisations = await prisma.organisation.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true },
    orderBy: { name: "asc" },
  });

  if (organisations.length === 0) {
    return (
      <div className="space-y-4 p-4">
        <h1 className="font-heading text-2xl font-bold">Invite worker</h1>
        <p className="text-muted-foreground">
          You need an organisation membership before you can invite workers.
        </p>
        <Link href="/provider/workers" className="text-primary underline">
          Back to workers
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 py-8">
      <div>
        <Link href="/provider/workers" className="text-sm text-primary underline">
          ← Workers
        </Link>
        <h1 className="mt-2 font-heading text-2xl font-bold">Invite worker</h1>
        <p className="text-muted-foreground">
          Send an email invite so a support worker can join your organisation roster.
        </p>
      </div>
      <ProviderWorkerInviteForm organisations={organisations} />
    </div>
  );
}
