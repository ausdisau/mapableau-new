import { MapAbleCard } from "@/components/shared/MapAbleModuleUi";
import { requirePermission } from "@/lib/auth/guards";
import { prisma } from "@/lib/prisma";

export default async function ProviderHomeModificationsPage() {
  const user = await requirePermission("provider:booking:respond");

  const projects = await prisma.homeModificationProject.findMany({
    where: { providerId: user.id },
    orderBy: { updatedAt: "desc" },
    take: 20,
    include: { milestones: true },
  });

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <h1 className="font-heading text-2xl font-bold">Home modification projects</h1>
      <MapAbleCard description="Assigned and enquired projects only">
        {projects.length === 0 ? (
          <p className="text-sm text-muted-foreground">No assigned projects.</p>
        ) : (
          <ul className="space-y-3">
            {projects.map((p) => (
              <li key={p.id} className="rounded-xl border p-4">
                <h2 className="font-medium">{p.title}</h2>
                <p className="text-sm text-muted-foreground">Status: {p.status}</p>
                <p className="text-sm">Milestones: {p.milestones.length}</p>
              </li>
            ))}
          </ul>
        )}
      </MapAbleCard>
    </div>
  );
}
