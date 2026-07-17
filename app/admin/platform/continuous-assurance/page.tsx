import { requirePermission } from "@/lib/auth/guards";
import { evaluateContinuousAssurance } from "@/lib/continuous-assurance/evaluator";
import { prisma } from "@/lib/prisma";

export default async function ContinuousAssurancePage() {
  await requirePermission("platform:continuous-assurance:read");
  const tenants = await prisma.organisation.findMany({
    orderBy: { name: "asc" },
    take: 100,
    select: { id: true, name: true, tenantStatus: true },
  });
  const rows = await Promise.all(
    tenants.map(async (t) => ({
      ...t,
      snapshot: await evaluateContinuousAssurance(t.id),
    }))
  );

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Continuous assurance</h1>
        <p className="mt-2 max-w-3xl text-sm">
          A snapshot from Wave 6 assurance tables. This is not a certification
          report and does not imply GA approval.
        </p>
      </header>
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Tenant</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-right">Controls</th>
            <th className="p-2 text-right">Passing</th>
            <th className="p-2 text-right">Failing</th>
            <th className="p-2 text-right">Overdue</th>
            <th className="p-2 text-right">Exceptions</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr key={r.id} className="border-b">
              <td className="p-2">{r.name}</td>
              <td className="p-2">{r.tenantStatus}</td>
              <td className="p-2 text-right">{r.snapshot.totalControls}</td>
              <td className="p-2 text-right">{r.snapshot.passingControls}</td>
              <td className="p-2 text-right">{r.snapshot.failingControls}</td>
              <td className="p-2 text-right">{r.snapshot.overdueTests}</td>
              <td className="p-2 text-right">
                {r.snapshot.outstandingExceptions}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
