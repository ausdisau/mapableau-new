import { redirect } from "next/navigation";

import { PlatformAssuranceShell } from "@/components/admin/platform-assurance/PlatformAssuranceShell";
import { requireAdmin } from "@/lib/auth/guards";
import { isPlatformAssuranceEnabled } from "@/lib/config/platform-assurance";
import {
  formatScopeResultLabel,
  getAssuranceOverview,
} from "@/lib/platform-assurance";

export const dynamic = "force-dynamic";

export default async function PlatformAssuranceOverviewPage() {
  await requireAdmin();
  if (!isPlatformAssuranceEnabled()) {
    redirect("/admin?assurance=disabled");
  }

  const overview = await getAssuranceOverview();

  return (
    <PlatformAssuranceShell
      title="Platform assurance"
      description="Read-only inventory of regulatory sources, scope assessments, registration controls, and worker trust gaps. This centre does not register MapAble or issue legal conclusions."
      pathname="/admin/platform-assurance"
    >
      <section aria-labelledby="counts-heading" className="space-y-3">
        <h2 id="counts-heading" className="text-lg font-semibold">
          Inventory counts
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ["Sources", overview.counts.sources],
            ["Assessments", overview.counts.assessments],
            ["Open legal reviews", overview.counts.openLegalReviews],
            ["Controls not started", overview.counts.controlsNotStarted],
          ].map(([label, value]) => (
            <li key={label} className="rounded-lg border p-4">
              <p className="text-sm text-muted-foreground">{label}</p>
              <p className="text-2xl font-semibold tabular-nums">{value}</p>
            </li>
          ))}
        </ul>
      </section>

      <section aria-labelledby="recent-heading" className="space-y-3">
        <h2 id="recent-heading" className="text-lg font-semibold">
          Recent scope assessments
        </h2>
        {overview.recentAssessments.length === 0 ? (
          <p className="text-muted-foreground">
            No assessments yet. Create one from the Scope page.
          </p>
        ) : (
          <ul className="space-y-2">
            {overview.recentAssessments.map((a) => (
              <li key={a.id} className="rounded-lg border p-3">
                <p className="font-medium">{a.functionName}</p>
                <p className="text-sm text-muted-foreground">
                  {formatScopeResultLabel(a.result)} · status {a.status}
                </p>
              </li>
            ))}
          </ul>
        )}
      </section>
    </PlatformAssuranceShell>
  );
}
