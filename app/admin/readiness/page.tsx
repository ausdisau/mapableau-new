import Link from "next/link";

import { ReadinessGovernanceActions } from "@/components/admin/ReadinessGovernanceActions";
import { requireAdmin } from "@/lib/auth/guards";
import { getLaunchReadinessSummary } from "@/lib/launch-readiness/launch-readiness-service";
import { getPlatformGapAnalysisSummary } from "@/lib/platform-gaps/platform-gap-service";

export default async function ReadinessHubPage() {
  await requireAdmin();
  const [launch, gaps] = await Promise.all([
    getLaunchReadinessSummary(),
    getPlatformGapAnalysisSummary(),
  ]);

  const openCriticalGaps = gaps.gaps.filter(
    (g) =>
      (g.severity === "critical" || g.severity === "high") &&
      (g.effectiveStatus === "open" || g.effectiveStatus === "in_progress")
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-heading text-2xl font-bold">Readiness command center</h1>
        <p className="mt-2 text-muted-foreground">
          Unified view of launch checklist, platform gaps, and go-live gates.
        </p>
      </div>

      {!launch.productionReady ? (
        <div
          className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-amber-950 dark:bg-amber-950 dark:text-amber-100"
          role="alert"
        >
          <p className="font-semibold">Public launch gate: blocked</p>
          <p className="mt-1 text-sm">
            {launch.ready} of {launch.total} checklist items ready or waived.
            {openCriticalGaps > 0
              ? ` ${openCriticalGaps} critical/high platform gaps still open.`
              : null}
          </p>
          {launch.nextBlockers.length > 0 ? (
            <ol className="mt-3 list-decimal space-y-1 pl-5 text-sm">
              {launch.nextBlockers.map((b) => (
                <li key={b.code}>
                  <Link
                    href="/admin/launch-readiness"
                    className="font-medium underline-offset-2 hover:underline"
                  >
                    {b.title}
                  </Link>{" "}
                  ({b.gapSeverity})
                </li>
              ))}
            </ol>
          ) : null}
        </div>
      ) : (
        <p className="rounded-lg border border-green-600 bg-green-50 p-4 text-green-900">
          Checklist gate satisfied — proceed to governance go/no-go and gap
          disposition.
        </p>
      )}

      <div className="grid gap-4 md:grid-cols-2">
        <section className="rounded-lg border p-4">
          <h2 className="font-heading text-lg font-semibold">Launch checklist</h2>
          <p className="mt-1 text-2xl font-bold">{launch.percent}%</p>
          <p className="text-sm text-muted-foreground">
            {launch.ready} / {launch.total} ready or waived
          </p>
          <Link
            href="/admin/launch-readiness"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Manage checklist →
          </Link>
        </section>
        <section className="rounded-lg border p-4">
          <h2 className="font-heading text-lg font-semibold">Platform gaps</h2>
          <p className="mt-1 text-2xl font-bold">{openCriticalGaps}</p>
          <p className="text-sm text-muted-foreground">
            Critical/high gaps open or in progress
          </p>
          <Link
            href="/admin/platform-gaps"
            className="mt-3 inline-block text-sm font-medium text-primary underline-offset-2 hover:underline"
          >
            Triage gaps →
          </Link>
        </section>
      </div>

      <ReadinessGovernanceActions />

      <section>
        <h2 className="font-heading text-lg font-semibold">Quick links</h2>
        <ul className="mt-3 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
          {[
            { href: "/admin/integrations", label: "Integrations" },
            { href: "/admin/ndia-readiness", label: "NDIA readiness" },
            { href: "/admin/security-readiness", label: "Security" },
            { href: "/admin/public-beta", label: "Public beta" },
            { href: "/admin/community-governance", label: "Peer governance" },
            { href: "/admin/dr-exercises", label: "DR exercises" },
            { href: "/privacy", label: "Privacy policy (public)" },
            { href: "/terms", label: "Terms (public)" },
            { href: "/support", label: "Support SLAs" },
            { href: "/docs/full-public-launch.md", label: "Full launch guide" },
          ].map((link) => (
            <li key={link.href}>
              <Link
                href={link.href}
                className="text-sm text-primary underline-offset-2 hover:underline"
              >
                {link.label}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
