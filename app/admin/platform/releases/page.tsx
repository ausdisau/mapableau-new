import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function PlatformReleasesPage() {
  await requirePermission("platform:releases:read");
  const releases = await prisma.productionRelease.findMany({
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { deployments: true },
  });
  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold">Production releases</h1>
        <p className="mt-2 max-w-3xl text-sm">
          Rings advance ring_0 → ring_1 → ring_2 → ring_3 → ring_4. A release
          reaching ring_4_general requires an executive approval and does NOT
          imply that any specific tenant is GA-approved.
        </p>
      </header>

      {releases.length === 0 ? (
        <p>No releases recorded.</p>
      ) : (
        <ul className="space-y-3">
          {releases.map((r) => (
            <li key={r.id} className="rounded border p-3">
              <div className="flex justify-between">
                <strong>{r.title}</strong>
                <span className="font-mono text-xs">{r.releaseKey}</span>
              </div>
              <div className="text-sm">
                {r.targetRing} · {r.status} · deployments {r.deployments.length}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
