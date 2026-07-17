import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccountabilityCommitmentsPage() {
  await requirePermission("accountability:manage_metrics");

  const rows = await prisma.accountabilityCommitment.findMany({ orderBy: { updatedAt: "desc" }, take: 50 });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Commitments</h1>
      <ul className="space-y-2">
        {rows.map((c) => (
          <li key={c.id} className="rounded border p-3 text-sm">{c.title} · {c.status}</li>
        ))}
      </ul>
    </div>
  );

}
