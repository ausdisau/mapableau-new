import Link from "next/link";

import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function PlatformTenantsPage() {
  await requirePermission("platform:tenants:read");
  const tenants = await prisma.organisation.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    select: {
      id: true,
      name: true,
      tenantKey: true,
      tenantType: true,
      tenantStatus: true,
      operatingModel: true,
      jurisdiction: true,
      dataRegion: true,
      updatedAt: true,
    },
  });

  return (
    <div className="space-y-6">
      <header className="space-y-2">
        <h1 className="font-heading text-2xl font-bold">
          Platform tenants (Wave 8)
        </h1>
        <p className="max-w-3xl text-sm">
          Tenant status is operational metadata. It is not a certification, an
          entitlement, or general availability approval. Feature flags and
          environment variables do not enable a tenant.
        </p>
      </header>

      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b">
            <th className="p-2 text-left">Name</th>
            <th className="p-2 text-left">Tenant key</th>
            <th className="p-2 text-left">Type</th>
            <th className="p-2 text-left">Status</th>
            <th className="p-2 text-left">Model</th>
            <th className="p-2 text-left">Region</th>
            <th className="p-2 text-right">Actions</th>
          </tr>
        </thead>
        <tbody>
          {tenants.map((t) => (
            <tr key={t.id} className="border-b">
              <td className="p-2 font-medium">{t.name}</td>
              <td className="p-2 font-mono text-xs">{t.tenantKey ?? "—"}</td>
              <td className="p-2">{t.tenantType}</td>
              <td className="p-2">{t.tenantStatus}</td>
              <td className="p-2">{t.operatingModel}</td>
              <td className="p-2">{t.dataRegion}</td>
              <td className="p-2 text-right">
                <Link
                  className="underline"
                  href={`/admin/platform/tenants/${t.id}`}
                >
                  Open
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
