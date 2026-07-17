import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { requirePermission } from "@/lib/auth/guards";
import { evaluateContinuousAssurance } from "@/lib/continuous-assurance/evaluator";
import { prisma } from "@/lib/prisma";

export default async function ProviderAssurancePage() {
  const user = await requirePermission("tenant:assurance:read");
  const orgIds = await getUserOrganisationIds(user.id);
  const orgs = await prisma.organisation.findMany({
    where: { id: { in: orgIds } },
    select: { id: true, name: true },
  });
  const rows = await Promise.all(
    orgs.map(async (o) => ({
      ...o,
      snapshot: await evaluateContinuousAssurance(o.id),
    }))
  );
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Assurance snapshot</h1>
        <p className="mt-2 max-w-3xl text-sm">
          Snapshot only. Not a certification report, not a GA decision. Feature
          flags do not equal assurance.
        </p>
      </header>
      {rows.length === 0 ? (
        <p>No organisations available.</p>
      ) : (
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b">
              <th className="p-2 text-left">Tenant</th>
              <th className="p-2 text-right">Controls</th>
              <th className="p-2 text-right">Passing</th>
              <th className="p-2 text-right">Failing</th>
              <th className="p-2 text-right">Exceptions</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-b">
                <td className="p-2">{r.name}</td>
                <td className="p-2 text-right">{r.snapshot.totalControls}</td>
                <td className="p-2 text-right">{r.snapshot.passingControls}</td>
                <td className="p-2 text-right">{r.snapshot.failingControls}</td>
                <td className="p-2 text-right">
                  {r.snapshot.outstandingExceptions}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
