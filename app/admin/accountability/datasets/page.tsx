import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccountabilityDatasetsPage() {
  await requirePermission("accountability:manage_datasets");

  const rows = await prisma.accountabilityOpenDataset.findMany({ orderBy: { updatedAt: "desc" }, take: 50 });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Open datasets</h1>
      <ul className="space-y-2">
        {rows.map((d) => (
          <li key={d.id} className="rounded border p-3 text-sm">{d.title} · {d.status}</li>
        ))}
      </ul>
    </div>
  );

}
