import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessPlacesPage() {
  await requireAdmin();

  const places = await prisma.accessPlace.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      venueProfile: { select: { id: true } },
      _count: {
        select: {
          reviews: { where: { status: "published" } },
          alerts: { where: { status: "active" } },
        },
      },
    },
  });

  return (
    <div className="space-y-4 p-6">
      <h1 className="text-2xl font-bold">Access places</h1>
      <Link href="/admin/access" className="text-sm underline">
        Back to Access admin
      </Link>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b text-left">
            <th className="py-2">Name</th>
            <th className="py-2">Status</th>
            <th className="py-2">Reports</th>
            <th className="py-2">Alerts</th>
            <th className="py-2">Claimed</th>
          </tr>
        </thead>
        <tbody>
          {places.map((p) => (
            <tr key={p.id} className="border-b">
              <td className="py-2">
                <Link href={`/access/places/${p.id}`} className="underline">
                  {p.name}
                </Link>
              </td>
              <td className="py-2">{p.status}</td>
              <td className="py-2">{p._count.reviews}</td>
              <td className="py-2">{p._count.alerts}</td>
              <td className="py-2">{p.venueProfile ? "Yes" : "No"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
