import {
  GovernanceAdminBoundary,
  ShellFormNotice,
} from "@/app/admin/governance/_components";
import { requirePermission } from "@/lib/auth/guards";
import { listAdminGovernedSystems } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function AdminGovernanceSystemsPage() {
  await requirePermission("governance:system:manage");
  const systems = await listAdminGovernedSystems({ nationalScope: true });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">Governed systems</h1>
        <p className="text-sm text-muted-foreground">
          Explicit national-scope shell for register administration.
        </p>
      </header>
      <GovernanceAdminBoundary />
      <section className="rounded border p-4">
        <h2 className="font-semibold">Create system</h2>
        <ShellFormNotice endpoint="/api/admin/governance/systems" />
        <form className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <label>
            System key
            <input
              className="mt-1 w-full rounded border p-2"
              name="systemKey"
            />
          </label>
          <label>
            Display name
            <input
              className="mt-1 w-full rounded border p-2"
              name="displayName"
            />
          </label>
          <label>
            Owner team
            <input
              className="mt-1 w-full rounded border p-2"
              name="ownerTeam"
            />
          </label>
          <label>
            Incident contact
            <input
              className="mt-1 w-full rounded border p-2"
              name="incidentContact"
            />
          </label>
        </form>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">Systems</h2>
        {systems.length === 0 ? (
          <p className="rounded border border-dashed p-4 text-sm">
            No governed systems yet.
          </p>
        ) : (
          <ul className="space-y-3">
            {systems.map((system) => (
              <li key={system.id} className="rounded border p-4 text-sm">
                <p className="font-semibold">{system.displayName}</p>
                <p>{system.systemKey}</p>
                <p className="text-muted-foreground">
                  {system.status} · {system.systemType} · AIA{" "}
                  {system.latestAia?.status ?? "not started"}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}
