import Link from "next/link";

import { requireAuth } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function UnmetNeedsPage() {
  const user = await requireAuth();
  const records = await prisma.unmetNeedRecord.findMany({
    where: { participantId: user.id },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-4">
      <header className="flex justify-between">
        <h1 className="font-heading text-2xl font-bold">Unmet needs</h1>
        <Link href="/unmet-needs/new" className="min-h-11 rounded-lg bg-primary px-4 py-2 text-primary-foreground">
          Record a gap
        </Link>
      </header>
      <ul className="space-y-2">
        {records.map((r) => (
          <li key={r.id} className="rounded-lg border p-3 text-sm">
            {r.needType.replace(/_/g, " ")} — {r.status}
          </li>
        ))}
      </ul>
    </div>
  );
}
