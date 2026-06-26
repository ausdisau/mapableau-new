import Link from "next/link";

import { requireAdmin } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccessAlertsPage() {
  await requireAdmin();

  const alerts = await prisma.accessAlert.findMany({
    where: { status: { in: ["active", "disputed"] } },
    orderBy: { createdAt: "desc" },
    take: 50,
    include: { place: true },
  });

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-wrap gap-4">
        <h1 className="text-2xl font-bold">Access alerts</h1>
        <Link href="/admin/access" className="text-sm underline">
          Back to Access admin
        </Link>
      </div>
      <ul className="space-y-4">
        {alerts.map((alert) => (
          <li key={alert.id} className="rounded-lg border p-4">
            <p className="font-medium">{alert.title}</p>
            <p className="text-sm capitalize text-muted-foreground">
              {alert.alertType.replace(/_/g, " ")} · {alert.status}
            </p>
            {alert.place ? (
              <Link
                href={`/access/places/${alert.place.id}`}
                className="mt-2 inline-block text-sm underline"
              >
                {alert.place.name}
              </Link>
            ) : null}
            {alert.description ? (
              <p className="mt-2 text-sm">{alert.description}</p>
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}
