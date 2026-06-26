import Link from "next/link";

import { AdminPlacesList } from "@/components/access/AdminPlacesList";
import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessPlacesPage() {
  await requireAdmin();

  const places = await prisma.accessPlace.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      _count: { select: { reviews: true, alerts: true } },
    },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Access places</h1>
        <Link href="/admin/access" className="text-sm underline">
          Back to Access admin
        </Link>
      </div>
      <AdminPlacesList
        places={places.map((p) => ({
          id: p.id,
          name: p.name,
          category: p.category,
          status: p.status,
          suburb: p.suburb,
          reviewCount: p._count.reviews,
          alertCount: p._count.alerts,
          updatedAt: p.updatedAt.toISOString(),
        }))}
      />
    </div>
  );
}
