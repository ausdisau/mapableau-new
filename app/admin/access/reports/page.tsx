import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessReportsPage() {
  await requireAdmin();

  const pending = await prisma.accessModerationQueue.findMany({
    where: { status: "pending", entityType: "AccessPlaceReview" },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { review: { include: { place: true } } },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Access reports queue</h1>
        <Link href="/admin/access" className="text-sm underline">
          Back to Access admin
        </Link>
      </div>
      <ul className="space-y-4">
        {pending.map((item) => (
          <li key={item.id} className="rounded-lg border p-4">
            <p className="text-sm text-muted-foreground">{item.flagReason}</p>
            {item.review ? (
              <>
                <p className="font-medium">{item.review.place.name}</p>
                <p className="mt-2 text-sm">{item.review.reviewBody.slice(0, 200)}…</p>
                <Link
                  href={`/access/places/${item.review.placeId}`}
                  className="mt-2 inline-block text-sm underline"
                >
                  View place
                </Link>
              </>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
