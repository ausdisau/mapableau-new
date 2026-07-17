import { requireAdminScope } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export const dynamic = "force-dynamic";

export default async function AdminFederationTrustRegistryPage() {
  await requireAdminScope("credential:trust:manage");
  const entries = await prisma.credentialTrustRegistryEntry.findMany({
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
  return (
    <div className="mx-auto max-w-5xl space-y-4 p-6">
      <h1 className="font-heading text-2xl font-bold">Trust registry</h1>
      <p className="rounded border-l-4 border-amber-500 bg-amber-50 p-3 text-sm">
        AI cannot approve trust registry changes. Every approval must be
        recorded to a named human operator.
      </p>
      {entries.length === 0 ? (
        <p className="text-sm">No entries yet.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr>
              <th className="text-left">Entity</th>
              <th className="text-left">Kind</th>
              <th className="text-left">Trust</th>
              <th className="text-left">Status</th>
            </tr>
          </thead>
          <tbody>
            {entries.map((e) => (
              <tr key={e.id} className="border-t">
                <td>{e.displayName}</td>
                <td>{e.entityKind}</td>
                <td>{e.trustLevel}</td>
                <td>{e.status}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
