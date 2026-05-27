import Link from "next/link";

import { AnalyticsPrivacyNotice } from "@/components/analytics/AnalyticsPrivacyNotice";
import { ExportSafetyNotice } from "@/components/data-governance/ExportSafetyNotice";
import { requirePermission } from "@/lib/auth/guards";
import { getUserOrganisationIds } from "@/lib/api/phase3-scope";
import { logDataAccess } from "@/lib/audit/data-access-log-service";
import { listReportRuns } from "@/lib/reports/report-runner-service";

export const metadata = { title: "Provider reports" };

export default async function ProviderReportsPage() {
  const user = await requirePermission("care:read:org");
  const orgIds = await getUserOrganisationIds(user.id);
  const organisationId = orgIds[0];

  if (organisationId) {
    await logDataAccess({
      actorUserId: user.id,
      actorRole: user.primaryRole,
      organisationId,
      entityType: "ReportRun",
      entityId: "provider_dashboard",
      sensitivityLevel: "internal",
      accessReason: "Provider reports dashboard",
      result: "allowed",
    });
  }

  const runs = organisationId
    ? await listReportRuns({ organisationId, limit: 10 })
    : [];

  return (
    <div className="space-y-6">
      <h1 className="font-heading text-2xl font-bold">Provider reports</h1>
      <AnalyticsPrivacyNotice />
      <ExportSafetyNotice />
      {!organisationId ? (
        <p className="text-muted-foreground">No organisation linked to your account.</p>
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            <Link
              href="/provider/audit"
              className="rounded-xl border border-border p-4 hover:bg-muted/30"
            >
              Organisation audit trail
            </Link>
          </div>
          <section>
            <h2 className="font-heading text-lg font-semibold">Recent report runs</h2>
            <ul className="mt-4 space-y-2">
              {runs.length === 0 ? (
                <li className="text-sm text-muted-foreground">No report runs yet.</li>
              ) : (
                runs.map((run) => (
                  <li key={run.id} className="rounded-lg border border-border px-4 py-3 text-sm">
                    {run.reportKey} · {run.status} ·{" "}
                    {new Date(run.createdAt).toLocaleString("en-AU")}
                  </li>
                ))
              )}
            </ul>
          </section>
        </>
      )}
    </div>
  );
}
