import { requirePermission } from "@/lib/auth/guards";
import { describeRegionalPosture } from "@/lib/resilience/regions";
import { honestFailoverStatement, describeFailoverPosture } from "@/lib/resilience/failover";
import { prisma } from "@/lib/prisma";

export default async function SrePage() {
  await requirePermission("platform:sre:read");
  const catalogue = await prisma.serviceCatalogueEntry.findMany({
    orderBy: [{ criticality: "asc" }, { domain: "asc" }],
    take: 500,
  });
  const regional = describeRegionalPosture();
  const failover = honestFailoverStatement();
  const exercises = describeFailoverPosture();

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">SRE and resilience</h1>
        <p className="mt-2 max-w-3xl text-sm">
          Regional posture is <strong>{regional.currentRegion}</strong>. Active-active
          multi-region is <strong>{String(regional.activeActive)}</strong>. {regional.disclaimer}
        </p>
      </header>

      <section>
        <h2 className="font-semibold">Failover posture</h2>
        <p className="text-sm">{failover.statement}</p>
        <ul className="mt-2 text-sm">
          {exercises.map((e) => (
            <li key={e.name}>
              {e.name} · {e.outcome} · {e.notes ?? ""}
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-semibold">Service catalogue</h2>
        {catalogue.length === 0 ? (
          <p className="text-sm">No catalogue entries yet.</p>
        ) : (
          <ul className="mt-2 text-sm">
            {catalogue.map((s) => (
              <li key={s.id}>
                <strong>{s.name}</strong> · {s.domain} · {s.criticality}
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
