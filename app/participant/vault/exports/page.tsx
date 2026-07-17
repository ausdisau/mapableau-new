import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VaultExportsPage() {
  const user = await requirePermission("portability:export:self");
  const jobs = await prisma.portabilityExportJob.findMany({
    where: { participantId: user.id },
    orderBy: { requestedAt: "desc" },
    take: 20,
  });
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Data exports</h1>
      <p className="text-sm">
        Portable bundles you have requested. Only you can request an export.
      </p>
      {jobs.length === 0 ? (
        <p className="text-sm">No export jobs yet.</p>
      ) : (
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li key={j.id} className="rounded border p-3 text-sm">
              <div>Scope: {j.scope}</div>
              <div>Status: {j.status}</div>
              <div>Requested: {j.requestedAt.toISOString().slice(0, 10)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
