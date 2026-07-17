import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function FederationsPage() {
  await requirePermission("platform:federations:manage");
  const federations = await prisma.tenantFederation.findMany({
    include: {
      memberships: {
        include: { organisation: { select: { name: true } } },
      },
    },
    orderBy: { name: "asc" },
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Federations</h1>
        <p className="mt-2 max-w-3xl text-sm">
          Federations group tenants for governance and reporting. They do NOT
          grant cross-tenant data access.
        </p>
      </header>
      {federations.length === 0 ? (
        <p>No federations configured.</p>
      ) : (
        <ul className="space-y-3">
          {federations.map((f) => (
            <li key={f.id} className="rounded border p-3">
              <div className="flex justify-between">
                <strong>{f.name}</strong>
                <span className="text-xs">{f.type}</span>
              </div>
              <ul className="mt-2 text-sm">
                {f.memberships.map((m) => (
                  <li key={m.id}>
                    {m.organisation.name} · {m.role} · {m.status}
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
