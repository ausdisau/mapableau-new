import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function AdminAccountabilityGovernancePage() {
  await requirePermission("accountability:manage_metrics");

  const rows = await prisma.accountabilityGovernanceDecision.findMany({ orderBy: { decisionDate: "desc" }, take: 50 });
  return (
    <div className="space-y-4">
      <h1 className="font-heading text-2xl font-bold">Governance decisions</h1>
      <ul className="space-y-2">
        {rows.map((d) => (
          <li key={d.id} className="rounded border p-3 text-sm">{d.questionConsidered}</li>
        ))}
      </ul>
    </div>
  );

}
