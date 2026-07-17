import {
  GovernanceAdminBoundary,
  ShellFormNotice,
} from "@/app/admin/governance/_components";
import { requirePermission } from "@/lib/auth/guards";
import { listAdminGovernedSystems } from "@/lib/public-interest-governance/governance-service";

export const dynamic = "force-dynamic";

export default async function AdminGovernanceAiaPage() {
  await requirePermission("governance:system:assess");
  const systems = await listAdminGovernedSystems({ nationalScope: true });

  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6">
      <header className="space-y-2">
        <h1 className="font-heading text-3xl font-bold">
          Algorithmic impact assessments
        </h1>
        <p className="text-sm text-muted-foreground">
          AIA lifecycle evidence for public-interest governance.
        </p>
      </header>
      <GovernanceAdminBoundary />
      <section className="rounded border p-4">
        <h2 className="font-semibold">Assess a system</h2>
        <ShellFormNotice endpoint="/api/admin/governance/systems/{id}/assess" />
        <form className="mt-3 grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <label>
            System ID
            <input className="mt-1 w-full rounded border p-2" name="systemId" />
          </label>
          <label>
            Summary
            <input className="mt-1 w-full rounded border p-2" name="summary" />
          </label>
        </form>
      </section>
      <section className="space-y-3">
        <h2 className="text-xl font-semibold">AIA readiness</h2>
        <ul className="space-y-3">
          {systems.map((system) => (
            <li key={system.id} className="rounded border p-4 text-sm">
              <p className="font-semibold">{system.displayName}</p>
              <p>
                Latest AIA: {system.latestAia?.status ?? "not started"} ·
                Published:{" "}
                {system.latestRegisterEntry?.publishedAt ?? "not published"}
              </p>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
