import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccountabilityAiRegisterPage() {
  await requirePermission("accountability:manage_metrics");

  const rows = await prisma.accountabilityAiSystem.findMany({ orderBy: { name: "asc" } });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">AI systems register</h1>
      <ul className="space-y-2">
        {rows.map((s) => (
          <li key={s.id} className="rounded border p-3 text-sm">{s.name} · {s.status}</li>
        ))}
      </ul>
    </div>
  );

}
