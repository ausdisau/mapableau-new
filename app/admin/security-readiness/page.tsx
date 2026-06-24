import { requireAdmin } from "@/lib/auth/guards";
import {
  AUDIT_DISCLAIMER,
  controlsWithOpenGaps,
  IRAP_ISM_CONTROLS,
  SOC2_CONTROLS,
} from "@/lib/compliance-evidence/audit-control-catalog";
import { prisma } from "@/lib/prisma";

export default async function SecurityReadinessPage() {
  await requireAdmin();
  const frameworks = await prisma.securityFramework.findMany({
    include: { controls: { orderBy: { code: "asc" } } },
  });

  const openGaps = controlsWithOpenGaps();

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Security readiness</h1>
      <p className="text-muted-foreground">{AUDIT_DISCLAIMER}</p>
      <p className="text-sm text-muted-foreground">
        Dual-track register: SOC 2 TSC ({SOC2_CONTROLS.length} controls) and
        IRAP/ISM ({IRAP_ISM_CONTROLS.length} controls). Documentation in{" "}
        <code className="text-xs">docs/compliance/</code>.
      </p>

      <section className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900 dark:bg-amber-950/30">
        <h2 className="font-semibold">Open gaps ({openGaps.length})</h2>
        <ul className="mt-2 list-inside list-disc text-sm">
          {openGaps.slice(0, 8).map((c) => (
            <li key={c.code}>
              {c.code}: {c.title}
            </li>
          ))}
          {openGaps.length > 8 ? (
            <li className="text-muted-foreground">
              …and {openGaps.length - 8} more in docs/compliance/crosswalk.md
            </li>
          ) : null}
        </ul>
      </section>

      {frameworks.map((f) => (
        <section key={f.id} className="rounded-lg border p-4">
          <h2 className="font-semibold">{f.name}</h2>
          <p className="text-sm text-muted-foreground">
            {f.controls.length} controls tracked
          </p>
          <ul className="mt-2 space-y-1 text-sm">
            {f.controls.slice(0, 6).map((c) => (
              <li key={c.id}>
                <span className="font-mono text-xs">{c.code}</span> — {c.title}{" "}
                <span className="text-muted-foreground">({c.status})</span>
              </li>
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
