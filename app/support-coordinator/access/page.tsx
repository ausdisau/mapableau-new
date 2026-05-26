import Link from "next/link";

import { CoordinatorAccessRequests } from "@/components/care-support/CoordinatorAccessRequests";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";
import { getCurrentUser } from "@/lib/auth/current-user";

export default async function CoordinatorAccessPage() {
  await requirePermission("care:read:self");
  const user = await getCurrentUser();
  if (!user) return null;

  const requests = await prisma.coordinatorAccessRequest.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return (
    <div className="space-y-6 p-4">
      <h1 className="font-heading text-2xl font-bold">Coordinator access requests</h1>
      <p className="text-muted-foreground">
        Approve support coordinators who have requested access to help coordinate your services.
      </p>
      <CoordinatorAccessRequests
        requests={requests.map((r) => ({
          ...r,
          createdAt: r.createdAt.toISOString(),
        }))}
      />
      <Link href="/dashboard/consent" className="text-sm text-primary underline">
        Manage consent settings
      </Link>
    </div>
  );
}
