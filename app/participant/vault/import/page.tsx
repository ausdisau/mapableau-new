import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function VaultImportPage() {
  const user = await requirePermission("portability:import:self");
  const jobs = await prisma.portabilityImportJob.findMany({
    where: { participantId: user.id },
    orderBy: { requestedAt: "desc" },
    take: 20,
  });
  return (
    <div className="mx-auto max-w-3xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Import a bundle</h1>
      <p className="text-sm">
        Imports never silently overwrite. Conflicts require your explicit
        resolution.
      </p>
      {jobs.length === 0 ? (
        <p className="text-sm">No import jobs yet.</p>
      ) : (
        <ul className="space-y-2">
          {jobs.map((j) => (
            <li key={j.id} className="rounded border p-3 text-sm">
              <div>Source: {j.sourceLabel}</div>
              <div>Status: {j.status}</div>
              <div>Requested: {j.requestedAt.toISOString().slice(0, 10)}</div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
