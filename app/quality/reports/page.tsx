import { ExportSafetyNotice } from "@/components/data-governance/ExportSafetyNotice";
import { ReportRunActions } from "@/components/reports/ReportRunActions";
import { listReportRuns } from "@/lib/reports/report-runner-service";

export const metadata = { title: "Quality reports" };

export default async function QualityReportsPage() {
  const runs = await listReportRuns({ reportKey: "quality_safeguards", limit: 10 });

  return (
    <div className="space-y-8">
      <header>
        <h1 className="font-heading text-2xl font-bold">Quality &amp; safeguards reports</h1>
        <p className="mt-1 text-muted-foreground">
          Incident and complaint aggregates. No narratives or clinical notes are included.
        </p>
      </header>
      <ExportSafetyNotice />
      <ReportRunActions reportKey="quality_safeguards" />
      <section>
        <h2 className="font-heading text-lg font-semibold">Recent runs</h2>
        <ul className="mt-4 space-y-2">
          {runs.map((run) => (
            <li key={run.id} className="rounded-lg border border-border px-4 py-3 text-sm">
              {run.status} · {new Date(run.createdAt).toLocaleString("en-AU")}
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
