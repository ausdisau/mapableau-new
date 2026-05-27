import { ExportSafetyNotice } from "@/components/data-governance/ExportSafetyNotice";
import { ReportRunActions } from "@/components/reports/ReportRunActions";
import { listReportRuns } from "@/lib/reports/report-runner-service";

export const metadata = { title: "Finance reports" };

export default async function FinanceReportsPage() {
  const [billingRuns, planRuns] = await Promise.all([
    listReportRuns({ reportKey: "billing_finance", limit: 5 }),
    listReportRuns({ reportKey: "plan_manager_review", limit: 5 }),
  ]);

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Finance reports</h1>
        <p className="mt-1 text-muted-foreground">
          Billing and plan manager review aggregates. No bank or NDIS identifiers in exports.
        </p>
      </header>
      <ExportSafetyNotice />
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">Billing &amp; finance</h2>
        <ReportRunActions reportKey="billing_finance" canExport />
        <ul className="space-y-2">
          {billingRuns.map((run) => (
            <li key={run.id} className="rounded-lg border border-border px-4 py-3 text-sm">
              {run.status} · {new Date(run.createdAt).toLocaleString("en-AU")}
            </li>
          ))}
        </ul>
      </section>
      <section className="space-y-4">
        <h2 className="font-heading text-lg font-semibold">Plan manager review</h2>
        <ReportRunActions reportKey="plan_manager_review" />
        <ul className="space-y-2">
          {planRuns.map((run) => (
            <li key={run.id} className="rounded-lg border border-border px-4 py-3 text-sm">
              {run.status} · {new Date(run.createdAt).toLocaleString("en-AU")}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
