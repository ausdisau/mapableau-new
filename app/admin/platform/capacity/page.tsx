import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function PlatformCapacityPage() {
  await requirePermission("platform:capacity:read");
  const quotaProfiles = await prisma.tenantQuotaProfile.findMany({
    orderBy: { updatedAt: "desc" },
    take: 200,
    include: { organisation: { select: { name: true } } },
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Capacity and quotas</h1>
        <p className="mt-2 max-w-3xl text-sm">
          Quotas apply fair-share and back-pressure to each tenant. Quotas are
          operational — they do not authorise a feature; they cap it once
          entitled.
        </p>
      </header>
      {quotaProfiles.length === 0 ? (
        <p>No quota profiles configured.</p>
      ) : (
        <ul className="space-y-2 text-sm">
          {quotaProfiles.map((q) => (
            <li key={q.id}>
              <strong>{q.organisation.name}</strong> · {q.profileKey}
              {q.active ? " · active" : " · inactive"}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
